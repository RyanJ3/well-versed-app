-- =====================================================
-- 10-populate-course-data.sql
-- Insert sample course data for testing
-- =====================================================
SET search_path TO wellversed01DEV;

-- Sample course data
WITH new_course AS (
    INSERT INTO courses (user_id, name, description, is_public)
    VALUES (1, 'Intro to Memorization', 'Learn how to memorize scripture effectively', true)
    RETURNING course_id
),
new_tag AS (
    INSERT INTO course_tags (tag_name) VALUES ('basics')
    ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name
    RETURNING tag_id
),
map_tag AS (
    INSERT INTO course_tag_map (course_id, tag_id)
    SELECT course_id, tag_id FROM new_course, new_tag
)
INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data, flashcards_required)
SELECT course_id, 1, 'Why Memorize Scripture?', 'Reasons for memorizing the Bible', 'text', '{"text":"Memorizing scripture helps you meditate on God"}'::jsonb, 0 FROM new_course
UNION ALL
SELECT course_id, 2, 'First Memory Challenge', 'Practice Romans Road verses', 'flashcards', '{"deck":"Romans Road"}'::jsonb, 5 FROM new_course;

-- Enroll the test user in the course and create lesson progress
WITH course_id AS (
    SELECT course_id FROM courses WHERE name = 'Intro to Memorization'
),
first_lesson AS (
    SELECT lesson_id FROM course_lessons WHERE course_id = (SELECT course_id FROM course_id) ORDER BY position LIMIT 1
)
INSERT INTO course_enrollments (user_id, course_id, current_lesson_id)
SELECT 1, course_id, first_lesson.lesson_id FROM course_id, first_lesson
ON CONFLICT DO NOTHING;

INSERT INTO lesson_progress (user_id, lesson_id, course_id, flashcards_required, flashcards_completed)
SELECT 1, lesson_id, course_id, flashcards_required, 0
FROM course_id
JOIN course_lessons USING (course_id)
ON CONFLICT DO NOTHING;
