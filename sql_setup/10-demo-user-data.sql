-- =====================================================
-- 10-demo-user-data.sql
-- Demo data for the main user with decks, courses, and tracker stats
-- =====================================================
SET search_path TO wellversed01DEV;

-- -----------------------------------------------------
-- Flashcard decks
-- -----------------------------------------------------
INSERT INTO decks (user_id, name, description, is_public) VALUES
    (1, 'Faith Foundations', 'Core verses about salvation by faith', true),
    (1, 'Proverbs Wisdom', 'Guidance from Proverbs', true),
    (1, 'Acts Highlights', 'Key moments from Acts', true),
    (1, 'Short Verses', 'Simple starter verses', false)
ON CONFLICT DO NOTHING;

-- Faith Foundations deck - Ephesians 2:8-9
WITH d AS (
    SELECT deck_id FROM decks WHERE user_id = 1 AND name = 'Faith Foundations'
), v AS (
    SELECT id, verse_number FROM bible_verses
    WHERE book_id = 49 AND chapter_number = 2 AND verse_number BETWEEN 8 AND 9
), c AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
    SELECT d.deck_id, 'verse_range', 'Ephesians 2:8-9', MIN(v.id), MAX(v.id), 1
    FROM d, v
    GROUP BY d.deck_id
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT c.card_id, v.id, v.verse_number
FROM c, v
ORDER BY v.verse_number;

-- Proverbs Wisdom deck - Proverbs 3:5-6
WITH d AS (
    SELECT deck_id FROM decks WHERE user_id = 1 AND name = 'Proverbs Wisdom'
), v AS (
    SELECT id, verse_number FROM bible_verses
    WHERE book_id = 20 AND chapter_number = 3 AND verse_number BETWEEN 5 AND 6
), c AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
    SELECT d.deck_id, 'verse_range', 'Proverbs 3:5-6', MIN(v.id), MAX(v.id), 1
    FROM d, v
    GROUP BY d.deck_id
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT c.card_id, v.id, v.verse_number
FROM c, v
ORDER BY v.verse_number;

-- Acts Highlights deck - Acts 1:8
WITH d AS (
    SELECT deck_id FROM decks WHERE user_id = 1 AND name = 'Acts Highlights'
), v AS (
    SELECT id FROM bible_verses
    WHERE book_id = 44 AND chapter_number = 1 AND verse_number = 8
), c AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, position)
    SELECT d.deck_id, 'single_verse', 'Acts 1:8', v.id, 1
    FROM d, v
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT card_id, start_verse_id, 1
FROM c;

-- Short Verses deck - 1 Thessalonians 5:16
WITH d AS (
    SELECT deck_id FROM decks WHERE user_id = 1 AND name = 'Short Verses'
), v AS (
    SELECT id FROM bible_verses
    WHERE book_id = 52 AND chapter_number = 5 AND verse_number = 16
), c AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, position)
    SELECT d.deck_id, 'single_verse', '1 Thessalonians 5:16', v.id, 1
    FROM d, v
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT card_id, start_verse_id, 1
FROM c;

-- -----------------------------------------------------
-- Courses and lessons
-- -----------------------------------------------------
-- Course 1: Prayer 101
WITH c AS (
    INSERT INTO courses (user_id, name, description, is_public)
    VALUES (1, 'Prayer 101', 'Basics of developing a prayer life', true)
    RETURNING course_id
),
vid AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'Prayer Basics Video', 'Introduction video', 'video',
           jsonb_build_object('youtube_url', 'https://youtu.be/prayer101')
    FROM c
    RETURNING lesson_id, course_id
),
art AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'Read About Prayer', 'Short article on prayer', 'article',
           jsonb_build_object('article_text', 'Prayer is our direct line to God.')
    FROM c
    RETURNING lesson_id, course_id
)
INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
SELECT c.course_id, 3, 'Prayer Quiz', 'Check your understanding', 'quiz',
       jsonb_build_object('quiz_config', jsonb_build_object(
           'source_lessons', ARRAY[(SELECT lesson_id FROM vid), (SELECT lesson_id FROM art)],
           'verse_count', 3, 'pass_threshold', 85, 'randomize', true))
FROM c;

