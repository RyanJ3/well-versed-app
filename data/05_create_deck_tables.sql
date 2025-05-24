-- /data/05_create_deck_tables.sql
-- Flashcard deck tables

CREATE TABLE decks (
    deck_id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    save_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deck_verses (
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    verse_id VARCHAR(12) NOT NULL,
    order_position INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (deck_id, verse_id)
);

CREATE TABLE saved_decks (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, deck_id)
);

CREATE TABLE deck_tags (
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (deck_id, tag_name)
);