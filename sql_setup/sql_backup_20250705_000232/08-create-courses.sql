-- =====================================================
-- 08-create-courses.sql
-- Course and lesson tables
-- =====================================================
SET search_path TO wellversed01DEV;

-- Main courses table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE course_tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE course_tag_map (
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES course_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, tag_id)
);

CREATE TABLE course_lessons (
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

-- Indexes
CREATE INDEX idx_courses_user ON courses(user_id);
CREATE INDEX idx_courses_public ON courses(is_public);
CREATE INDEX idx_lessons_course ON course_lessons(course_id);
CREATE INDEX idx_lessons_position ON course_lessons(course_id, position);
CREATE INDEX idx_course_tag_map_course ON course_tag_map(course_id);
CREATE INDEX idx_course_tag_name ON course_tags(tag_name);

-- Trigger for updated_at on courses
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
