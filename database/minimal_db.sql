-- Create a Database for Well Versed App
-- (Usually done at the AWS RDS console level for Aurora)

-- Verses Table - Core table with encoded IDs
CREATE TABLE verses (
    verse_id VARCHAR(12) PRIMARY KEY, -- Format: XX-XX-XXX-XXX (testament-book-chapter-verse)
    verse_number INTEGER NOT NULL
    -- Optional: content TEXT
);

-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    active BOOLEAN DEFAULT TRUE
);

-- User Settings Table - Simplified for denomination preferences
CREATE TABLE user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    denomination VARCHAR(50),
    include_apocrypha BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE (user_id)
);