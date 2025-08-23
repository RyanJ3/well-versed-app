-- =====================================================
-- migrate-courses-to-new-structure.sql
-- Migration script to move from old JSONB structure to new normalized tables
-- =====================================================
SET search_path TO wellversed01DEV;

-- Start transaction
BEGIN;

-- Step 1: Create new table structure (inline)
-- Drop existing tables if they exist from old structure
DROP TRIGGER IF EXISTS lesson_type_consistency_trigger ON course_lessons;
DROP FUNCTION IF EXISTS ensure_lesson_type_consistency();
DROP VIEW IF EXISTS lesson_details;
DROP VIEW IF EXISTS course_overview;
DROP TABLE IF EXISTS quiz_flashcards;
DROP TABLE IF EXISTS quiz_lessons;
DROP TABLE IF EXISTS external_lessons;
DROP TABLE IF EXISTS article_lessons;
DROP TABLE IF EXISTS video_lessons;

-- Video lessons table
CREATE TABLE IF NOT EXISTS video_lessons (
    lesson_id INTEGER PRIMARY KEY REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
    youtube_url TEXT NOT NULL,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT video_url_format CHECK (
        youtube_url ~* '^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)[a-zA-Z0-9_-]+.*$'
    ),
    CONSTRAINT video_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

-- Article lessons table  
CREATE TABLE IF NOT EXISTS article_lessons (
    lesson_id INTEGER PRIMARY KEY REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
    article_text TEXT NOT NULL,
    reading_time_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT article_text_length CHECK (LENGTH(TRIM(article_text)) >= 100),
    CONSTRAINT reading_time_positive CHECK (reading_time_minutes IS NULL OR reading_time_minutes > 0)
);

-- External link lessons table
CREATE TABLE IF NOT EXISTS external_lessons (
    lesson_id INTEGER PRIMARY KEY REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
    external_url TEXT NOT NULL,
    external_title TEXT NOT NULL,
    external_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT external_url_format CHECK (external_url ~* '^https?://.*'),
    CONSTRAINT external_title_check CHECK (LENGTH(TRIM(external_title)) > 0)
);

-- Quiz lessons table
CREATE TABLE IF NOT EXISTS quiz_lessons (
    lesson_id INTEGER PRIMARY KEY REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
    verse_count INTEGER NOT NULL DEFAULT 5,
    pass_threshold INTEGER NOT NULL DEFAULT 85,
    randomize_questions BOOLEAN DEFAULT TRUE,
    time_limit_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT quiz_verse_count_range CHECK (verse_count >= 2 AND verse_count <= 7),
    CONSTRAINT quiz_pass_threshold_range CHECK (pass_threshold >= 50 AND pass_threshold <= 100),
    CONSTRAINT quiz_time_limit_positive CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0)
);

