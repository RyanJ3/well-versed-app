-- =====================================================
-- 10-populate-test-data.sql
-- Test data for development and testing
-- Only run with --test-data flag
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

-- Add memorized verses for test user
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

-- Exodus 20:1-17 (Ten Commandments)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 2 AND chapter_number = 20 AND verse_number BETWEEN 1 AND 17
ON CONFLICT DO NOTHING;

-- Psalms selected chapters (including Psalm 23)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 19 AND chapter_number IN (1,2,3,4,5,6,16,19,23,24,34,42,67,90,100,103,115,119,127,128,130,145,148,150)
ON CONFLICT DO NOTHING;

-- John 3:16
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 43 AND chapter_number = 3 AND verse_number = 16
ON CONFLICT DO NOTHING;

-- Romans chapters 1-15
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 45 AND chapter_number BETWEEN 1 AND 15
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

-- 1 John (entire book)
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE book_id = 62
ON CONFLICT DO NOTHING;

-- Add sample cards to decks
WITH psalm_23_verses AS (
    SELECT id, verse_number FROM bible_verses 
    WHERE book_id = 19 AND chapter_number = 23 AND verse_number <= 6
),
psalm_deck AS (
    SELECT deck_id FROM decks WHERE name = 'Psalms of Praise' LIMIT 1
),
inserted_card AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
    SELECT 
        pd.deck_id,
        'verse_range',
        'Psalms 23:1-6',
        MIN(pv.id),
        MAX(pv.id),
        1
    FROM psalm_deck pd, psalm_23_verses pv
    GROUP BY pd.deck_id
    ON CONFLICT DO NOTHING
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT 
    ic.card_id,
    pv.id,
    pv.verse_number
FROM inserted_card ic, psalm_23_verses pv
ON CONFLICT DO NOTHING;

-- Add John 3:16 to Gospel deck
WITH gospel_deck AS (
    SELECT deck_id FROM decks WHERE name = 'Gospel Essentials' LIMIT 1
),
john_verse AS (
    SELECT id FROM bible_verses 
    WHERE book_id = 43 AND chapter_number = 3 AND verse_number = 16
),
inserted_card AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, position)
    SELECT 
        gd.deck_id,
        'single_verse',
        'John 3:16',
        jv.id,
        1
    FROM gospel_deck gd, john_verse jv
    ON CONFLICT DO NOTHING
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT card_id, start_verse_id, 1
FROM inserted_card
ON CONFLICT DO NOTHING;

-- Add sample confidence scores for Psalm 23
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 
    1,
    id,
    CASE 
        WHEN verse_number <= 3 THEN 80
        ELSE 60
    END,
    CASE 
        WHEN verse_number <= 3 THEN 5
        ELSE 2
    END
FROM bible_verses
WHERE book_id = 19 AND chapter_number = 23 AND verse_number <= 6
ON CONFLICT DO NOTHING;
