-- =====================================================
-- 13-additional-test-decks.sql
-- Additional test decks with variable amounts of verses
-- =====================================================
SET search_path TO wellversed01DEV;

-- Insert additional test decks with varying sizes
-- Note: Using user_id=1 (the test user created in 10-populate-test-data.sql)
INSERT INTO decks (user_id, name, description, is_public) VALUES
(1, 'Psalms Collection', 'A collection of psalms focusing on praise and worship', true),
(1, 'Love & Compassion', 'Verses about God''s love and showing compassion to others', true),
(1, 'Wisdom Literature', 'Key verses from Proverbs, Ecclesiastes, and Job', true),
(1, 'Beatitudes Extended', 'The Beatitudes and related teachings from the Sermon on the Mount', true),
(1, 'Fruit of the Spirit', 'Passages about the fruit of the Spirit and Christian character', true),
(1, 'Prayer & Petition', 'Verses about prayer, intercession, and seeking God', true),
(1, 'Faith Heroes', 'Verses about the heroes of faith from Hebrews 11 and beyond', true),
(1, 'Creation & Nature', 'Verses celebrating God''s creation and the natural world', true),
(1, 'Forgiveness', 'Key passages about forgiveness and reconciliation', true),
(1, 'End Times Basics', 'Foundational verses about Christ''s return and eternity', true),
(1, 'Courage & Strength', 'Verses for times when you need courage and strength', true),
(1, 'Peace & Rest', 'Finding peace and rest in God', true),
(1, 'Gospel Core', 'Core verses explaining the Gospel message', false),
(1, 'Old Testament Promises', 'Key promises from the Old Testament', true),
(1, 'Parables of Jesus', 'Key verses from the parables', true),
(1, 'Names of God', 'Verses revealing different names and attributes of God', true),
(1, 'Spiritual Warfare', 'Verses about spiritual battles and armor', true),
(1, 'Joy & Celebration', 'Verses about joy, rejoicing, and celebration', true),
(1, 'Discipleship', 'What it means to follow Jesus', false),
(1, 'The Ten Commandments Plus', 'The commandments and related teachings', true)
ON CONFLICT DO NOTHING;

-- Add cards to some of the decks
DO $$
DECLARE
    v_deck_id INTEGER;
    v_card_id INTEGER;
    v_start_verse_id INTEGER;
    v_end_verse_id INTEGER;
