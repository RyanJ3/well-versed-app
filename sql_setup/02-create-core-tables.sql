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
    include_apocrypha BOOLEAN DEFAULT FALSE,
    show_charts BOOLEAN DEFAULT TRUE,
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
INSERT INTO users (email, name, first_name, last_name, include_apocrypha, show_charts)
VALUES ('test@example.com', 'Test User', 'Test', 'User', false, true)
ON CONFLICT (email) DO NOTHING;
