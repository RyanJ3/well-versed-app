-- =====================================================
-- 05-create-decks.sql
-- Deck system for organizing verse collections
-- =====================================================
SET search_path TO wellversed01DEV;

-- Main decks table
CREATE TABLE IF NOT EXISTS decks (
    deck_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved decks (bookmarked decks from other users)
CREATE TABLE IF NOT EXISTS saved_decks (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, deck_id)
);

-- Deck cards (flashcards within decks)
CREATE TABLE IF NOT EXISTS deck_cards (
    card_id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    card_type VARCHAR(20) DEFAULT 'verse_range',
    reference TEXT NOT NULL,
    start_verse_id INTEGER NOT NULL REFERENCES bible_verses(id),
    end_verse_id INTEGER REFERENCES bible_verses(id),
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Verses within each card
CREATE TABLE IF NOT EXISTS card_verses (
    card_id INTEGER NOT NULL REFERENCES deck_cards(card_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    verse_order INTEGER NOT NULL,
    PRIMARY KEY (card_id, verse_id)
);

-- Tags for categorization
CREATE TABLE IF NOT EXISTS deck_tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deck-tag relationship
CREATE TABLE IF NOT EXISTS deck_tag_map (
    deck_id INTEGER REFERENCES decks(deck_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES deck_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_public ON decks(is_public);
CREATE INDEX IF NOT EXISTS idx_saved_decks_user_id ON saved_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_decks_deck_id ON saved_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_saved_decks_saved_at ON saved_decks(saved_at);
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck ON deck_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_position ON deck_cards(deck_id, position);
CREATE INDEX IF NOT EXISTS idx_card_verses_card ON card_verses(card_id);
CREATE INDEX IF NOT EXISTS idx_card_verses_order ON card_verses(card_id, verse_order);

-- Triggers
DROP TRIGGER IF EXISTS update_decks_updated_at ON decks;
CREATE TRIGGER update_decks_updated_at 
    BEFORE UPDATE ON decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
