SET search_path TO wellversed01DEV;

-- Decks table
CREATE TABLE decks (
    deck_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deck verses (flashcards)
CREATE TABLE deck_verses (
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0, -- For custom ordering
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (deck_id, verse_id)
);

-- Tags table (for future use)
CREATE TABLE deck_tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deck-tag relationship (for future use)
CREATE TABLE deck_tag_map (
    deck_id INTEGER REFERENCES decks(deck_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES deck_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, tag_id)
);

-- Indexes for performance
CREATE INDEX idx_decks_user ON decks(user_id);
CREATE INDEX idx_decks_public ON decks(is_public);
CREATE INDEX idx_deck_verses_deck ON deck_verses(deck_id);
CREATE INDEX idx_deck_verses_position ON deck_verses(deck_id, position);

-- Update trigger for decks
CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();