-- Quiz flashcards (moved from lesson_flashcards to be quiz-specific)
CREATE TABLE IF NOT EXISTS quiz_flashcards (
    flashcard_id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES quiz_lessons(lesson_id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    verse_codes TEXT[] NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT quiz_flashcard_reference_check CHECK (LENGTH(TRIM(reference)) > 0),
    CONSTRAINT quiz_flashcard_verse_codes_check CHECK (array_length(verse_codes, 1) > 0),
    CONSTRAINT quiz_flashcard_position_positive CHECK (position >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_lessons_lesson ON video_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_article_lessons_lesson ON article_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_external_lessons_lesson ON external_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_lessons_lesson ON quiz_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_flashcards_lesson ON quiz_flashcards(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_flashcards_position ON quiz_flashcards(lesson_id, position);

-- Step 2: Migrate existing data if old tables exist
DO $$
DECLARE
    lesson_record RECORD;
    content_data JSONB;
BEGIN
    -- Check if old course_lessons table exists with content_data column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'wellversed01dev' 
        AND table_name = 'course_lessons' 
        AND column_name = 'content_data'
    ) THEN
        RAISE NOTICE 'Migrating existing lesson data...';
        
        -- Loop through existing lessons
        FOR lesson_record IN 
            SELECT lesson_id, course_id, position, title, description, content_type, content_data, created_at
            FROM course_lessons
        LOOP
            -- Insert into base lessons table (if not already exists)
            INSERT INTO course_lessons (lesson_id, course_id, position, title, description, content_type, created_at)
            VALUES (lesson_record.lesson_id, lesson_record.course_id, lesson_record.position, 
                   lesson_record.title, lesson_record.description, lesson_record.content_type, lesson_record.created_at)
            ON CONFLICT (lesson_id) DO NOTHING;
            
            content_data := lesson_record.content_data;
            
            -- Migrate to appropriate specialized table
            CASE lesson_record.content_type
                WHEN 'video' THEN
                    INSERT INTO video_lessons (lesson_id, youtube_url)
                    VALUES (lesson_record.lesson_id, 
                           COALESCE(content_data->>'youtube_url', ''))
                    ON CONFLICT (lesson_id) DO NOTHING;
                    
                WHEN 'article' THEN
                    INSERT INTO article_lessons (lesson_id, article_text)
                    VALUES (lesson_record.lesson_id, 
                           COALESCE(content_data->>'article_text', ''))
                    ON CONFLICT (lesson_id) DO NOTHING;
                    
                WHEN 'external_link' THEN
                    INSERT INTO external_lessons (lesson_id, external_url, external_title, external_description)
                    VALUES (lesson_record.lesson_id, 
                           COALESCE(content_data->>'external_url', ''),
                           COALESCE(content_data->>'external_title', ''),
                           content_data->>'external_description')
                    ON CONFLICT (lesson_id) DO NOTHING;
                    
                WHEN 'quiz' THEN
                    INSERT INTO quiz_lessons (lesson_id, verse_count, pass_threshold, randomize_questions)
                    VALUES (lesson_record.lesson_id, 
                           COALESCE((content_data->'quiz_config'->>'verse_count')::INTEGER, 5),
                           COALESCE((content_data->'quiz_config'->>'pass_threshold')::INTEGER, 85),
                           COALESCE((content_data->'quiz_config'->>'randomize')::BOOLEAN, TRUE))
                    ON CONFLICT (lesson_id) DO NOTHING;
                    
                    -- Migrate quiz flashcards if they exist
                    IF content_data->'quiz_config'->'flashcards' IS NOT NULL THEN
                        INSERT INTO quiz_flashcards (lesson_id, reference, verse_codes, position)
                        SELECT 
                            lesson_record.lesson_id,
                            flashcard->>'reference',
                            ARRAY(SELECT jsonb_array_elements_text(flashcard->'verseCodes')),
                            (row_number() OVER()) - 1
                        FROM jsonb_array_elements(content_data->'quiz_config'->'flashcards') AS flashcard
                        ON CONFLICT DO NOTHING;
                    END IF;
                    
                ELSE
                    RAISE NOTICE 'Unknown content type: %', lesson_record.content_type;
            END CASE;
        END LOOP;
        
        -- Step 3: Drop old content_data column if migration was successful
        RAISE NOTICE 'Migration complete. You can now drop the old content_data column with:';
        RAISE NOTICE 'ALTER TABLE course_lessons DROP COLUMN IF EXISTS content_data;';
        RAISE NOTICE 'DROP TABLE IF EXISTS lesson_flashcards;';
        
    ELSE
        RAISE NOTICE 'No old structure found, new tables created successfully.';
    END IF;
END $$;

-- Update sequences to avoid conflicts
SELECT setval('course_lessons_lesson_id_seq', COALESCE(MAX(lesson_id), 1), true) FROM course_lessons;
SELECT setval('quiz_flashcards_flashcard_id_seq', COALESCE(MAX(flashcard_id), 1), true) FROM quiz_flashcards;

-- Verify data integrity
DO $$
DECLARE
    integrity_issues INTEGER;
BEGIN
    -- Check for lessons without corresponding type-specific data
    SELECT COUNT(*) INTO integrity_issues
    FROM course_lessons cl
    LEFT JOIN video_lessons vl ON cl.lesson_id = vl.lesson_id AND cl.content_type = 'video'
    LEFT JOIN article_lessons al ON cl.lesson_id = al.lesson_id AND cl.content_type = 'article'
    LEFT JOIN external_lessons el ON cl.lesson_id = el.lesson_id AND cl.content_type = 'external_link'
    LEFT JOIN quiz_lessons ql ON cl.lesson_id = ql.lesson_id AND cl.content_type = 'quiz'
    WHERE (cl.content_type = 'video' AND vl.lesson_id IS NULL)
       OR (cl.content_type = 'article' AND al.lesson_id IS NULL)
       OR (cl.content_type = 'external_link' AND el.lesson_id IS NULL)
       OR (cl.content_type = 'quiz' AND ql.lesson_id IS NULL);
       
    IF integrity_issues > 0 THEN
        RAISE NOTICE 'Warning: % lessons found without corresponding type-specific data', integrity_issues;
    ELSE
        RAISE NOTICE 'Data integrity check passed: all lessons have corresponding type-specific data';
    END IF;
END $$;

-- Commit transaction
COMMIT;

-- Show summary
SELECT 
    'Migration Summary' as info,
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM course_lessons) as total_lessons,
    (SELECT COUNT(*) FROM video_lessons) as video_lessons,
    (SELECT COUNT(*) FROM article_lessons) as article_lessons,
    (SELECT COUNT(*) FROM external_lessons) as external_lessons,
    (SELECT COUNT(*) FROM quiz_lessons) as quiz_lessons,
    (SELECT COUNT(*) FROM quiz_flashcards) as quiz_flashcards;