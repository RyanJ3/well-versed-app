-- =====================================================
-- 07-test-data.sql
-- Insert test data after all tables are created
-- =====================================================
SET search_path TO wellversed01DEV;

-- Create a few test decks if none exist
INSERT INTO decks (user_id, name, description, is_public) VALUES 
(1, 'Psalms of Praise', 'Popular psalms for memorization', true),
(1, 'Gospel Essentials', 'Key verses from the Gospels', true),
(1, 'Romans Road', 'Salvation verses from Romans', false)
ON CONFLICT DO NOTHING;

-- Add verses to Psalms deck (Psalm 23:1-6)
-- Note: This assumes bible_verses table is already populated
WITH psalm_23_verses AS (
    SELECT id, verse_number FROM bible_verses 
    WHERE book_id = 19 AND chapter_number = 23 AND verse_number <= 6
),
psalm_deck AS (
    SELECT deck_id FROM decks WHERE name = 'Psalms of Praise'
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
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT 
    ic.card_id,
    pv.id,
    pv.verse_number
FROM inserted_card ic, psalm_23_verses pv
ORDER BY pv.verse_number;

-- Add John 3:16 to Gospel deck
WITH gospel_deck AS (
    SELECT deck_id FROM decks WHERE name = 'Gospel Essentials'
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
    RETURNING card_id, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT card_id, start_verse_id, 1
FROM inserted_card;

-- Add sample saved deck
INSERT INTO saved_decks (user_id, deck_id)
SELECT 1, deck_id FROM decks WHERE name = 'Psalms of Praise' AND is_public = true
ON CONFLICT DO NOTHING;

-- Add sample confidence scores
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

-- Verify data
SELECT 
    'Decks:' as item,
    COUNT(*) as count 
FROM decks
UNION ALL
SELECT 
    'Saved Decks:' as item,
    COUNT(*) as count 
FROM saved_decks
UNION ALL
SELECT 
    'Deck Cards:' as item,
    COUNT(*) as count 
FROM deck_cards
UNION ALL
SELECT 
    'Confidence Scores:' as item,
    COUNT(*) as count 
FROM user_verse_confidence;