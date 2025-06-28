-- =====================================================
-- 09-create-course-progress.sql
-- Course enrollment and progress tracking
-- =====================================================
SET search_path TO wellversed01DEV;

-- Track which users are enrolled in which courses
CREATE TABLE course_enrollments (
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

CREATE INDEX idx_course_enrollment_user ON course_enrollments(user_id);
CREATE INDEX idx_course_enrollment_course ON course_enrollments(course_id);

-- Track user progress for each lesson
CREATE TABLE lesson_progress (
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

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- Flashcards tied to lessons
CREATE TABLE lesson_flashcards (
    flashcard_id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
    card_type VARCHAR(20) NOT NULL,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    verse_codes TEXT[],
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lesson_flashcards_lesson ON lesson_flashcards(lesson_id);
