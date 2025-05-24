-- /data/08_create_indexes.sql
-- Performance indexes

-- User verse indexes
CREATE INDEX idx_user_verses_user_id ON user_verses(user_id);
CREATE INDEX idx_user_verses_confidence ON user_verses(user_id, confidence_level);
CREATE INDEX idx_user_verses_next_review ON user_verses(user_id, next_review);
CREATE INDEX idx_user_verses_verse_id ON user_verses(verse_id);
CREATE INDEX idx_user_verses_book_chapter ON user_verses(book_id, chapter_number);

-- Deck indexes
CREATE INDEX idx_decks_creator ON decks(creator_id);
CREATE INDEX idx_decks_public ON decks(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_decks_public_saves ON decks(save_count DESC) WHERE is_public = TRUE;

-- Deck verses indexes
CREATE INDEX idx_deck_verses_deck ON deck_verses(deck_id);
CREATE INDEX idx_deck_verses_order ON deck_verses(deck_id, order_position);

-- Saved decks indexes
CREATE INDEX idx_saved_decks_user ON saved_decks(user_id);
CREATE INDEX idx_saved_decks_deck ON saved_decks(deck_id);

-- Deck tags indexes
CREATE INDEX idx_deck_tags_tag ON deck_tags(tag);
CREATE INDEX idx_deck_tags_deck ON deck_tags(deck_id);

-- Bible structure indexes
CREATE INDEX idx_chapter_counts_book ON chapter_verse_counts(book_id);
CREATE INDEX idx_apocryphal_book_chapter ON apocryphal_content(book_id, chapter_number);

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);