-- sql_setup/02-create-schema.sql
-- Create schema
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bible verses table (Protestant canon only)
CREATE TABLE bible_verses (
    id SERIAL PRIMARY KEY,
    verse_code VARCHAR(20) UNIQUE NOT NULL, -- Format: BOOK-CHAPTER-VERSE (e.g., 'GENE-001-001')
    book_id VARCHAR(4) NOT NULL,            -- 4-char book ID
    book_name VARCHAR(50) NOT NULL,
    testament VARCHAR(20) NOT NULL,         -- 'Old Testament' or 'New Testament'
    book_group VARCHAR(50) NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
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