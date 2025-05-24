-- /data/05_create_deck_tables.sql
-- Flashcard deck tables

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
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_number SMALLINT NOT NULL,
    order_position SMALLINT NOT NULL DEFAULT 0,
    UNIQUE(deck_id, book_id, chapter_number, verse_number)
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