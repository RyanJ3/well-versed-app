#!/bin/bash
# save_correct_sql_files.sh - Create backup and save corrected SQL files

# Create backup
echo "Creating backup of current SQL files..."
mkdir -p sql_backup_$(date +%Y%m%d_%H%M%S)
cp *.sql sql_backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null

echo "Saving corrected SQL files..."

# 01-drop-schema.sql
cat > 01-drop-schema.sql << 'EOF'
-- =====================================================
-- 01-drop-schema.sql
-- WARNING: This drops everything! Use with caution.
-- =====================================================
DROP SCHEMA IF EXISTS wellversed01DEV CASCADE;
DROP SCHEMA IF EXISTS wellversed01dev CASCADE;
EOF

# 02-create-core-tables.sql  
cat > 02-create-core-tables.sql << 'EOF'
-- =====================================================
-- 02-create-core-tables.sql
-- Core tables only: users, bible_books, bible_verses, user_verses
-- =====================================================
CREATE SCHEMA IF NOT EXISTS wellversed01DEV;
SET search_path TO wellversed01DEV;

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    denomination VARCHAR(100),
    preferred_bible VARCHAR(50),
    use_esv_api BOOLEAN DEFAULT FALSE,
    esv_api_token VARCHAR(200),
    include_apocrypha BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Books reference table
CREATE TABLE bible_books (
    book_id INTEGER PRIMARY KEY,
    book_name VARCHAR(50) NOT NULL,
    book_code_3 VARCHAR(3),
    book_code_4 VARCHAR(4),
    testament VARCHAR(20) NOT NULL,
    book_group VARCHAR(50) NOT NULL,
    canonical_affiliation VARCHAR(50) NOT NULL DEFAULT 'All',
    chapter_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bible verses table
CREATE TABLE bible_verses (
    id SERIAL PRIMARY KEY,
    verse_code VARCHAR(20) UNIQUE NOT NULL,
    book_id INTEGER NOT NULL REFERENCES bible_books(book_id),
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    is_apocryphal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User verses table (tracks memorization)
CREATE TABLE user_verses (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
    practice_count INTEGER DEFAULT 1,
    last_practiced TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);

-- Indexes for performance
CREATE INDEX idx_bible_verses_code ON bible_verses(verse_code);
CREATE INDEX idx_bible_verses_book ON bible_verses(book_id);
CREATE INDEX idx_bible_verses_chapter ON bible_verses(book_id, chapter_number);
CREATE INDEX idx_bible_verses_location ON bible_verses(book_id, chapter_number, verse_number);
CREATE INDEX idx_user_verses_user ON user_verses(user_id);
CREATE INDEX idx_user_verses_practice ON user_verses(last_practiced);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verses_updated_at BEFORE UPDATE ON user_verses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert test user
INSERT INTO users (email, name, first_name, last_name, include_apocrypha) 
VALUES ('test@example.com', 'Test User', 'Test', 'User', false)
ON CONFLICT (email) DO NOTHING;
EOF

# 03-create-decks.sql (WITH THE MISSING DECKS TABLE!)
cat > 03-create-decks.sql << 'EOF'
-- =====================================================
-- 03-create-decks.sql
-- Deck system including saved_decks
-- =====================================================
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
EOF

# 04-create-deck-cards.sql
cat > 04-create-deck-cards.sql << 'EOF'
-- =====================================================
-- 04-create-deck-cards.sql
-- Flashcard system for decks
-- =====================================================
SET search_path TO wellversed01DEV;

-- Flashcards table
CREATE TABLE deck_cards (
    card_id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    card_type VARCHAR(20) DEFAULT 'verse_range',
    reference TEXT NOT NULL,
    start_verse_id INTEGER NOT NULL REFERENCES bible_verses(id),
    end_verse_id INTEGER REFERENCES bible_verses(id),
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Verses within a card
CREATE TABLE card_verses (
    card_id INTEGER NOT NULL REFERENCES deck_cards(card_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    verse_order INTEGER NOT NULL,
    PRIMARY KEY (card_id, verse_id)
);

-- Indexes
CREATE INDEX idx_deck_cards_deck ON deck_cards(deck_id);
CREATE INDEX idx_deck_cards_position ON deck_cards(deck_id, position);
CREATE INDEX idx_card_verses_card ON card_verses(card_id);
CREATE INDEX idx_card_verses_order ON card_verses(card_id, verse_order);
EOF

# 05-create-confidence-tracking.sql
cat > 05-create-confidence-tracking.sql << 'EOF'
-- =====================================================
-- 05-create-confidence-tracking.sql
-- Track user confidence/mastery of verses
-- =====================================================
SET search_path TO wellversed01DEV;

-- Confidence tracking table
CREATE TABLE user_verse_confidence (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    last_reviewed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    review_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);

-- Indexes
CREATE INDEX idx_confidence_user ON user_verse_confidence(user_id);
CREATE INDEX idx_confidence_last_reviewed ON user_verse_confidence(last_reviewed);
CREATE INDEX idx_confidence_score ON user_verse_confidence(confidence_score);

-- Update trigger
CREATE TRIGGER update_confidence_updated_at BEFORE UPDATE ON user_verse_confidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

# 06-populate-test-data.sql
cat > 06-populate-test-data.sql << 'EOF'
-- =====================================================
-- 06-populate-test-data.sql
-- Insert test data (run after all tables created)
-- =====================================================
SET search_path TO wellversed01DEV;

-- Create test decks
INSERT INTO decks (user_id, name, description, is_public) VALUES 
(1, 'Psalms of Praise', 'Popular psalms for memorization', true),
(1, 'Gospel Essentials', 'Key verses from the Gospels', true),
(1, 'Romans Road', 'Salvation verses from Romans', false)
ON CONFLICT DO NOTHING;

-- Add sample saved deck
INSERT INTO saved_decks (user_id, deck_id)
SELECT 1, deck_id FROM decks WHERE name = 'Psalms of Praise' AND is_public = true
ON CONFLICT DO NOTHING;
EOF

echo "✓ All SQL files saved correctly!"
echo ""
echo "Now you can run:"
echo "  python3 setup_database.py"