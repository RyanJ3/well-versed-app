-- =====================================================
-- 07-create-courses.sql
-- Course system for structured Bible learning
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course lessons
CREATE TABLE IF NOT EXISTS course_lessons (
    lesson_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL,
    content_data JSONB,
    flashcards_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course enrollment
CREATE TABLE IF NOT EXISTS course_enrollments (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    current_lesson_id INTEGER REFERENCES course_lessons(lesson_id),
    current_lesson_position INTEGER DEFAULT 1,
    lessons_completed INTEGER DEFAULT 0,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, course_id)
);

-- Lesson progress tracking
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
    PRIMARY KEY (user_id, lesson_id)
);

-- Lesson flashcards
CREATE TABLE IF NOT EXISTS lesson_flashcards (
    flashcard_id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
    card_type VARCHAR(20) NOT NULL,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    verse_codes TEXT[],
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course tags
CREATE TABLE IF NOT EXISTS course_tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course-tag mapping
CREATE TABLE IF NOT EXISTS course_tag_map (
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES course_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_public ON courses(is_public);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_position ON course_lessons(course_id, position);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollment_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_flashcards_lesson ON lesson_flashcards(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_tag_map_course ON course_tag_map(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tag_name ON course_tags(tag_name);

-- Triggers
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
