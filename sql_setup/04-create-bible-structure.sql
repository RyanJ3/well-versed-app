-- =====================================================
-- 04-create-bible-structure.sql
-- Bible books, verses, and user memorization tracking
-- =====================================================
SET search_path TO wellversed01DEV;

-- Bible books reference table
CREATE TABLE IF NOT EXISTS bible_books (
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
CREATE TABLE IF NOT EXISTS bible_verses (
    id SERIAL PRIMARY KEY,
    verse_code VARCHAR(20) UNIQUE NOT NULL,
    book_id INTEGER NOT NULL REFERENCES bible_books(book_id),
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    is_apocryphal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User verses tracking (which verses users have memorized)
CREATE TABLE IF NOT EXISTS user_verses (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
    practice_count INTEGER DEFAULT 1,
    last_practiced TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);

-- User verse confidence tracking
CREATE TABLE IF NOT EXISTS user_verse_confidence (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    last_reviewed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    review_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bible_verses_code ON bible_verses(verse_code);
CREATE INDEX IF NOT EXISTS idx_bible_verses_book ON bible_verses(book_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter ON bible_verses(book_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_bible_verses_location ON bible_verses(book_id, chapter_number, verse_number);
CREATE INDEX IF NOT EXISTS idx_user_verses_user ON user_verses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verses_practice ON user_verses(last_practiced);
CREATE INDEX IF NOT EXISTS idx_confidence_user ON user_verse_confidence(user_id);
CREATE INDEX IF NOT EXISTS idx_confidence_last_reviewed ON user_verse_confidence(last_reviewed);
CREATE INDEX IF NOT EXISTS idx_confidence_score ON user_verse_confidence(confidence_score);

-- Triggers
DROP TRIGGER IF EXISTS update_user_verses_updated_at ON user_verses;
CREATE TRIGGER update_user_verses_updated_at 
    BEFORE UPDATE ON user_verses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_confidence_updated_at ON user_verse_confidence;
CREATE TRIGGER update_confidence_updated_at 
    BEFORE UPDATE ON user_verse_confidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
