-- =====================================================
-- 07-create-courses-new.sql
-- Improved course system with separate lesson type tables
-- =====================================================
SET search_path TO wellversed01DEV;

-- Main courses table
CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT courses_name_check CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT courses_description_check CHECK (LENGTH(TRIM(description)) > 0)
);

-- Base lessons table (common fields for all lesson types)
CREATE TABLE IF NOT EXISTS course_lessons (
    lesson_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'article', 'external_link', 'quiz')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT lessons_title_check CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT lessons_position_positive CHECK (position > 0),
    UNIQUE(course_id, position)
);

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

-- Course enrollment (unchanged)
CREATE TABLE IF NOT EXISTS course_enrollments (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    current_lesson_id INTEGER REFERENCES course_lessons(lesson_id),
    current_lesson_position INTEGER DEFAULT 1,
    lessons_completed INTEGER DEFAULT 0,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, course_id),
    
    CONSTRAINT enrollment_position_positive CHECK (current_lesson_position > 0),
    CONSTRAINT enrollment_completed_positive CHECK (lessons_completed >= 0)
);

-- Lesson progress tracking (unchanged)
CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    flashcards_required INTEGER DEFAULT 0,
    flashcards_completed INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT TRUE,
    quiz_attempts INTEGER DEFAULT 0,
    best_score INTEGER,
    last_attempt TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, lesson_id),
    
    CONSTRAINT progress_flashcards_positive CHECK (flashcards_required >= 0 AND flashcards_completed >= 0),
    CONSTRAINT progress_quiz_attempts_positive CHECK (quiz_attempts >= 0),
    CONSTRAINT progress_best_score_range CHECK (best_score IS NULL OR (best_score >= 0 AND best_score <= 100))
);

-- Course tags (unchanged)
CREATE TABLE IF NOT EXISTS course_tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT tag_name_format CHECK (LENGTH(TRIM(tag_name)) > 0 AND tag_name ~* '^[a-z0-9-]+$')
);

-- Course-tag mapping (unchanged)
CREATE TABLE IF NOT EXISTS course_tag_map (
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES course_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_public ON courses(is_public);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_position ON course_lessons(course_id, position);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON course_lessons(content_type);

CREATE INDEX IF NOT EXISTS idx_video_lessons_lesson ON video_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_article_lessons_lesson ON article_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_external_lessons_lesson ON external_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_lessons_lesson ON quiz_lessons(lesson_id);

CREATE INDEX IF NOT EXISTS idx_quiz_flashcards_lesson ON quiz_flashcards(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_flashcards_position ON quiz_flashcards(lesson_id, position);

CREATE INDEX IF NOT EXISTS idx_course_enrollment_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_tag_map_course ON course_tag_map(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tag_name ON course_tags(tag_name);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions to ensure lesson type consistency
CREATE OR REPLACE FUNCTION ensure_lesson_type_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- When inserting a lesson, ensure the corresponding type table gets an entry
    IF NEW.content_type = 'video' THEN
        -- Video lessons require a youtube_url, will be enforced by the application layer
        NULL;
    ELSIF NEW.content_type = 'article' THEN
        -- Article lessons require article_text, will be enforced by the application layer
        NULL;
    ELSIF NEW.content_type = 'external_link' THEN
        -- External lessons require external_url and external_title, will be enforced by the application layer
        NULL;
    ELSIF NEW.content_type = 'quiz' THEN
        -- Quiz lessons get default settings, will be enforced by the application layer
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lesson type consistency
DROP TRIGGER IF EXISTS lesson_type_consistency_trigger ON course_lessons;
CREATE TRIGGER lesson_type_consistency_trigger
    AFTER INSERT ON course_lessons
    FOR EACH ROW EXECUTE FUNCTION ensure_lesson_type_consistency();

-- Views for easy querying
CREATE OR REPLACE VIEW lesson_details AS
SELECT 
    cl.lesson_id,
    cl.course_id,
    cl.position,
    cl.title,
    cl.description,
    cl.content_type,
    cl.created_at,
    
    -- Video lesson data
    vl.youtube_url,
    vl.duration_minutes,
    
    -- Article lesson data
    al.article_text,
    al.reading_time_minutes,
    
    -- External lesson data
    el.external_url,
    el.external_title,
    el.external_description,
    
    -- Quiz lesson data
    ql.verse_count,
    ql.pass_threshold,
    ql.randomize_questions,
    ql.time_limit_minutes
    
FROM course_lessons cl
LEFT JOIN video_lessons vl ON cl.lesson_id = vl.lesson_id
LEFT JOIN article_lessons al ON cl.lesson_id = al.lesson_id
LEFT JOIN external_lessons el ON cl.lesson_id = el.lesson_id
LEFT JOIN quiz_lessons ql ON cl.lesson_id = ql.lesson_id;

-- View for course overview with lesson counts
CREATE OR REPLACE VIEW course_overview AS
SELECT 
    c.*,
    COALESCE(lesson_counts.total_lessons, 0) as total_lessons,
    COALESCE(lesson_counts.video_lessons, 0) as video_lessons,
    COALESCE(lesson_counts.article_lessons, 0) as article_lessons,
    COALESCE(lesson_counts.external_lessons, 0) as external_lessons,
    COALESCE(lesson_counts.quiz_lessons, 0) as quiz_lessons,
    u.username as creator_username
FROM courses c
LEFT JOIN users u ON c.user_id = u.user_id
LEFT JOIN (
    SELECT 
        course_id,
        COUNT(*) as total_lessons,
        COUNT(CASE WHEN content_type = 'video' THEN 1 END) as video_lessons,
        COUNT(CASE WHEN content_type = 'article' THEN 1 END) as article_lessons,
        COUNT(CASE WHEN content_type = 'external_link' THEN 1 END) as external_lessons,
        COUNT(CASE WHEN content_type = 'quiz' THEN 1 END) as quiz_lessons
    FROM course_lessons
    GROUP BY course_id
) lesson_counts ON c.course_id = lesson_counts.course_id;