-- Course 2: Gospel of John
WITH c AS (
    INSERT INTO courses (user_id, name, description, is_public)
    VALUES (1, 'Gospel of John', 'Overview of the life of Jesus', true)
    RETURNING course_id
),
vid AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'John Overview Video', 'Watch this summary', 'video',
           jsonb_build_object('youtube_url', 'https://youtu.be/john-overview')
    FROM c
    RETURNING lesson_id, course_id
),
art AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'Article: Themes in John', 'Key themes explained', 'article',
           jsonb_build_object('article_text', 'John emphasizes belief and life in Christ.')
    FROM c
    RETURNING lesson_id, course_id
)
INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
SELECT c.course_id, 3, 'John Quiz', 'Quiz on the gospel', 'quiz',
       jsonb_build_object('quiz_config', jsonb_build_object(
           'source_lessons', ARRAY[(SELECT lesson_id FROM vid), (SELECT lesson_id FROM art)],
           'verse_count', 3, 'pass_threshold', 85, 'randomize', true))
FROM c;

-- Course 3: Romans Road Study
WITH c AS (
    INSERT INTO courses (user_id, name, description, is_public)
    VALUES (1, 'Romans Road Study', 'Important verses from Romans', false)
    RETURNING course_id
),
vid AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'Romans Video', 'Watch overview', 'video',
           jsonb_build_object('youtube_url', 'https://youtu.be/romans-road')
    FROM c
    RETURNING lesson_id, course_id
),
art AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'Article: Salvation Explained', 'Article on salvation', 'article',
           jsonb_build_object('article_text', 'Romans explains salvation clearly.')
    FROM c
    RETURNING lesson_id, course_id
)
INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
SELECT c.course_id, 3, 'Romans Quiz', 'Quiz on Romans', 'quiz',
       jsonb_build_object('quiz_config', jsonb_build_object(
           'source_lessons', ARRAY[(SELECT lesson_id FROM vid), (SELECT lesson_id FROM art)],
           'verse_count', 3, 'pass_threshold', 85, 'randomize', true))
FROM c;

-- Course 4: Acts Adventure
WITH c AS (
    INSERT INTO courses (user_id, name, description, is_public)
    VALUES (1, 'Acts Adventure', 'Journey through Acts', true)
    RETURNING course_id
),
vid AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'Acts Intro Video', 'Introductory video', 'video',
           jsonb_build_object('youtube_url', 'https://youtu.be/acts-adventure')
    FROM c
    RETURNING lesson_id, course_id
),
art AS (
    INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
    SELECT course_id, 1, 'Article: Early Church', 'Growth of the early church', 'article',
           jsonb_build_object('article_text', 'Acts describes the spread of the Gospel.')
    FROM c
    RETURNING lesson_id, course_id
)
INSERT INTO course_lessons (course_id, position, title, description, content_type, content_data)
SELECT c.course_id, 3, 'Acts Quiz', 'Quiz on Acts', 'quiz',
       jsonb_build_object('quiz_config', jsonb_build_object(
           'source_lessons', ARRAY[(SELECT lesson_id FROM vid), (SELECT lesson_id FROM art)],
           'verse_count', 3, 'pass_threshold', 85, 'randomize', true))
FROM c;

-- -----------------------------------------------------
-- Bible tracker data for the main user
-- -----------------------------------------------------
-- John 3:16
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 43 AND chapter_number = 3 AND verse_number = 16
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 10 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 43 AND chapter_number = 3 AND verse_number = 16
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 90, 10 FROM v
ON CONFLICT DO NOTHING;

-- Psalm 23:1
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 19 AND chapter_number = 23 AND verse_number = 1
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 8 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 19 AND chapter_number = 23 AND verse_number = 1
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 80, 8 FROM v
ON CONFLICT DO NOTHING;

-- Romans 8:28
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 45 AND chapter_number = 8 AND verse_number = 28
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 3 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 45 AND chapter_number = 8 AND verse_number = 28
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 60, 3 FROM v
ON CONFLICT DO NOTHING;

-- Proverbs 3:5
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 20 AND chapter_number = 3 AND verse_number = 5
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 5 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 20 AND chapter_number = 3 AND verse_number = 5
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 70, 5 FROM v
ON CONFLICT DO NOTHING;

-- Acts 1:8
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 44 AND chapter_number = 1 AND verse_number = 8
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 2 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 44 AND chapter_number = 1 AND verse_number = 8
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 50, 2 FROM v
ON CONFLICT DO NOTHING;

-- Ephesians 2:8
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 49 AND chapter_number = 2 AND verse_number = 8
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 6 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 49 AND chapter_number = 2 AND verse_number = 8
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 75, 6 FROM v
ON CONFLICT DO NOTHING;

-- Additional tracked verses for variety
-- Genesis 1:1
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 1 AND chapter_number = 1 AND verse_number = 1
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 4 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 1 AND chapter_number = 1 AND verse_number = 1
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 60, 4 FROM v
ON CONFLICT DO NOTHING;

