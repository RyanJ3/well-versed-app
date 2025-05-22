-- Initialize wellversed01DEV database schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Create user settings table
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    denomination VARCHAR(50),
    include_apocrypha BOOLEAN DEFAULT FALSE,
    preferred_bible VARCHAR(50) DEFAULT 'ESV'
);

-- Create bible_verses table
CREATE TABLE IF NOT EXISTS bible_verses (
    verse_id VARCHAR(15) PRIMARY KEY,
    book_id VARCHAR(4) NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    is_apocryphal BOOLEAN DEFAULT FALSE
);

-- Create user verses table
CREATE TABLE IF NOT EXISTS user_verses (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id VARCHAR(15) REFERENCES bible_verses(verse_id) ON DELETE CASCADE,
    practice_count INTEGER DEFAULT 0,
    last_practiced TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bible_verses_verse_id ON bible_verses(verse_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_book_id ON bible_verses(book_id);
CREATE INDEX IF NOT EXISTS idx_user_verses_user_id ON user_verses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verses_verse_id ON user_verses(verse_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_bible_verses_apocryphal ON bible_verses(is_apocryphal);

-- Insert test user
INSERT INTO users (user_id, username, email, password_hash, first_name, last_name)
VALUES (1, 'testuser', 'test@example.com', 'test_hash', 'Test', 'User')
ON CONFLICT (user_id) DO NOTHING;

-- Insert user settings
INSERT INTO user_settings (user_id, denomination, include_apocrypha, preferred_bible)
SELECT 1, 'Non-denominational', FALSE, 'ESV'
WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE user_id = 1);

-- Create function to populate verses (called separately)
CREATE OR REPLACE FUNCTION populate_sample_verses() RETURNS void AS $$
BEGIN
    -- Insert critical verses for testing
    INSERT INTO bible_verses (verse_id, book_id, chapter_number, verse_number, is_apocryphal) VALUES
    -- Genesis
    ('GEN-1-1', 'GEN', 1, 1, FALSE),
    ('GEN-1-2', 'GEN', 1, 2, FALSE),
    ('GEN-1-3', 'GEN', 1, 3, FALSE),
    -- Psalms
    ('PSA-23-1', 'PSA', 23, 1, FALSE),
    ('PSA-23-2', 'PSA', 23, 2, FALSE),
    ('PSA-23-3', 'PSA', 23, 3, FALSE),
    ('PSA-23-4', 'PSA', 23, 4, FALSE),
    ('PSA-23-5', 'PSA', 23, 5, FALSE),
    ('PSA-23-6', 'PSA', 23, 6, FALSE),
    ('PSA-151-1', 'PSA', 151, 1, TRUE),  -- Apocryphal
    -- John
    ('JHN-3-16', 'JHN', 3, 16, FALSE),
    ('JHN-3-17', 'JHN', 3, 17, FALSE),
    -- Romans
    ('ROM-8-28', 'ROM', 8, 28, FALSE),
    -- Matthew 1 (complete chapter for testing)
    ('MAT-1-1', 'MAT', 1, 1, FALSE),
    ('MAT-1-2', 'MAT', 1, 2, FALSE),
    ('MAT-1-3', 'MAT', 1, 3, FALSE),
    ('MAT-1-4', 'MAT', 1, 4, FALSE),
    ('MAT-1-5', 'MAT', 1, 5, FALSE),
    ('MAT-1-6', 'MAT', 1, 6, FALSE),
    ('MAT-1-7', 'MAT', 1, 7, FALSE),
    ('MAT-1-8', 'MAT', 1, 8, FALSE),
    ('MAT-1-9', 'MAT', 1, 9, FALSE),
    ('MAT-1-10', 'MAT', 1, 10, FALSE),
    ('MAT-1-11', 'MAT', 1, 11, FALSE),
    ('MAT-1-12', 'MAT', 1, 12, FALSE),
    ('MAT-1-13', 'MAT', 1, 13, FALSE),
    ('MAT-1-14', 'MAT', 1, 14, FALSE),
    ('MAT-1-15', 'MAT', 1, 15, FALSE),
    ('MAT-1-16', 'MAT', 1, 16, FALSE),
    ('MAT-1-17', 'MAT', 1, 17, FALSE),
    ('MAT-1-18', 'MAT', 1, 18, FALSE),
    ('MAT-1-19', 'MAT', 1, 19, FALSE),
    ('MAT-1-20', 'MAT', 1, 20, FALSE),
    ('MAT-1-21', 'MAT', 1, 21, FALSE),
    ('MAT-1-22', 'MAT', 1, 22, FALSE),
    ('MAT-1-23', 'MAT', 1, 23, FALSE),
    ('MAT-1-24', 'MAT', 1, 24, FALSE),
    ('MAT-1-25', 'MAT', 1, 25, FALSE)
    ON CONFLICT (verse_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Call function to populate sample verses
SELECT populate_sample_verses();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Note: Run populate_bible_verses.py after container starts to load all 31,000+ verses