BEGIN
    -- Add cards to 'Psalms Collection' deck
    SELECT deck_id INTO v_deck_id FROM decks WHERE name = 'Psalms Collection' AND user_id = 1 LIMIT 1;
    IF v_deck_id IS NOT NULL THEN
        -- Psalm 23
        SELECT id INTO v_start_verse_id FROM bible_verses WHERE book_id = 19 AND chapter_number = 23 AND verse_number = 1;
        SELECT id INTO v_end_verse_id FROM bible_verses WHERE book_id = 19 AND chapter_number = 23 AND verse_number = 6;
        
        INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
        VALUES (v_deck_id, 'verse_range', 'Psalm 23:1-6', v_start_verse_id, v_end_verse_id, 1);
        
        -- Add verses to the card
        INSERT INTO card_verses (card_id, verse_id, verse_order)
        SELECT currval('deck_cards_card_id_seq'), id, verse_number
        FROM bible_verses 
        WHERE book_id = 19 AND chapter_number = 23 AND verse_number BETWEEN 1 AND 6
        ORDER BY verse_number;
        
        -- Psalm 100
        SELECT id INTO v_start_verse_id FROM bible_verses WHERE book_id = 19 AND chapter_number = 100 AND verse_number = 1;
        SELECT id INTO v_end_verse_id FROM bible_verses WHERE book_id = 19 AND chapter_number = 100 AND verse_number = 5;
        
        INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
        VALUES (v_deck_id, 'verse_range', 'Psalm 100:1-5', v_start_verse_id, v_end_verse_id, 2);
        
        INSERT INTO card_verses (card_id, verse_id, verse_order)
        SELECT currval('deck_cards_card_id_seq'), id, verse_number
        FROM bible_verses 
        WHERE book_id = 19 AND chapter_number = 100 AND verse_number BETWEEN 1 AND 5
        ORDER BY verse_number;
    END IF;
    
    -- Add cards to 'Love & Compassion' deck
    SELECT deck_id INTO v_deck_id FROM decks WHERE name = 'Love & Compassion' AND user_id = 1 LIMIT 1;
    IF v_deck_id IS NOT NULL THEN
        -- John 3:16
        SELECT id INTO v_start_verse_id FROM bible_verses WHERE book_id = 43 AND chapter_number = 3 AND verse_number = 16;
        
        INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
        VALUES (v_deck_id, 'verse_range', 'John 3:16', v_start_verse_id, NULL, 1);
        
        INSERT INTO card_verses (card_id, verse_id, verse_order)
        VALUES (currval('deck_cards_card_id_seq'), v_start_verse_id, 1);
        
        -- 1 Corinthians 13:4-7
        SELECT id INTO v_start_verse_id FROM bible_verses WHERE book_id = 46 AND chapter_number = 13 AND verse_number = 4;
        SELECT id INTO v_end_verse_id FROM bible_verses WHERE book_id = 46 AND chapter_number = 13 AND verse_number = 7;
        
        INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
        VALUES (v_deck_id, 'verse_range', '1 Corinthians 13:4-7', v_start_verse_id, v_end_verse_id, 2);
        
        INSERT INTO card_verses (card_id, verse_id, verse_order)
        SELECT currval('deck_cards_card_id_seq'), id, verse_number
        FROM bible_verses 
        WHERE book_id = 46 AND chapter_number = 13 AND verse_number BETWEEN 4 AND 7
        ORDER BY verse_number;
    END IF;
    
    -- Add cards to 'Gospel Core' deck
    SELECT deck_id INTO v_deck_id FROM decks WHERE name = 'Gospel Core' AND user_id = 1 LIMIT 1;
    IF v_deck_id IS NOT NULL THEN
        -- Romans 3:23
        SELECT id INTO v_start_verse_id FROM bible_verses WHERE book_id = 45 AND chapter_number = 3 AND verse_number = 23;
        
        INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
        VALUES (v_deck_id, 'verse_range', 'Romans 3:23', v_start_verse_id, NULL, 1);
        
        INSERT INTO card_verses (card_id, verse_id, verse_order)
        VALUES (currval('deck_cards_card_id_seq'), v_start_verse_id, 1);
        
        -- Romans 6:23
        SELECT id INTO v_start_verse_id FROM bible_verses WHERE book_id = 45 AND chapter_number = 6 AND verse_number = 23;
        
        INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
        VALUES (v_deck_id, 'verse_range', 'Romans 6:23', v_start_verse_id, NULL, 2);
        
        INSERT INTO card_verses (card_id, verse_id, verse_order)
        VALUES (currval('deck_cards_card_id_seq'), v_start_verse_id, 1);
        
        -- Ephesians 2:8-9
        SELECT id INTO v_start_verse_id FROM bible_verses WHERE book_id = 49 AND chapter_number = 2 AND verse_number = 8;
        SELECT id INTO v_end_verse_id FROM bible_verses WHERE book_id = 49 AND chapter_number = 2 AND verse_number = 9;
        
        INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
        VALUES (v_deck_id, 'verse_range', 'Ephesians 2:8-9', v_start_verse_id, v_end_verse_id, 3);
        
        INSERT INTO card_verses (card_id, verse_id, verse_order)
        SELECT currval('deck_cards_card_id_seq'), id, verse_number
        FROM bible_verses 
        WHERE book_id = 49 AND chapter_number = 2 AND verse_number BETWEEN 8 AND 9
        ORDER BY verse_number;
    END IF;
END $$;

-- Save some of these decks for the test user
INSERT INTO saved_decks (user_id, deck_id)
SELECT 1, deck_id
FROM decks
WHERE name IN ('Psalms Collection', 'Gospel Core', 'Fruit of the Spirit', 'Love & Compassion')
  AND user_id = 1
ON CONFLICT (user_id, deck_id) DO NOTHING;