-- =====================================================
-- 06-populate-test-data.sql
-- Insert test data (run after all tables created)
-- =====================================================
SET search_path TO wellversed01DEV;

-- Create test decks
INSERT INTO decks (user_id, name, description, is_public) VALUES 
(1, 'Psalms of Praise', 'Popular psalms for memorization', true),
(1, 'Gospel Essentials', 'Key verses from the Gospels', true),
(1, 'Romans Road', 'Salvation verses from Romans', false)
ON CONFLICT DO NOTHING;

-- Add sample saved deck
INSERT INTO saved_decks (user_id, deck_id)
SELECT 1, deck_id FROM decks WHERE name = 'Psalms of Praise' AND is_public = true
ON CONFLICT DO NOTHING;
-- Add default memorized verses for test user

-- Genesis 1-5
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 1 AND chapter_number BETWEEN 1 AND 5
ON CONFLICT DO NOTHING;

-- Genesis 50:20
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 1 AND chapter_number = 50 AND verse_number = 20
ON CONFLICT DO NOTHING;

-- Exodus 1
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 2 AND chapter_number = 1
ON CONFLICT DO NOTHING;

-- Exodus 20:1-17
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 2 AND chapter_number = 20 AND verse_number BETWEEN 1 AND 17
ON CONFLICT DO NOTHING;

-- Numbers 6:22-23
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 4 AND chapter_number = 6 AND verse_number BETWEEN 22 AND 23
ON CONFLICT DO NOTHING;

-- Deuteronomy 6:4
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 5 AND chapter_number = 6 AND verse_number = 4
ON CONFLICT DO NOTHING;

-- Judges 21:25
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 7 AND chapter_number = 21 AND verse_number = 25
ON CONFLICT DO NOTHING;

-- 1 Samuel 1
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 9 AND chapter_number = 1
ON CONFLICT DO NOTHING;

-- 1 Chronicles 1
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 13 AND chapter_number = 1
ON CONFLICT DO NOTHING;

-- Job 1-2
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 18 AND chapter_number BETWEEN 1 AND 2
ON CONFLICT DO NOTHING;

-- Psalms selected chapters
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 19 AND chapter_number IN (1,2,3,4,5,6,16,19,23,24,34,42,67,90,100,103,115,119,127,128,130,145,148,150)
ON CONFLICT DO NOTHING;

-- Psalm 137:9
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 19 AND chapter_number = 137 AND verse_number = 9
ON CONFLICT DO NOTHING;

-- Proverbs selected chapters
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 20 AND chapter_number IN (1,2,3,5,6,7,31)
ON CONFLICT DO NOTHING;

-- Ecclesiastes 1-5 and 11
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 21 AND (chapter_number BETWEEN 1 AND 5 OR chapter_number = 11)
ON CONFLICT DO NOTHING;

-- Isaiah 64
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 23 AND chapter_number = 64
ON CONFLICT DO NOTHING;

-- Jonah 1-4
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 32 AND chapter_number BETWEEN 1 AND 4
ON CONFLICT DO NOTHING;

-- Amos 3:6
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 30 AND chapter_number = 3 AND verse_number = 6
ON CONFLICT DO NOTHING;

-- Matthew selected chapters
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 40 AND chapter_number IN (1,2,5,6,7,18,20,28)
ON CONFLICT DO NOTHING;

-- Mark 1:1-8
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 41 AND chapter_number = 1 AND verse_number BETWEEN 1 AND 8
ON CONFLICT DO NOTHING;

-- Luke 1:46-55 and chapter 15
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 42 AND ((chapter_number = 1 AND verse_number BETWEEN 46 AND 55) OR chapter_number = 15)
ON CONFLICT DO NOTHING;

-- John chapters 1-6 and 13
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 43 AND (chapter_number BETWEEN 1 AND 6 OR chapter_number = 13)
ON CONFLICT DO NOTHING;

-- John 11:35
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 43 AND chapter_number = 11 AND verse_number = 35
ON CONFLICT DO NOTHING;

-- John 14:1-14
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 43 AND chapter_number = 14 AND verse_number BETWEEN 1 AND 14
ON CONFLICT DO NOTHING;

-- John 15:5
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 43 AND chapter_number = 15 AND verse_number = 5
ON CONFLICT DO NOTHING;

-- Acts 1:8
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 44 AND chapter_number = 1 AND verse_number = 8
ON CONFLICT DO NOTHING;

-- Romans chapters 1-15
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 45 AND chapter_number BETWEEN 1 AND 15
ON CONFLICT DO NOTHING;

-- 1 Corinthians chapters 1-5 and 13
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 46 AND (chapter_number BETWEEN 1 AND 5 OR chapter_number = 13)
ON CONFLICT DO NOTHING;

-- 2 Corinthians chapter 4
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 47 AND chapter_number = 4
ON CONFLICT DO NOTHING;

-- Galatians chapters 1-3
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 48 AND chapter_number BETWEEN 1 AND 3
ON CONFLICT DO NOTHING;

-- Ephesians (entire book)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 49
ON CONFLICT DO NOTHING;

-- Philippians (entire book)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 50
ON CONFLICT DO NOTHING;

-- Colossians chapters 1 and 3
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 51 AND chapter_number IN (1,3)
ON CONFLICT DO NOTHING;

-- 1 Thessalonians (entire book)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 52
ON CONFLICT DO NOTHING;

-- 2 Thessalonians (entire book)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 53
ON CONFLICT DO NOTHING;

-- 1 Timothy chapters 1-3
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 54 AND chapter_number BETWEEN 1 AND 3
ON CONFLICT DO NOTHING;

-- 2 Timothy 3:16-17
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 55 AND chapter_number = 3 AND verse_number BETWEEN 16 AND 17
ON CONFLICT DO NOTHING;

-- Titus (entire book)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 56
ON CONFLICT DO NOTHING;

-- Hebrews chapter 1
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 58 AND chapter_number = 1
ON CONFLICT DO NOTHING;

-- James (entire book)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 59
ON CONFLICT DO NOTHING;

-- 1 Peter chapter 1
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 60 AND chapter_number = 1
ON CONFLICT DO NOTHING;

-- 1 John (entire book)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 62
ON CONFLICT DO NOTHING;

-- Jude (entire book)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 65
ON CONFLICT DO NOTHING;

-- Revelation chapters 1-3
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 66 AND chapter_number BETWEEN 1 AND 3
ON CONFLICT DO NOTHING;
