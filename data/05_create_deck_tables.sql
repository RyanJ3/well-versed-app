-- data/05_create_deck_tables_normalized.sql
-- Flashcard deck tables with normalized verse references

CREATE TABLE decks (
    deck_id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    save_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deck_verses (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(verse_id),
    order_position SMALLINT NOT NULL DEFAULT 0,
    UNIQUE(deck_id, verse_id)
);

CREATE TABLE saved_decks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, deck_id)
);

CREATE TABLE deck_tags (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    UNIQUE(deck_id, tag)
);

-- Indexes
CREATE INDEX idx_decks_creator ON decks(creator_id);
CREATE INDEX idx_decks_public ON decks(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_deck_verses_deck ON deck_verses(deck_id);
CREATE INDEX idx_deck_verses_order ON deck_verses(deck_id, order_position);
CREATE INDEX idx_saved_decks_user ON saved_decks(user_id);
CREATE INDEX idx_deck_tags_tag ON deck_tags(tag);