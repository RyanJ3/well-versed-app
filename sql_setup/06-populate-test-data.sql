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

-- -----------------------------------------------------
-- Flashcards for the sample decks
-- -----------------------------------------------------

-- Psalms of Praise deck: Psalm 23:1-6
WITH psalm_deck AS (
    SELECT deck_id FROM decks WHERE name = 'Psalms of Praise'
),
psalm_verses AS (
    SELECT id, verse_number FROM bible_verses
    WHERE book_id = 19 AND chapter_number = 23 AND verse_number BETWEEN 1 AND 6
),
insert_psalm AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
    SELECT psalm_deck.deck_id, 'verse_range', 'Psalms 23:1-6', MIN(id), MAX(id), 1
    FROM psalm_deck, psalm_verses
    GROUP BY psalm_deck.deck_id
    RETURNING card_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT insert_psalm.card_id, psalm_verses.id, psalm_verses.verse_number
FROM insert_psalm, psalm_verses
ORDER BY psalm_verses.verse_number;

-- Psalms of Praise deck: Psalm 1:1-2
WITH psalm_deck AS (
    SELECT deck_id FROM decks WHERE name = 'Psalms of Praise'
),
psalm_verses AS (
    SELECT id, verse_number FROM bible_verses
    WHERE book_id = 19 AND chapter_number = 1 AND verse_number BETWEEN 1 AND 2
),
insert_psalm AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
    SELECT psalm_deck.deck_id, 'verse_range', 'Psalms 1:1-2', MIN(id), MAX(id), 2
    FROM psalm_deck, psalm_verses
    GROUP BY psalm_deck.deck_id
    RETURNING card_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT insert_psalm.card_id, psalm_verses.id, psalm_verses.verse_number
FROM insert_psalm, psalm_verses
ORDER BY psalm_verses.verse_number;

-- Gospel Essentials deck: John 3:16 and John 14:6
WITH gospel_deck AS (
    SELECT deck_id FROM decks WHERE name = 'Gospel Essentials'
),
john316 AS (
    SELECT id FROM bible_verses WHERE book_id = 43 AND chapter_number = 3 AND verse_number = 16
),
john146 AS (
    SELECT id FROM bible_verses WHERE book_id = 43 AND chapter_number = 14 AND verse_number = 6
),
insert_cards AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, position)
    SELECT gospel_deck.deck_id, 'single_verse', 'John 3:16', john316.id, 1 FROM gospel_deck, john316
    UNION ALL
    SELECT gospel_deck.deck_id, 'single_verse', 'John 14:6', john146.id, 2 FROM gospel_deck, john146
    RETURNING card_id, reference, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT card_id, start_verse_id, 1 FROM insert_cards;

-- Romans Road deck flashcards
WITH rr_deck AS (
    SELECT deck_id FROM decks WHERE name = 'Romans Road'
),
rom323 AS (SELECT id FROM bible_verses WHERE book_id = 45 AND chapter_number = 3 AND verse_number = 23),
rom58 AS (SELECT id FROM bible_verses WHERE book_id = 45 AND chapter_number = 5 AND verse_number = 8),
rom623 AS (SELECT id FROM bible_verses WHERE book_id = 45 AND chapter_number = 6 AND verse_number = 23),
rom109 AS (SELECT id FROM bible_verses WHERE book_id = 45 AND chapter_number = 10 AND verse_number = 9),
rom1010 AS (SELECT id FROM bible_verses WHERE book_id = 45 AND chapter_number = 10 AND verse_number = 10),
insert_rr AS (
    INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, position)
    SELECT rr_deck.deck_id, 'single_verse', 'Romans 3:23', rom323.id, 1 FROM rr_deck, rom323
    UNION ALL
    SELECT rr_deck.deck_id, 'single_verse', 'Romans 5:8', rom58.id, 2 FROM rr_deck, rom58
    UNION ALL
    SELECT rr_deck.deck_id, 'single_verse', 'Romans 6:23', rom623.id, 3 FROM rr_deck, rom623
    UNION ALL
    SELECT rr_deck.deck_id, 'verse_range', 'Romans 10:9-10', rom109.id, 4 FROM rr_deck, rom109
    RETURNING card_id, reference, start_verse_id
)
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT card_id, start_verse_id, 1 FROM insert_rr
UNION ALL
SELECT card_id, rom1010.id, 2 FROM insert_rr, rom1010 WHERE insert_rr.reference = 'Romans 10:9-10';

-- -----------------------------------------------------
-- Add verses to the user's tracker
-- -----------------------------------------------------
INSERT INTO user_verses (user_id, verse_id)
SELECT 1, id FROM bible_verses
WHERE (book_id = 19 AND chapter_number = 23 AND verse_number BETWEEN 1 AND 6)
   OR (book_id = 19 AND chapter_number = 1 AND verse_number BETWEEN 1 AND 2)
   OR (book_id = 43 AND chapter_number = 3 AND verse_number = 16)
   OR (book_id = 43 AND chapter_number = 14 AND verse_number = 6)
   OR (book_id = 45 AND chapter_number = 3 AND verse_number = 23)
   OR (book_id = 45 AND chapter_number = 5 AND verse_number = 8)
   OR (book_id = 45 AND chapter_number = 6 AND verse_number = 23)
   OR (book_id = 45 AND chapter_number = 10 AND verse_number IN (9,10))
ON CONFLICT DO NOTHING;

-- Initialize confidence tracking for these verses
INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, review_count)
SELECT 1, verse_id, 70, 1 FROM user_verses WHERE user_id = 1
ON CONFLICT DO NOTHING;
