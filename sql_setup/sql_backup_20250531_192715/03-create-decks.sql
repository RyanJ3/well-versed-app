-- =====================================================
-- 03-create-decks.sql
-- Deck system including saved_decks
-- =====================================================
SET search_path TO wellversed01DEV;

CREATE TABLE decks (
    deck_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved decks table (users can save other users' public decks)
CREATE TABLE saved_decks (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, deck_id)
);

-- Tags table (for future use)
CREATE TABLE deck_tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deck-tag relationship
CREATE TABLE deck_tag_map (
    deck_id INTEGER REFERENCES decks(deck_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES deck_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, tag_id)
);

-- Indexes
CREATE INDEX idx_decks_user ON decks(user_id);
CREATE INDEX idx_decks_public ON decks(is_public);
CREATE INDEX idx_saved_decks_user_id ON saved_decks(user_id);
CREATE INDEX idx_saved_decks_deck_id ON saved_decks(deck_id);
CREATE INDEX idx_saved_decks_saved_at ON saved_decks(saved_at);

-- Update trigger
CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();