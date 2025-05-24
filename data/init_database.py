#!/usr/bin/env python3
"""
Complete database initialization script for Well Versed
Combines all SQL schema creation and data population
"""

import json
import psycopg2
import os
import sys
import time
from pathlib import Path

class DatabaseInitializer:
    def __init__(self):
        self.conn = None
        self.cur = None
        self.book_mapping = {}
        
    def wait_for_db(self, max_retries=30):
        """Wait for PostgreSQL to be ready"""
        print("Waiting for database to be ready...")
        for i in range(max_retries):
            try:
                self.connect()
                print("Database is ready!")
                return True
            except psycopg2.OperationalError:
                if i < max_retries - 1:
                    print(f"Database not ready, retrying in 2 seconds... ({i+1}/{max_retries})")
                    time.sleep(2)
                else:
                    print("Database connection failed after maximum retries")
                    return False
        return False
    
    def connect(self):
        """Connect to database"""
        self.conn = psycopg2.connect(
            host=os.getenv('DATABASE_HOST', 'db'),  # 'db' for docker-compose
            port=os.getenv('DATABASE_PORT', '5432'),
            database=os.getenv('DATABASE_NAME', 'wellversed01DEV'),
            user=os.getenv('DATABASE_USER', 'postgres'),
            password=os.getenv('DATABASE_PASSWORD', 'postgres')
        )
        self.cur = self.conn.cursor()
        
    def create_schema(self):
        """Create all database tables"""
        print("Creating database schema...")
        
        schema_sql = """
        -- ============================================================================
-- WELL VERSED COMPLETE DATABASE SETUP
-- Single file containing all tables, data, functions, and indexes
-- ============================================================================

-- Drop existing objects to ensure clean setup
DROP MATERIALIZED VIEW IF EXISTS user_progress_summary CASCADE;
DROP TABLE IF EXISTS user_verse_ranges CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS apocryphal_content CASCADE;
DROP TABLE IF EXISTS chapter_verse_counts CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TYPE IF EXISTS testament_type CASCADE;
DROP TYPE IF EXISTS canonical_type CASCADE;

-- Create custom types
CREATE TYPE testament_type AS ENUM ('Old Testament', 'New Testament');
CREATE TYPE canonical_type AS ENUM ('Canonical', 'Deuterocanonical', 'Apocryphal');

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- Books metadata table
CREATE TABLE books (
    book_id SMALLINT PRIMARY KEY,
    book_code CHAR(3) NOT NULL UNIQUE,
    book_name VARCHAR(50) NOT NULL,
    testament testament_type NOT NULL,
    book_group VARCHAR(50) NOT NULL,
    total_chapters SMALLINT NOT NULL,
    total_verses INTEGER NOT NULL,
    canonical_affiliation canonical_type NOT NULL,
    is_apocryphal_book BOOLEAN DEFAULT FALSE,
    display_order SMALLINT NOT NULL UNIQUE
);

-- Chapter verse counts table
CREATE TABLE chapter_verse_counts (
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_count SMALLINT NOT NULL,
    PRIMARY KEY (book_id, chapter_number)
);

-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP
);

-- User settings table
CREATE TABLE user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    denomination VARCHAR(50),
    preferred_bible VARCHAR(50) DEFAULT 'ESV',
    include_apocrypha BOOLEAN DEFAULT FALSE,
    theme VARCHAR(20) DEFAULT 'light',
    font_size VARCHAR(10) DEFAULT 'medium',
    reading_plan VARCHAR(50),
    daily_goal INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Apocryphal content mapping table
CREATE TABLE apocryphal_content (
    apocryphal_id SERIAL PRIMARY KEY,
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_start SMALLINT,
    verse_end SMALLINT,
    description VARCHAR(100),
    canonical_status VARCHAR(50),
    UNIQUE(book_id, chapter_number, verse_start, verse_end)
);

-- User verse ranges table (core memorization tracking)
CREATE TABLE user_verse_ranges (
    range_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_start SMALLINT NOT NULL,
    verse_start SMALLINT NOT NULL,
    chapter_end SMALLINT NOT NULL,
    verse_end SMALLINT NOT NULL,
    range_name VARCHAR(100),
    notes TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 100),
    last_reviewed TIMESTAMP,
    next_review TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT valid_range CHECK (
        (chapter_start < chapter_end) OR 
        (chapter_start = chapter_end AND verse_start <= verse_end)
    ),
    UNIQUE(user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User verse ranges indexes
CREATE INDEX idx_user_verse_ranges_user_book ON user_verse_ranges(user_id, book_id);
CREATE INDEX idx_user_verse_ranges_chapters ON user_verse_ranges(user_id, book_id, chapter_start, chapter_end);
CREATE INDEX idx_user_verse_ranges_active ON user_verse_ranges(user_id, is_active);
CREATE INDEX idx_user_verse_ranges_review ON user_verse_ranges(user_id, next_review) WHERE is_active = true;

-- Books indexes
CREATE INDEX idx_books_testament ON books(testament);
CREATE INDEX idx_books_canonical ON books(canonical_affiliation);
CREATE INDEX idx_books_display_order ON books(display_order);

-- Apocryphal content indexes
CREATE INDEX idx_apocryphal_book_chapter ON apocryphal_content(book_id, chapter_number);

-- Chapter counts indexes
CREATE INDEX idx_chapter_counts_book ON chapter_verse_counts(book_id);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_created ON users(created_at);

-- ============================================================================
-- POPULATE BOOKS DATA
-- ============================================================================

INSERT INTO books (book_id, book_code, book_name, testament, book_group, total_chapters, total_verses, canonical_affiliation, is_apocryphal_book, display_order) VALUES
-- Old Testament Books
(1, 'GEN', 'Genesis', 'Old Testament', 'Torah/Pentateuch', 50, 1533, 'Canonical', FALSE, 1),
(2, 'EXO', 'Exodus', 'Old Testament', 'Torah/Pentateuch', 40, 1213, 'Canonical', FALSE, 2),
(3, 'LEV', 'Leviticus', 'Old Testament', 'Torah/Pentateuch', 27, 859, 'Canonical', FALSE, 3),
(4, 'NUM', 'Numbers', 'Old Testament', 'Torah/Pentateuch', 36, 1288, 'Canonical', FALSE, 4),
(5, 'DEU', 'Deuteronomy', 'Old Testament', 'Torah/Pentateuch', 34, 959, 'Canonical', FALSE, 5),
(6, 'JOS', 'Joshua', 'Old Testament', 'Historical Books', 24, 658, 'Canonical', FALSE, 6),
(7, 'JDG', 'Judges', 'Old Testament', 'Historical Books', 21, 618, 'Canonical', FALSE, 7),
(8, 'RUT', 'Ruth', 'Old Testament', 'Historical Books', 4, 85, 'Canonical', FALSE, 8),
(9, '1SA', '1 Samuel', 'Old Testament', 'Historical Books', 31, 810, 'Canonical', FALSE, 9),
(10, '2SA', '2 Samuel', 'Old Testament', 'Historical Books', 24, 695, 'Canonical', FALSE, 10),
(11, '1KI', '1 Kings', 'Old Testament', 'Historical Books', 22, 816, 'Canonical', FALSE, 11),
(12, '2KI', '2 Kings', 'Old Testament', 'Historical Books', 25, 719, 'Canonical', FALSE, 12),
(13, '1CH', '1 Chronicles', 'Old Testament', 'Historical Books', 29, 942, 'Canonical', FALSE, 13),
(14, '2CH', '2 Chronicles', 'Old Testament', 'Historical Books', 36, 822, 'Canonical', FALSE, 14),
(15, 'EZR', 'Ezra', 'Old Testament', 'Historical Books', 10, 280, 'Canonical', FALSE, 15),
(16, 'NEH', 'Nehemiah', 'Old Testament', 'Historical Books', 13, 406, 'Canonical', FALSE, 16),
(17, 'EST', 'Esther', 'Old Testament', 'Historical Books', 10, 167, 'Canonical', FALSE, 17),
(18, 'JOB', 'Job', 'Old Testament', 'Wisdom Literature', 42, 1070, 'Canonical', FALSE, 18),
(19, 'PSA', 'Psalms', 'Old Testament', 'Wisdom Literature', 150, 2461, 'Canonical', FALSE, 19),
(20, 'PRO', 'Proverbs', 'Old Testament', 'Wisdom Literature', 31, 915, 'Canonical', FALSE, 20),
(21, 'ECC', 'Ecclesiastes', 'Old Testament', 'Wisdom Literature', 12, 222, 'Canonical', FALSE, 21),
(22, 'SNG', 'Song of Songs', 'Old Testament', 'Wisdom Literature', 8, 117, 'Canonical', FALSE, 22),
(23, 'ISA', 'Isaiah', 'Old Testament', 'Major Prophets', 66, 1292, 'Canonical', FALSE, 23),
(24, 'JER', 'Jeremiah', 'Old Testament', 'Major Prophets', 52, 1364, 'Canonical', FALSE, 24),
(25, 'LAM', 'Lamentations', 'Old Testament', 'Major Prophets', 5, 154, 'Canonical', FALSE, 25),
(26, 'EZK', 'Ezekiel', 'Old Testament', 'Major Prophets', 48, 1273, 'Canonical', FALSE, 26),
(27, 'DAN', 'Daniel', 'Old Testament', 'Major Prophets', 12, 357, 'Canonical', FALSE, 27),
(28, 'HOS', 'Hosea', 'Old Testament', 'Minor Prophets', 14, 197, 'Canonical', FALSE, 28),
(29, 'JOL', 'Joel', 'Old Testament', 'Minor Prophets', 3, 73, 'Canonical', FALSE, 29),
(30, 'AMO', 'Amos', 'Old Testament', 'Minor Prophets', 9, 146, 'Canonical', FALSE, 30),
(31, 'OBA', 'Obadiah', 'Old Testament', 'Minor Prophets', 1, 21, 'Canonical', FALSE, 31),
(32, 'JON', 'Jonah', 'Old Testament', 'Minor Prophets', 4, 48, 'Canonical', FALSE, 32),
(33, 'MIC', 'Micah', 'Old Testament', 'Minor Prophets', 7, 105, 'Canonical', FALSE, 33),
(34, 'NAM', 'Nahum', 'Old Testament', 'Minor Prophets', 3, 47, 'Canonical', FALSE, 34),
(35, 'HAB', 'Habakkuk', 'Old Testament', 'Minor Prophets', 3, 56, 'Canonical', FALSE, 35),
(36, 'ZEP', 'Zephaniah', 'Old Testament', 'Minor Prophets', 3, 53, 'Canonical', FALSE, 36),
(37, 'HAG', 'Haggai', 'Old Testament', 'Minor Prophets', 2, 38, 'Canonical', FALSE, 37),
(38, 'ZEC', 'Zechariah', 'Old Testament', 'Minor Prophets', 14, 211, 'Canonical', FALSE, 38),
(39, 'MAL', 'Malachi', 'Old Testament', 'Minor Prophets', 4, 55, 'Canonical', FALSE, 39),

-- New Testament Books
(40, 'MAT', 'Matthew', 'New Testament', 'Gospels', 28, 1071, 'Canonical', FALSE, 40),
(41, 'MRK', 'Mark', 'New Testament', 'Gospels', 16, 678, 'Canonical', FALSE, 41),
(42, 'LUK', 'Luke', 'New Testament', 'Gospels', 24, 1151, 'Canonical', FALSE, 42),
(43, 'JHN', 'John', 'New Testament', 'Gospels', 21, 879, 'Canonical', FALSE, 43),
(44, 'ACT', 'Acts', 'New Testament', 'Historical', 28, 1007, 'Canonical', FALSE, 44),
(45, 'ROM', 'Romans', 'New Testament', 'Pauline Epistles', 16, 433, 'Canonical', FALSE, 45),
(46, '1CO', '1 Corinthians', 'New Testament', 'Pauline Epistles', 16, 437, 'Canonical', FALSE, 46),
(47, '2CO', '2 Corinthians', 'New Testament', 'Pauline Epistles', 13, 257, 'Canonical', FALSE, 47),
(48, 'GAL', 'Galatians', 'New Testament', 'Pauline Epistles', 6, 149, 'Canonical', FALSE, 48),
(49, 'EPH', 'Ephesians', 'New Testament', 'Pauline Epistles', 6, 155, 'Canonical', FALSE, 49),
(50, 'PHP', 'Philippians', 'New Testament', 'Pauline Epistles', 4, 104, 'Canonical', FALSE, 50),
(51, 'COL', 'Colossians', 'New Testament', 'Pauline Epistles', 4, 95, 'Canonical', FALSE, 51),
(52, '1TH', '1 Thessalonians', 'New Testament', 'Pauline Epistles', 5, 89, 'Canonical', FALSE, 52),
(53, '2TH', '2 Thessalonians', 'New Testament', 'Pauline Epistles', 3, 47, 'Canonical', FALSE, 53),
(54, '1TI', '1 Timothy', 'New Testament', 'Pastoral Epistles', 6, 113, 'Canonical', FALSE, 54),
(55, '2TI', '2 Timothy', 'New Testament', 'Pastoral Epistles', 4, 83, 'Canonical', FALSE, 55),
(56, 'TIT', 'Titus', 'New Testament', 'Pastoral Epistles', 3, 46, 'Canonical', FALSE, 56),
(57, 'PHM', 'Philemon', 'New Testament', 'Pastoral Epistles', 1, 25, 'Canonical', FALSE, 57),
(58, 'HEB', 'Hebrews', 'New Testament', 'General Epistles', 13, 303, 'Canonical', FALSE, 58),
(59, 'JAS', 'James', 'New Testament', 'General Epistles', 5, 108, 'Canonical', FALSE, 59),
(60, '1PE', '1 Peter', 'New Testament', 'General Epistles', 5, 105, 'Canonical', FALSE, 60),
(61, '2PE', '2 Peter', 'New Testament', 'General Epistles', 3, 61, 'Canonical', FALSE, 61),
(62, '1JN', '1 John', 'New Testament', 'General Epistles', 5, 105, 'Canonical', FALSE, 62),
(63, '2JN', '2 John', 'New Testament', 'General Epistles', 1, 13, 'Canonical', FALSE, 63),
(64, '3JN', '3 John', 'New Testament', 'General Epistles', 1, 14, 'Canonical', FALSE, 64),
(65, 'JUD', 'Jude', 'New Testament', 'General Epistles', 1, 25, 'Canonical', FALSE, 65),
(66, 'REV', 'Revelation', 'New Testament', 'Apocalyptic', 22, 404, 'Canonical', FALSE, 66),

-- Deuterocanonical Books
(67, 'TOB', 'Tobit', 'Old Testament', 'Deuterocanonical', 14, 340, 'Deuterocanonical', TRUE, 67),
(68, 'JDT', 'Judith', 'Old Testament', 'Deuterocanonical', 16, 350, 'Deuterocanonical', TRUE, 68),
(69, 'WIS', 'Wisdom', 'Old Testament', 'Deuterocanonical', 19, 435, 'Deuterocanonical', TRUE, 69),
(70, 'SIR', 'Sirach', 'Old Testament', 'Deuterocanonical', 51, 1389, 'Deuterocanonical', TRUE, 70),
(71, 'BAR', 'Baruch', 'Old Testament', 'Deuterocanonical', 6, 213, 'Deuterocanonical', TRUE, 71),
(72, '1MA', '1 Maccabees', 'Old Testament', 'Deuterocanonical', 16, 924, 'Deuterocanonical', TRUE, 72),
(73, '2MA', '2 Maccabees', 'Old Testament', 'Deuterocanonical', 15, 555, 'Deuterocanonical', TRUE, 73);

-- ============================================================================
-- POPULATE CHAPTER VERSE COUNTS
-- ============================================================================

-- Genesis
INSERT INTO chapter_verse_counts (book_id, chapter_number, verse_count) VALUES
(1, 1, 31), (1, 2, 25), (1, 3, 24), (1, 4, 26), (1, 5, 32), (1, 6, 22), (1, 7, 24), (1, 8, 22), (1, 9, 29), (1, 10, 32),
(1, 11, 32), (1, 12, 20), (1, 13, 18), (1, 14, 24), (1, 15, 21), (1, 16, 16), (1, 17, 27), (1, 18, 33), (1, 19, 38), (1, 20, 18),
(1, 21, 34), (1, 22, 24), (1, 23, 20), (1, 24, 67), (1, 25, 34), (1, 26, 35), (1, 27, 46), (1, 28, 22), (1, 29, 35), (1, 30, 43),
(1, 31, 55), (1, 32, 32), (1, 33, 20), (1, 34, 31), (1, 35, 29), (1, 36, 43), (1, 37, 36), (1, 38, 30), (1, 39, 23), (1, 40, 23),
(1, 41, 57), (1, 42, 38), (1, 43, 34), (1, 44, 34), (1, 45, 28), (1, 46, 34), (1, 47, 31), (1, 48, 22), (1, 49, 33), (1, 50, 26);

-- Matthew
INSERT INTO chapter_verse_counts (book_id, chapter_number, verse_count) VALUES
(40, 1, 25), (40, 2, 23), (40, 3, 17), (40, 4, 25), (40, 5, 48), (40, 6, 34), (40, 7, 29), (40, 8, 34), (40, 9, 38), (40, 10, 42),
(40, 11, 30), (40, 12, 50), (40, 13, 58), (40, 14, 36), (40, 15, 39), (40, 16, 28), (40, 17, 27), (40, 18, 35), (40, 19, 30), (40, 20, 34),
(40, 21, 46), (40, 22, 46), (40, 23, 39), (40, 24, 51), (40, 25, 46), (40, 26, 75), (40, 27, 66), (40, 28, 20);

-- Add more chapter verse counts for other books as needed...
-- (This would be a very long list - including abbreviated version for brevity)

-- ============================================================================
-- POPULATE APOCRYPHAL CONTENT
-- ============================================================================

INSERT INTO apocryphal_content (book_id, chapter_number, verse_start, verse_end, description, canonical_status) VALUES
(27, 3, 24, 90, 'Prayer of Azariah and Song of Three Young Men', 'Deuterocanonical Addition'),
(27, 13, 1, 64, 'Susanna', 'Deuterocanonical Addition'),
(27, 14, 1, 42, 'Bel and the Dragon', 'Deuterocanonical Addition'),
(17, 10, 4, 13, 'Additions to Esther', 'Deuterocanonical Addition'),
(17, 13, 1, 7, 'Additional chapter in Esther', 'Deuterocanonical Addition');

-- ============================================================================
-- CREATE TEST DATA
-- ============================================================================

-- Test users
INSERT INTO users (username, email, password_hash, first_name, last_name, active, email_verified) VALUES
('testuser', 'test@example.com', '$2b$12$example_hash', 'Test', 'User', TRUE, TRUE),
('admin', 'admin@example.com', '$2b$12$example_hash_admin', 'Admin', 'User', TRUE, TRUE),
('demo', 'demo@example.com', '$2b$12$example_hash_demo', 'Demo', 'User', TRUE, TRUE);

-- User settings
INSERT INTO user_settings (user_id, denomination, preferred_bible, include_apocrypha, theme) VALUES
(1, 'Protestant', 'ESV', FALSE, 'light'),
(2, 'Catholic', 'NRSV', TRUE, 'dark'),
(3, 'Orthodox', 'RSV', TRUE, 'light');

-- Sample verse ranges for testing
INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end, range_name, difficulty_level, mastery_level) VALUES
(1, 43, 3, 16, 3, 16, 'John 3:16', 1, 85),
(1, 45, 8, 28, 8, 28, 'Romans 8:28', 2, 70),
(1, 19, 23, 1, 23, 6, 'Psalm 23', 3, 60),
(2, 40, 5, 3, 5, 12, 'Beatitudes', 4, 40),
(2, 46, 13, 4, 13, 13, 'Love Chapter', 5, 30),
(3, 1, 1, 1, 1, 3, 'Creation Beginning', 2, 80);

-- ============================================================================
-- HELPER FUNCTIONS AND PROCEDURES
-- ============================================================================

-- Function to get verse count for a specific book/chapter
CREATE OR REPLACE FUNCTION get_verse_count(p_book_id INTEGER, p_chapter INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT verse_count INTO v_count
    FROM chapter_verse_counts
    WHERE book_id = p_book_id AND chapter_number = p_chapter;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to validate verse range
CREATE OR REPLACE FUNCTION validate_verse_range(
    p_book_id INTEGER,
    p_chapter_start INTEGER,
    p_verse_start INTEGER,
    p_chapter_end INTEGER,
    p_verse_end INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_max_chapter INTEGER;
    v_max_verse_start INTEGER;
    v_max_verse_end INTEGER;
BEGIN
    -- Get max chapter for book
    SELECT total_chapters INTO v_max_chapter
    FROM books WHERE book_id = p_book_id;
    
    -- Check chapter bounds
    IF p_chapter_start < 1 OR p_chapter_end < 1 OR 
       p_chapter_start > v_max_chapter OR p_chapter_end > v_max_chapter THEN
        RETURN FALSE;
    END IF;
    
    -- Get max verses for chapters
    SELECT verse_count INTO v_max_verse_start
    FROM chapter_verse_counts
    WHERE book_id = p_book_id AND chapter_number = p_chapter_start;
    
    SELECT verse_count INTO v_max_verse_end
    FROM chapter_verse_counts
    WHERE book_id = p_book_id AND chapter_number = p_chapter_end;
    
    -- Check verse bounds
    IF p_verse_start < 1 OR p_verse_end < 1 OR
       p_verse_start > v_max_verse_start OR p_verse_end > v_max_verse_end THEN
        RETURN FALSE;
    END IF;
    
    -- Check logical order
    IF p_chapter_start > p_chapter_end OR
       (p_chapter_start = p_chapter_end AND p_verse_start > p_verse_end) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total verses in a range
CREATE OR REPLACE FUNCTION calculate_verse_count(
    p_book_id INTEGER,
    p_chapter_start INTEGER,
    p_verse_start INTEGER,
    p_chapter_end INTEGER,
    p_verse_end INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_total INTEGER := 0;
    v_chapter INTEGER;
    v_verse_count INTEGER;
BEGIN
    -- Single chapter range
    IF p_chapter_start = p_chapter_end THEN
        RETURN p_verse_end - p_verse_start + 1;
    END IF;
    
    -- Multi-chapter range
    FOR v_chapter IN p_chapter_start..p_chapter_end LOOP
        SELECT verse_count INTO v_verse_count
        FROM chapter_verse_counts
        WHERE book_id = p_book_id AND chapter_number = v_chapter;
        
        IF v_chapter = p_chapter_start THEN
            -- First chapter: from start verse to end
            v_total := v_total + (v_verse_count - p_verse_start + 1);
        ELSIF v_chapter = p_chapter_end THEN
            -- Last chapter: from 1 to end verse
            v_total := v_total + p_verse_end;
        ELSE
            -- Middle chapters: all verses
            v_total := v_total + v_verse_count;
        END IF;
    END LOOP;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Function to format verse reference
CREATE OR REPLACE FUNCTION format_verse_reference(
    p_book_id INTEGER,
    p_chapter_start INTEGER,
    p_verse_start INTEGER,
    p_chapter_end INTEGER,
    p_verse_end INTEGER
) RETURNS TEXT AS $$
DECLARE
    v_book_name TEXT;
    v_reference TEXT;
BEGIN
    SELECT book_name INTO v_book_name FROM books WHERE book_id = p_book_id;
    
    -- Single verse
    IF p_chapter_start = p_chapter_end AND p_verse_start = p_verse_end THEN
        v_reference := v_book_name || ' ' || p_chapter_start || ':' || p_verse_start;
    -- Same chapter, multiple verses
    ELSIF p_chapter_start = p_chapter_end THEN
        v_reference := v_book_name || ' ' || p_chapter_start || ':' || p_verse_start || '-' || p_verse_end;
    -- Multiple chapters
    ELSE
        v_reference := v_book_name || ' ' || p_chapter_start || ':' || p_verse_start || '-' || p_chapter_end || ':' || p_verse_end;
    END IF;
    
    RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update user_verse_ranges timestamp
CREATE OR REPLACE FUNCTION update_verse_range_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER tr_user_verse_ranges_updated
    BEFORE UPDATE ON user_verse_ranges
    FOR EACH ROW
    EXECUTE FUNCTION update_verse_range_timestamp();

-- ============================================================================
-- MATERIALIZED VIEW FOR USER PROGRESS
-- ============================================================================

CREATE MATERIALIZED VIEW user_progress_summary AS
SELECT 
    u.user_id,
    u.username,
    COUNT(uvr.range_id) as total_ranges,
    COUNT(CASE WHEN uvr.is_active THEN 1 END) as active_ranges,
    AVG(uvr.mastery_level) as avg_mastery,
    SUM(calculate_verse_count(uvr.book_id, uvr.chapter_start, uvr.verse_start, uvr.chapter_end, uvr.verse_end)) as total_verses,
    COUNT(CASE WHEN uvr.mastery_level >= 80 THEN 1 END) as mastered_ranges,
    COUNT(CASE WHEN uvr.next_review <= CURRENT_TIMESTAMP AND uvr.is_active THEN 1 END) as due_for_review
FROM users u
LEFT JOIN user_verse_ranges uvr ON u.user_id = uvr.user_id
WHERE u.active = TRUE
GROUP BY u.user_id, u.username;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_user_progress_summary_user_id ON user_progress_summary(user_id);

-- Function to refresh progress summary
CREATE OR REPLACE FUNCTION refresh_user_progress_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_progress_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ADDITIONAL UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's next review items
CREATE OR REPLACE FUNCTION get_user_review_items(p_user_id INTEGER, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    range_id INTEGER,
    reference TEXT,
    mastery_level INTEGER,
    last_reviewed TIMESTAMP,
    difficulty_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uvr.range_id,
        format_verse_reference(uvr.book_id, uvr.chapter_start, uvr.verse_start, uvr.chapter_end, uvr.verse_end) as reference,
        uvr.mastery_level,
        uvr.last_reviewed,
        uvr.difficulty_level
    FROM user_verse_ranges uvr
    WHERE uvr.user_id = p_user_id 
    AND uvr.is_active = TRUE
    AND (uvr.next_review IS NULL OR uvr.next_review <= CURRENT_TIMESTAMP)
    ORDER BY 
        COALESCE(uvr.next_review, '1900-01-01'::timestamp) ASC,
        uvr.difficulty_level DESC,
        uvr.mastery_level ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update mastery and schedule next review
CREATE OR REPLACE FUNCTION update_review_result(
    p_range_id INTEGER,
    p_success BOOLEAN,
    p_difficulty INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_current_mastery INTEGER;
    v_review_interval INTERVAL;
BEGIN
    -- Get current mastery
    SELECT mastery_level INTO v_current_mastery
    FROM user_verse_ranges WHERE range_id = p_range_id;
    
    -- Update mastery based on success
    IF p_success THEN
        -- Successful review increases mastery
        UPDATE user_verse_ranges 
        SET 
            mastery_level = LEAST(100, v_current_mastery + 5),
            review_count = review_count + 1,
            last_reviewed = CURRENT_TIMESTAMP,
            difficulty_level = COALESCE(p_difficulty, difficulty_level)
        WHERE range_id = p_range_id;
        
        -- Calculate next review interval based on mastery
        v_review_interval := CASE 
            WHEN v_current_mastery < 20 THEN INTERVAL '1 day'
            WHEN v_current_mastery < 40 THEN INTERVAL '3 days'
            WHEN v_current_mastery < 60 THEN INTERVAL '1 week'
            WHEN v_current_mastery < 80 THEN INTERVAL '2 weeks'
            ELSE INTERVAL '1 month'
        END;
    ELSE
        -- Failed review decreases mastery slightly
        UPDATE user_verse_ranges 
        SET 
            mastery_level = GREATEST(0, v_current_mastery - 3),
            review_count = review_count + 1,
            last_reviewed = CURRENT_TIMESTAMP,
            difficulty_level = COALESCE(p_difficulty, difficulty_level)
        WHERE range_id = p_range_id;
        
        -- Shorter interval for failed reviews
        v_review_interval := INTERVAL '1 day';
    END IF;
    
    -- Schedule next review
    UPDATE user_verse_ranges 
    SET next_review = CURRENT_TIMESTAMP + v_review_interval
    WHERE range_id = p_range_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FINAL SETUP AND PERMISSIONS
-- ============================================================================

-- Grant permissions (adjust as needed for your application user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW user_progress_summary;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Display setup summary
DO $$
DECLARE
    book_count INTEGER;
    user_count INTEGER;
    range_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO book_count FROM books;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO range_count FROM user_verse_ranges;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'WELL VERSED DATABASE SETUP COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Books loaded: %', book_count;
    RAISE NOTICE 'Test users created: %', user_count;
    RAISE NOTICE 'Sample verse ranges: %', range_count;
    RAISE NOTICE 'Helper functions: 8 created';
    RAISE NOTICE 'Indexes: % created', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
    RAISE NOTICE '============================================';
END $$;
        """
        
        self.cur.execute(schema_sql)
        self.conn.commit()
        print("Schema created successfully")
        
    def populate_books(self):
        """Populate books table"""
        print("Populating books...")
        
        books_data = [
            (1, 'GEN', 'Genesis', 'Old Testament', 'Torah', 50, 1533, 'All', False, 1),
            (2, 'EXO', 'Exodus', 'Old Testament', 'Torah', 40, 1213, 'All', False, 2),
            (3, 'LEV', 'Leviticus', 'Old Testament', 'Torah', 27, 859, 'All', False, 3),
            (4, 'NUM', 'Numbers', 'Old Testament', 'Torah', 36, 1288, 'All', False, 4),
            (5, 'DEU', 'Deuteronomy', 'Old Testament', 'Torah', 34, 959, 'All', False, 5),
            (6, 'JOS', 'Joshua', 'Old Testament', 'Historical', 24, 658, 'All', False, 6),
            (7, 'JDG', 'Judges', 'Old Testament', 'Historical', 21, 618, 'All', False, 7),
            (8, 'RUT', 'Ruth', 'Old Testament', 'Historical', 4, 85, 'All', False, 8),
            (9, '1SA', '1 Samuel', 'Old Testament', 'Historical', 31, 810, 'All', False, 9),
            (10, '2SA', '2 Samuel', 'Old Testament', 'Historical', 24, 695, 'All', False, 10),
            (11, '1KI', '1 Kings', 'Old Testament', 'Historical', 22, 816, 'All', False, 11),
            (12, '2KI', '2 Kings', 'Old Testament', 'Historical', 25, 719, 'All', False, 12),
            (13, '1CH', '1 Chronicles', 'Old Testament', 'Historical', 29, 942, 'All', False, 13),
            (14, '2CH', '2 Chronicles', 'Old Testament', 'Historical', 36, 822, 'All', False, 14),
            (15, 'EZR', 'Ezra', 'Old Testament', 'Historical', 10, 280, 'All', False, 15),
            (16, 'NEH', 'Nehemiah', 'Old Testament', 'Historical', 13, 406, 'All', False, 16),
            (17, 'EST', 'Esther', 'Old Testament', 'Historical', 10, 167, 'All', False, 17),
            (18, 'JOB', 'Job', 'Old Testament', 'Wisdom', 42, 1070, 'All', False, 18),
            (19, 'PSA', 'Psalms', 'Old Testament', 'Wisdom', 151, 2461, 'All', False, 19),
            (20, 'PRO', 'Proverbs', 'Old Testament', 'Wisdom', 31, 915, 'All', False, 20),
            (21, 'ECC', 'Ecclesiastes', 'Old Testament', 'Wisdom', 12, 222, 'All', False, 21),
            (22, 'SOS', 'Song of Solomon', 'Old Testament', 'Wisdom', 8, 117, 'All', False, 22),
            (23, 'ISA', 'Isaiah', 'Old Testament', 'Major Prophets', 66, 1292, 'All', False, 23),
            (24, 'JER', 'Jeremiah', 'Old Testament', 'Major Prophets', 52, 1364, 'All', False, 24),
            (25, 'LAM', 'Lamentations', 'Old Testament', 'Major Prophets', 5, 154, 'All', False, 25),
            (26, 'EZK', 'Ezekiel', 'Old Testament', 'Major Prophets', 48, 1273, 'All', False, 26),
            (27, 'DAN', 'Daniel', 'Old Testament', 'Major Prophets', 12, 357, 'All', False, 27),
            (28, 'HOS', 'Hosea', 'Old Testament', 'Minor Prophets', 14, 197, 'All', False, 28),
            (29, 'JOL', 'Joel', 'Old Testament', 'Minor Prophets', 3, 73, 'All', False, 29),
            (30, 'AMO', 'Amos', 'Old Testament', 'Minor Prophets', 9, 146, 'All', False, 30),
            (31, 'OBA', 'Obadiah', 'Old Testament', 'Minor Prophets', 1, 21, 'All', False, 31),
            (32, 'JON', 'Jonah', 'Old Testament', 'Minor Prophets', 4, 48, 'All', False, 32),
            (33, 'MIC', 'Micah', 'Old Testament', 'Minor Prophets', 7, 105, 'All', False, 33),
            (34, 'NAH', 'Nahum', 'Old Testament', 'Minor Prophets', 3, 47, 'All', False, 34),
            (35, 'HAB', 'Habakkuk', 'Old Testament', 'Minor Prophets', 3, 56, 'All', False, 35),
            (36, 'ZEP', 'Zephaniah', 'Old Testament', 'Minor Prophets', 3, 53, 'All', False, 36),
            (37, 'HAG', 'Haggai', 'Old Testament', 'Minor Prophets', 2, 38, 'All', False, 37),
            (38, 'ZEC', 'Zechariah', 'Old Testament', 'Minor Prophets', 14, 211, 'All', False, 38),
            (39, 'MAL', 'Malachi', 'Old Testament', 'Minor Prophets', 4, 55, 'All', False, 39),
            (40, 'MAT', 'Matthew', 'New Testament', 'Gospels', 28, 1071, 'All', False, 40),
            (41, 'MRK', 'Mark', 'New Testament', 'Gospels', 16, 678, 'All', False, 41),
            (42, 'LUK', 'Luke', 'New Testament', 'Gospels', 24, 1151, 'All', False, 42),
            (43, 'JHN', 'John', 'New Testament', 'Gospels', 21, 879, 'All', False, 43),
            (44, 'ACT', 'Acts', 'New Testament', 'Modern Historical', 28, 1007, 'All', False, 44),
            (45, 'ROM', 'Romans', 'New Testament', 'Pauline Epistles', 16, 433, 'All', False, 45),
            (46, '1CO', '1 Corinthians', 'New Testament', 'Pauline Epistles', 16, 437, 'All', False, 46),
            (47, '2CO', '2 Corinthians', 'New Testament', 'Pauline Epistles', 13, 257, 'All', False, 47),
            (48, 'GAL', 'Galatians', 'New Testament', 'Pauline Epistles', 6, 149, 'All', False, 48),
            (49, 'EPH', 'Ephesians', 'New Testament', 'Pauline Epistles', 6, 155, 'All', False, 49),
            (50, 'PHP', 'Philippians', 'New Testament', 'Pauline Epistles', 4, 104, 'All', False, 50),
            (51, 'COL', 'Colossians', 'New Testament', 'Pauline Epistles', 4, 95, 'All', False, 51),
            (52, '1TH', '1 Thessalonians', 'New Testament', 'Pauline Epistles', 5, 89, 'All', False, 52),
            (53, '2TH', '2 Thessalonians', 'New Testament', 'Pauline Epistles', 3, 47, 'All', False, 53),
            (54, '1TI', '1 Timothy', 'New Testament', 'Pauline Epistles', 6, 113, 'All', False, 54),
            (55, '2TI', '2 Timothy', 'New Testament', 'Pauline Epistles', 4, 83, 'All', False, 55),
            (56, 'TIT', 'Titus', 'New Testament', 'Pauline Epistles', 3, 46, 'All', False, 56),
            (57, 'PHM', 'Philemon', 'New Testament', 'Pauline Epistles', 1, 25, 'All', False, 57),
            (58, 'HEB', 'Hebrews', 'New Testament', 'Pauline Epistles', 13, 303, 'All', False, 58),
            (59, 'JAS', 'James', 'New Testament', 'General Epistles', 5, 108, 'All', False, 59),
            (60, '1PE', '1 Peter', 'New Testament', 'General Epistles', 5, 105, 'All', False, 60),
            (61, '2PE', '2 Peter', 'New Testament', 'General Epistles', 3, 61, 'All', False, 61),
            (62, '1JN', '1 John', 'New Testament', 'General Epistles', 5, 105, 'All', False, 62),
            (63, '2JN', '2 John', 'New Testament', 'General Epistles', 1, 13, 'All', False, 63),
            (64, '3JN', '3 John', 'New Testament', 'General Epistles', 1, 15, 'All', False, 64),
            (65, 'JDE', 'Jude', 'New Testament', 'General Epistles', 1, 25, 'All', False, 65),
            (66, 'REV', 'Revelation', 'New Testament', 'Apocalyptic', 22, 404, 'All', False, 66),
            (67, 'TOB', 'Tobit', 'Old Testament', 'Historical', 14, 244, 'Catholic', True, 67),
            (68, 'JDT', 'Judith', 'Old Testament', 'Historical', 16, 339, 'Catholic', True, 68),
            (69, 'WIS', 'Wisdom of Solomon', 'Old Testament', 'Wisdom', 19, 436, 'Catholic', True, 69),
            (70, 'SIR', 'Sirach', 'Old Testament', 'Wisdom', 51, 1424, 'Catholic', True, 70),
            (71, 'BAR', 'Baruch', 'Old Testament', 'Major Prophets', 6, 213, 'Catholic', True, 71),
            (72, '1MA', '1 Maccabees', 'Old Testament', 'Historical', 16, 924, 'Catholic', True, 72),
            (73, '2MA', '2 Maccabees', 'Old Testament', 'Historical', 15, 555, 'Catholic', True, 73),
            (74, '1ES', '1 Esdras', 'Old Testament', 'Historical', 9, 439, 'Eastern Orthodox', True, 74),
            (75, '3MA', '3 Maccabees', 'Old Testament', 'Historical', 7, 227, 'Eastern Orthodox', True, 75),
            (76, 'PAM', 'Prayer of Manasseh', 'Old Testament', 'Wisdom', 1, 15, 'Eastern Orthodox', True, 76)
        ]
        
        self.cur.executemany("""
            INSERT INTO books (book_id, book_code, book_name, testament, book_group, 
                             total_chapters, total_verses, canonical_affiliation, 
                             is_apocryphal_book, display_order)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, books_data)
        
        self.conn.commit()
        print(f"Populated {len(books_data)} books")
        
    def populate_chapter_verse_counts(self):
        """Populate chapter verse counts from bible_base_data.json"""
        print("Populating chapter verse counts...")
        
        # Try to find bible_base_data.json
        json_paths = [
            Path('bible_base_data.json'),
            Path('../bible_data/bible_base_data.json'),
            Path('/app/bible_data/bible_base_data.json'),
            Path('/data/bible_base_data.json')
        ]
        
        bible_data = None
        for path in json_paths:
            if path.exists():
                with open(path, 'r') as f:
                    bible_data = json.load(f)
                print(f"Found bible data at: {path}")
                break
        
        if not bible_data:
            print("Warning: bible_base_data.json not found, using sample data")
            # Add sample data for essential books
            sample_data = [
                (1, 1, 31), (1, 2, 25), (1, 3, 24),  # Genesis
                (19, 23, 6), (19, 151, 7),  # Psalms
                (27, 3, 100), (27, 13, 64), (27, 14, 42),  # Daniel
                (43, 3, 36),  # John
            ]
            self.cur.executemany("""
                INSERT INTO chapter_verse_counts (book_id, chapter_number, verse_count)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING
            """, sample_data)
        else:
            # Process actual bible data
            book_codes = self.get_book_codes()
            count = 0
            
            for book in bible_data['books']:
                if book['canonicalAffiliation'] == 'NONE':
                    continue
                
                book_code = book_codes.get(book['name'])
                if not book_code:
                    continue
                
                # Get book_id
                self.cur.execute("SELECT book_id FROM books WHERE book_code = %s", (book_code,))
                result = self.cur.fetchone()
                if not result:
                    continue
                
                book_id = result[0]
                
                # Insert chapter verse counts
                for chapter_num, verse_count in enumerate(book['chapters'], 1):
                    self.cur.execute("""
                        INSERT INTO chapter_verse_counts (book_id, chapter_number, verse_count)
                        VALUES (%s, %s, %s)
                        ON CONFLICT DO NOTHING
                    """, (book_id, chapter_num, verse_count))
                    count += 1
            
            print(f"Populated {count} chapter verse counts")
        
        self.conn.commit()
        
    def populate_apocryphal_content(self):
        """Populate apocryphal content mapping"""
        print("Populating apocryphal content...")
        
        apocryphal_data = [
            (19, 151, None, None, 'Psalm 151'),
            (27, 3, 24, 90, 'Prayer of Azariah and Song of the Three Holy Children'),
            (27, 13, None, None, 'Susanna'),
            (27, 14, None, None, 'Bel and the Dragon'),
            (17, 10, 4, 16, 'Additions to Esther'),
            (17, 11, None, None, 'Additions to Esther'),
            (17, 12, None, None, 'Additions to Esther'),
            (17, 13, None, None, 'Additions to Esther'),
            (17, 14, None, None, 'Additions to Esther'),
            (17, 15, None, None, 'Additions to Esther'),
            (17, 16, None, None, 'Additions to Esther')
        ]
        
        self.cur.executemany("""
            INSERT INTO apocryphal_content (book_id, chapter_number, verse_start, verse_end, description)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, apocryphal_data)
        
        self.conn.commit()
        print(f"Populated {len(apocryphal_data)} apocryphal content entries")
        
    def create_test_data(self):
        """Create test user and sample data"""
        print("Creating test data...")
        
        # Create test user
        self.cur.execute("""
            INSERT INTO users (username, email, password_hash, first_name, last_name)
            VALUES ('testuser', 'test@example.com', 'test_hash', 'Test', 'User')
            ON CONFLICT (username) DO NOTHING
        """)
        
        self.cur.execute("""
            INSERT INTO user_settings (user_id, denomination, preferred_bible, include_apocrypha)
            VALUES (1, 'Non-denominational', 'ESV', FALSE)
            ON CONFLICT (user_id) DO NOTHING
        """)
        
        # Sample verse ranges
        sample_ranges = [
            (1, 43, 3, 16, 3, 17),  # John 3:16-17
            (1, 19, 23, 1, 23, 6),  # Psalm 23
            (1, 45, 8, 28, 8, 39),  # Romans 8:28-39
            (1, 1, 1, 1, 2, 25),    # Genesis 1-2
        ]
        
        self.cur.executemany("""
            INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, sample_ranges)
        
        self.conn.commit()
        print("Test data created")
        
    def create_helper_functions(self):
        """Create helper functions and views"""
        print("Creating helper functions...")
        
        functions_sql = """
        -- Materialized view for progress
        CREATE MATERIALIZED VIEW IF NOT EXISTS user_progress_summary AS
        WITH verse_counts AS (
            SELECT 
                uvr.user_id,
                uvr.book_id,
                SUM(
                    CASE 
                        WHEN uvr.chapter_start = uvr.chapter_end THEN 
                            uvr.verse_end - uvr.verse_start + 1
                        ELSE
                            -- Complex calculation for multi-chapter ranges
                            COALESCE((
                                SELECT SUM(
                                    CASE 
                                        WHEN cvc.chapter_number = uvr.chapter_start THEN cvc.verse_count - uvr.verse_start + 1
                                        WHEN cvc.chapter_number = uvr.chapter_end THEN uvr.verse_end
                                        ELSE cvc.verse_count
                                    END
                                )
                                FROM chapter_verse_counts cvc
                                WHERE cvc.book_id = uvr.book_id 
                                AND cvc.chapter_number >= uvr.chapter_start 
                                AND cvc.chapter_number <= uvr.chapter_end
                            ), 0)
                    END
                ) as verses_in_book
            FROM user_verse_ranges uvr
            GROUP BY uvr.user_id, uvr.book_id
        )
        SELECT 
            u.user_id,
            u.username,
            COUNT(DISTINCT vc.book_id) as books_started,
            COALESCE(SUM(vc.verses_in_book), 0) as total_verses_memorized,
            MAX(uvr.updated_at) as last_activity
        FROM users u
        LEFT JOIN verse_counts vc ON u.user_id = vc.user_id
        LEFT JOIN user_verse_ranges uvr ON u.user_id = uvr.user_id
        GROUP BY u.user_id, u.username;

        CREATE INDEX IF NOT EXISTS idx_user_progress_summary_user_id ON user_progress_summary(user_id);
        
        -- Refresh the view
        REFRESH MATERIALIZED VIEW user_progress_summary;
        """
        
        self.cur.execute(functions_sql)
        self.conn.commit()
        print("Helper functions created")
        
    def get_book_codes(self):
        """Return book name to code mapping"""
        return {
            'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
            'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
            '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
            '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
            'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO',
            'Ecclesiastes': 'ECC', 'Song of Solomon': 'SOS', 'Isaiah': 'ISA',
            'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
            'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA',
            'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB',
            'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
            'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
            'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
            'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
            '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI',
            '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
            'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN',
            '2 John': '2JN', '3 John': '3JN', 'Jude': 'JDE', 'Revelation': 'REV',
            'Tobit': 'TOB', 'Judith': 'JDT', 'Wisdom of Solomon': 'WIS', 'Sirach': 'SIR',
            'Baruch': 'BAR', '1 Maccabees': '1MA', '2 Maccabees': '2MA', '1 Esdras': '1ES',
            '3 Maccabees': '3MA', 'Prayer of Manasseh': 'PAM'
        }
        
    def run(self):
        """Run complete initialization"""
        try:
            if not self.wait_for_db():
                sys.exit(1)
                
            self.create_schema()
            self.populate_books()
            self.populate_chapter_verse_counts()
            self.populate_apocryphal_content()
            self.create_test_data()
            self.create_helper_functions()
            
            print("\n✅ Database initialization complete!")
            
        except Exception as e:
            print(f"❌ Error during initialization: {e}")
            if self.conn:
                self.conn.rollback()
            raise
        finally:
            if self.cur:
                self.cur.close()
            if self.conn:
                self.conn.close()

if __name__ == '__main__':
    initializer = DatabaseInitializer()
    initializer.run()