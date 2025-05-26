-- sql_setup/08-create-deck-cards.sql
SET search_path TO wellversed01DEV;

-- New table for flashcards (replaces individual verse entries)
CREATE TABLE deck_cards (
    card_id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    card_type VARCHAR(20) DEFAULT 'verse_range', -- 'single_verse', 'verse_range'
    reference TEXT NOT NULL, -- e.g., "John 3:16" or "John 3:16-18"
    start_verse_id INTEGER NOT NULL REFERENCES bible_verses(id),
    end_verse_id INTEGER REFERENCES bible_verses(id), -- NULL for single verses
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for verses within a card
CREATE TABLE card_verses (
    card_id INTEGER NOT NULL REFERENCES deck_cards(card_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    verse_order INTEGER NOT NULL, -- Order within the card
    PRIMARY KEY (card_id, verse_id)
);

-- Indexes for performance
CREATE INDEX idx_deck_cards_deck ON deck_cards(deck_id);
CREATE INDEX idx_deck_cards_position ON deck_cards(deck_id, position);
CREATE INDEX idx_card_verses_card ON card_verses(card_id);
CREATE INDEX idx_card_verses_order ON card_verses(card_id, verse_order);

-- Migrate existing deck_verses to deck_cards (single verse cards)
INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, position)
SELECT 
    dv.deck_id,
    'single_verse',
    bb.book_name || ' ' || bv.chapter_number || ':' || bv.verse_number,
    dv.verse_id,
    dv.position
FROM deck_verses dv
JOIN bible_verses bv ON dv.verse_id = bv.id
JOIN bible_books bb ON bv.book_id = bb.book_id;

-- Migrate card_verses entries
INSERT INTO card_verses (card_id, verse_id, verse_order)
SELECT 
    dc.card_id,
    dc.start_verse_id,
    1
FROM deck_cards dc;

-- Drop old table after migration
DROP TABLE deck_verses;