-- Exodus 20:13
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 2 AND chapter_number = 20 AND verse_number = 13
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 2 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 2 AND chapter_number = 20 AND verse_number = 13
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 50, 2 FROM v
ON CONFLICT DO NOTHING;

-- Psalm 119:105
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 19 AND chapter_number = 119 AND verse_number = 105
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 7 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 19 AND chapter_number = 119 AND verse_number = 105
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 80, 7 FROM v
ON CONFLICT DO NOTHING;

-- Isaiah 40:31
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 23 AND chapter_number = 40 AND verse_number = 31
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 3 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 23 AND chapter_number = 40 AND verse_number = 31
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 65, 3 FROM v
ON CONFLICT DO NOTHING;

-- Matthew 28:19
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 40 AND chapter_number = 28 AND verse_number = 19
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 5 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 40 AND chapter_number = 28 AND verse_number = 19
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 70, 5 FROM v
ON CONFLICT DO NOTHING;

-- Luke 2:11
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 42 AND chapter_number = 2 AND verse_number = 11
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 1 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 42 AND chapter_number = 2 AND verse_number = 11
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 40, 1 FROM v
ON CONFLICT DO NOTHING;

-- John 1:1
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 43 AND chapter_number = 1 AND verse_number = 1
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 6 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 43 AND chapter_number = 1 AND verse_number = 1
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 75, 6 FROM v
ON CONFLICT DO NOTHING;

-- Acts 2:38
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 44 AND chapter_number = 2 AND verse_number = 38
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 3 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 44 AND chapter_number = 2 AND verse_number = 38
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 60, 3 FROM v
ON CONFLICT DO NOTHING;

-- Romans 10:9
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 45 AND chapter_number = 10 AND verse_number = 9
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 4 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 45 AND chapter_number = 10 AND verse_number = 9
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 70, 4 FROM v
ON CONFLICT DO NOTHING;

-- 1 Corinthians 13:4
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 46 AND chapter_number = 13 AND verse_number = 4
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 3 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 46 AND chapter_number = 13 AND verse_number = 4
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 65, 3 FROM v
ON CONFLICT DO NOTHING;

-- Galatians 2:20
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 48 AND chapter_number = 2 AND verse_number = 20
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 5 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 48 AND chapter_number = 2 AND verse_number = 20
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 75, 5 FROM v
ON CONFLICT DO NOTHING;

-- Philippians 4:13
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 50 AND chapter_number = 4 AND verse_number = 13
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 8 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 50 AND chapter_number = 4 AND verse_number = 13
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 85, 8 FROM v
ON CONFLICT DO NOTHING;

-- Colossians 3:23
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 51 AND chapter_number = 3 AND verse_number = 23
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 4 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 51 AND chapter_number = 3 AND verse_number = 23
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 70, 4 FROM v
ON CONFLICT DO NOTHING;

-- 1 Thessalonians 5:17
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 52 AND chapter_number = 5 AND verse_number = 17
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 2 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 52 AND chapter_number = 5 AND verse_number = 17
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 50, 2 FROM v
ON CONFLICT DO NOTHING;

-- Hebrews 11:1
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 58 AND chapter_number = 11 AND verse_number = 1
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 5 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 58 AND chapter_number = 11 AND verse_number = 1
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 80, 5 FROM v
ON CONFLICT DO NOTHING;

-- James 1:2
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 59 AND chapter_number = 1 AND verse_number = 2
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 3 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 59 AND chapter_number = 1 AND verse_number = 2
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 60, 3 FROM v
ON CONFLICT DO NOTHING;

-- 1 Peter 5:7
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 60 AND chapter_number = 5 AND verse_number = 7
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 4 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 60 AND chapter_number = 5 AND verse_number = 7
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 70, 4 FROM v
ON CONFLICT DO NOTHING;

-- 1 John 4:8
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 62 AND chapter_number = 4 AND verse_number = 8
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 2 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 62 AND chapter_number = 4 AND verse_number = 8
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 55, 2 FROM v
ON CONFLICT DO NOTHING;

-- Revelation 3:20
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 66 AND chapter_number = 3 AND verse_number = 20
)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 1, id, 3 FROM v
ON CONFLICT DO NOTHING;
WITH v AS (
    SELECT id FROM bible_verses WHERE book_id = 66 AND chapter_number = 3 AND verse_number = 20
)
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, id, 65, 3 FROM v
ON CONFLICT DO NOTHING;
