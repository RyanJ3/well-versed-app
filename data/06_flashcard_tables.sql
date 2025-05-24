-- /data/06_flashcard_tables.sql
-- Flashcard system tables

-- Individual verse tracking with confidence
CREATE TABLE IF NOT EXISTS user_verses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_number SMALLINT NOT NULL,
    confidence_level SMALLINT NOT NULL DEFAULT 0 CHECK (confidence_level >= 0 AND confidence_level <= 5),
    last_reviewed TIMESTAMP,
    next_review TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id, chapter_number, verse_number)
);

-- Deck tables
CREATE TABLE IF NOT EXISTS decks (
    deck_id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    save_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deck_verses (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_number SMALLINT NOT NULL,
    position INTEGER NOT NULL,
    UNIQUE(deck_id, book_id, chapter_number, verse_number)
);

CREATE TABLE IF NOT EXISTS saved_decks (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, deck_id)
);

CREATE TABLE IF NOT EXISTS deck_tags (
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY(deck_id, tag)
);

-- Study session tracking
CREATE TABLE IF NOT EXISTS study_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    cards_reviewed INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_verses_user_book ON user_verses(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_user_verses_confidence ON user_verses(user_id, confidence_level);
CREATE INDEX IF NOT EXISTS idx_user_verses_next_review ON user_verses(user_id, next_review) WHERE next_review IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deck_verses_deck ON deck_verses(deck_id, position);
CREATE INDEX IF NOT EXISTS idx_decks_public ON decks(is_public, save_count) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_deck_tags_tag ON deck_tags(tag);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_verses_updated_at BEFORE UPDATE ON user_verses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Helper view
CREATE OR REPLACE VIEW deck_statistics AS
SELECT 
    d.deck_id,
    d.name,
    d.creator_id,
    u.username as creator_name,
    d.is_public,
    d.save_count,
    COUNT(DISTINCT dv.id) as verse_count,
    d.created_at,
    d.updated_at
FROM decks d
JOIN users u ON d.creator_id = u.user_id
LEFT JOIN deck_verses dv ON d.deck_id = dv.deck_id
GROUP BY d.deck_id, d.name, d.creator_id, u.username, d.is_public, d.save_count, d.created_at, d.updated_at;