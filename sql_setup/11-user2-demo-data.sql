-- =====================================================
-- 11-user2-demo-data.sql
-- Demo data for a second user with decks, courses and tracker stats
-- =====================================================
SET search_path TO wellversed01DEV;

-- Ensure demo user 2 exists
INSERT INTO users (user_id, email, name, first_name, last_name, include_apocrypha, show_charts)
VALUES (2, 'demo2@example.com', 'Demo User2', 'Demo', 'User2', false, true)
ON CONFLICT (user_id) DO NOTHING;

-- -----------------------------------------------------
-- Flashcard decks for user 2
-- -----------------------------------------------------
INSERT INTO decks (user_id, name, description, is_public) VALUES
    (2, 'Grace Passages', 'Key verses about grace', true),
    (2, 'Psalm Favorites', 'Well-loved psalms', false),
    (2, 'Memory Gems', 'Short memorable verses', true)
ON CONFLICT DO NOTHING;

-- Grace Passages deck - Romans 3:23-24
WITH d AS (
    SELECT deck_id FROM decks WHERE user_id = 2 AND name = 'Grace Passages'
), v AS (
    SELECT id, verse_number FROM bible_verses
    WHERE book_id = 45 AND chapter_number = 3 AND verse_number BETWEEN 23 AND 24
), c AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
    SELECT d.deck_id, 'verse_range', 'Romans 3:23-24', MIN(v.id), MAX(v.id), 1
    FROM d, v
    GROUP BY d.deck_id
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT c.card_id, v.id, v.verse_number
FROM c, v
ORDER BY v.verse_number;

-- Psalm Favorites deck - Psalm 23:1
WITH d AS (
    SELECT deck_id FROM decks WHERE user_id = 2 AND name = 'Psalm Favorites'
), v AS (
    SELECT id FROM bible_verses
    WHERE book_id = 19 AND chapter_number = 23 AND verse_number = 1
), c AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, position)
    SELECT d.deck_id, 'single_verse', 'Psalm 23:1', v.id, 1
    FROM d, v
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT card_id, start_verse_id, 1
FROM c;

-- Memory Gems deck - John 11:35
WITH d AS (
    SELECT deck_id FROM decks WHERE user_id = 2 AND name = 'Memory Gems'
), v AS (
    SELECT id FROM bible_verses
    WHERE book_id = 43 AND chapter_number = 11 AND verse_number = 35
), c AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, position)
    SELECT d.deck_id, 'single_verse', 'John 11:35', v.id, 1
    FROM d, v
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT card_id, start_verse_id, 1
FROM c;

-- -----------------------------------------------------
-- Courses for user 2
-- -----------------------------------------------------
-- Course: Faith Journey
WITH c AS (
    INSERT INTO courses (user_id, name, description, is_public)
    VALUES (2, 'Faith Journey', 'Explore key steps of faith', true)
    RETURNING course_id
),
vid AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'Intro Video', 'Kick-off', 'video',
           jsonb_build_object('youtube_url', 'https://youtu.be/faithjourney')
    FROM c
    RETURNING lesson_id, course_id
),
art AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 2, 'Read About Faith', 'Short article', 'article',
           jsonb_build_object('article_text', 'Living by faith each day.')
    FROM c
    RETURNING lesson_id, course_id
)
INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
SELECT c.course_id, 3, 'Faith Quiz', 'Check understanding', 'quiz',
       jsonb_build_object('quiz_config', jsonb_build_object(
           'source_lessons', ARRAY[(SELECT lesson_id FROM vid), (SELECT lesson_id FROM art)],
           'verse_count', 2, 'pass_threshold', 80, 'randomize', true))
FROM c;

-- Course: Basics of Prayer
WITH c AS (
    INSERT INTO courses (user_id, name, description, is_public)
    VALUES (2, 'Basics of Prayer', 'Learn how to pray effectively', true)
    RETURNING course_id
),
vid AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'Prayer Video', 'Why pray?', 'video',
           jsonb_build_object('youtube_url', 'https://youtu.be/prayerbasic')
    FROM c
    RETURNING lesson_id, course_id
),
art AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 2, 'Prayer Article', 'Read on prayer', 'article',
           jsonb_build_object('article_text', 'Prayer draws us to God.')
    FROM c
    RETURNING lesson_id, course_id
)
INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
SELECT c.course_id, 3, 'Prayer Quiz', 'Assess learning', 'quiz',
       jsonb_build_object('quiz_config', jsonb_build_object(
           'source_lessons', ARRAY[(SELECT lesson_id FROM vid), (SELECT lesson_id FROM art)],
           'verse_count', 2, 'pass_threshold', 80, 'randomize', true))
FROM c;

-- Course: New Testament Survey
WITH c AS (
    INSERT INTO courses (user_id, name, description, is_public)
    VALUES (2, 'New Testament Survey', 'Overview of NT books', false)
    RETURNING course_id
),
vid AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'NT Video', 'Survey video', 'video',
           jsonb_build_object('youtube_url', 'https://youtu.be/ntsurvey')
    FROM c
    RETURNING lesson_id, course_id
),
art AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 2, 'NT Article', 'Read about the NT', 'article',
           jsonb_build_object('article_text', 'The NT tells the story of Jesus and the church.')
    FROM c
    RETURNING lesson_id, course_id
)
INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
SELECT c.course_id, 3, 'NT Quiz', 'Quiz on NT', 'quiz',
       jsonb_build_object('quiz_config', jsonb_build_object(
           'source_lessons', ARRAY[(SELECT lesson_id FROM vid), (SELECT lesson_id FROM art)],
           'verse_count', 3, 'pass_threshold', 80, 'randomize', true))
FROM c;

-- -----------------------------------------------------
-- Bible tracker stats for user 2
-- -----------------------------------------------------
-- Mark 12:30
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 41 AND chapter_number = 12 AND verse_number = 30
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 2, id, 5 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 41 AND chapter_number = 12 AND verse_number = 30
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 2, id, 70, 5 FROM v
ON CONFLICT DO NOTHING;

-- Psalm 119:11
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 19 AND chapter_number = 119 AND verse_number = 11
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 2, id, 3 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 19 AND chapter_number = 119 AND verse_number = 11
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 2, id, 60, 3 FROM v
ON CONFLICT DO NOTHING;

-- John 3:16
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 43 AND chapter_number = 3 AND verse_number = 16
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 2, id, 7 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 43 AND chapter_number = 3 AND verse_number = 16
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 2, id, 80, 7 FROM v
ON CONFLICT DO NOTHING;
