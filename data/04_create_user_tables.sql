-- /data/04_create_user_tables.sql
-- User and verse tracking tables

CREATE TABLE users (
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

CREATE TABLE user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    denomination VARCHAR(50),
    preferred_bible bible_translation DEFAULT 'ESV',
    include_apocrypha BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_verses (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id VARCHAR(12) NOT NULL, -- Format: XXX-C-V (e.g., GEN-1-1)
    confidence confidence_level DEFAULT '0',
    last_reviewed TIMESTAMP,
    next_review TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);