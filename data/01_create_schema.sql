-- /data/01_create_schema.sql
-- Well Versed Optimized Database Schema with Cross-Chapter Support

-- Drop existing tables
DROP TABLE IF EXISTS user_verse_ranges CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS apocryphal_content CASCADE;
DROP TABLE IF EXISTS chapter_verse_counts CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP MATERIALIZED VIEW IF EXISTS user_progress_summary CASCADE;

-- Books metadata table
CREATE TABLE books (
    book_id SMALLINT PRIMARY KEY,
    book_code CHAR(3) NOT NULL UNIQUE,
    book_name VARCHAR(50) NOT NULL,
    testament VARCHAR(20) NOT NULL CHECK (testament IN ('Old Testament', 'New Testament')),
    book_group VARCHAR(50) NOT NULL,
    total_chapters SMALLINT NOT NULL,
    total_verses INTEGER NOT NULL,
    canonical_affiliation VARCHAR(20) NOT NULL,
    is_apocryphal_book BOOLEAN DEFAULT FALSE,
    display_order SMALLINT NOT NULL
);

-- Chapter verse counts (for accurate range validation)
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
    active BOOLEAN DEFAULT TRUE
);

-- User settings
CREATE TABLE user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    denomination VARCHAR(50),
    preferred_bible VARCHAR(50) DEFAULT 'ESV',
    include_apocrypha BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Apocryphal content mapping
CREATE TABLE apocryphal_content (
    apocryphal_id SERIAL PRIMARY KEY,
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_start SMALLINT,
    verse_end SMALLINT,
    description VARCHAR(100),
    UNIQUE(book_id, chapter_number, verse_start, verse_end)
);

-- User verse ranges (supports cross-chapter ranges)
CREATE TABLE user_verse_ranges (
    range_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_start SMALLINT NOT NULL,
    verse_start SMALLINT NOT NULL,
    chapter_end SMALLINT NOT NULL,
    verse_end SMALLINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_range CHECK (
        (chapter_start < chapter_end) OR 
        (chapter_start = chapter_end AND verse_start <= verse_end)
    ),
    UNIQUE(user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
);

-- Indexes
CREATE INDEX idx_user_verse_ranges_user_book ON user_verse_ranges(user_id, book_id);
CREATE INDEX idx_user_verse_ranges_chapters ON user_verse_ranges(user_id, book_id, chapter_start, chapter_end);
CREATE INDEX idx_apocryphal_book_chapter ON apocryphal_content(book_id, chapter_number);
CREATE INDEX idx_chapter_counts_book ON chapter_verse_counts(book_id);

-- Function to add single verse
CREATE OR REPLACE FUNCTION add_memorized_verse(
    p_user_id INTEGER,
    p_book_id SMALLINT,
    p_chapter SMALLINT,
    p_verse SMALLINT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
    VALUES (p_user_id, p_book_id, p_chapter, p_verse, p_chapter, p_verse)
    ON CONFLICT DO NOTHING;
    
    -- Merge adjacent ranges
    PERFORM merge_user_ranges(p_user_id, p_book_id);
END;
$$ LANGUAGE plpgsql;

-- Function to add chapter
CREATE OR REPLACE FUNCTION add_memorized_chapter(
    p_user_id INTEGER,
    p_book_id SMALLINT,
    p_chapter SMALLINT
) RETURNS VOID AS $$
DECLARE
    v_verse_count SMALLINT;
BEGIN
    -- Get verse count for chapter
    SELECT verse_count INTO v_verse_count 
    FROM chapter_verse_counts 
    WHERE book_id = p_book_id AND chapter_number = p_chapter;
    
    INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
    VALUES (p_user_id, p_book_id, p_chapter, 1, p_chapter, v_verse_count)
    ON CONFLICT DO NOTHING;
    
    PERFORM merge_user_ranges(p_user_id, p_book_id);
END;
$$ LANGUAGE plpgsql;

-- Function to merge adjacent/overlapping ranges
CREATE OR REPLACE FUNCTION merge_user_ranges(
    p_user_id INTEGER,
    p_book_id SMALLINT
) RETURNS VOID AS $$
BEGIN
    -- Complex merge logic for cross-chapter ranges
    WITH RECURSIVE merged_ranges AS (
        -- Base: ranges that don't overlap with any previous range
        SELECT 
            range_id,
            user_id,
            book_id,
            chapter_start,
            verse_start,
            chapter_end,
            verse_end,
            ROW_NUMBER() OVER (ORDER BY chapter_start, verse_start) as rn
        FROM user_verse_ranges
        WHERE user_id = p_user_id AND book_id = p_book_id
    ),
    grouped_ranges AS (
        -- Group overlapping/adjacent ranges
        SELECT 
            range_id,
            user_id,
            book_id,
            chapter_start,
            verse_start,
            chapter_end,
            verse_end,
            SUM(CASE WHEN is_new_group THEN 1 ELSE 0 END) OVER (ORDER BY rn) as group_id
        FROM (
            SELECT 
                *,
                CASE 
                    WHEN LAG(chapter_end) OVER (ORDER BY rn) IS NULL THEN TRUE
                    WHEN LAG(chapter_end) OVER (ORDER BY rn) < chapter_start - 1 THEN TRUE
                    WHEN LAG(chapter_end) OVER (ORDER BY rn) = chapter_start - 1 
                         AND LAG(verse_end) OVER (ORDER BY rn) < (
                             SELECT verse_count FROM chapter_verse_counts 
                             WHERE book_id = p_book_id AND chapter_number = chapter_start - 1
                         ) THEN TRUE
                    WHEN LAG(chapter_end) OVER (ORDER BY rn) = chapter_start
                         AND LAG(verse_end) OVER (ORDER BY rn) < verse_start - 1 THEN TRUE
                    ELSE FALSE
                END as is_new_group
            FROM merged_ranges
        ) t
    )
    -- Delete old ranges and insert merged ones
    DELETE FROM user_verse_ranges 
    WHERE user_id = p_user_id AND book_id = p_book_id;
    
    INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
    SELECT 
        user_id,
        book_id,
        MIN(chapter_start),
        MIN(CASE WHEN chapter_start = MIN(chapter_start) THEN verse_start END),
        MAX(chapter_end),
        MAX(CASE WHEN chapter_end = MAX(chapter_end) THEN verse_end END)
    FROM grouped_ranges
    GROUP BY user_id, book_id, group_id;
END;
$$ LANGUAGE plpgsql;

-- Materialized view for progress
CREATE MATERIALIZED VIEW user_progress_summary AS
WITH verse_counts AS (
    SELECT 
        uvr.user_id,
        uvr.book_id,
        SUM(
            CASE 
                WHEN uvr.chapter_start = uvr.chapter_end THEN 
                    uvr.verse_end - uvr.verse_start + 1
                ELSE
                    -- First chapter verses
                    (SELECT verse_count - uvr.verse_start + 1 
                     FROM chapter_verse_counts 
                     WHERE book_id = uvr.book_id AND chapter_number = uvr.chapter_start)
                    +
                    -- Middle chapters (if any)
                    COALESCE((SELECT SUM(verse_count) 
                     FROM chapter_verse_counts 
                     WHERE book_id = uvr.book_id 
                     AND chapter_number > uvr.chapter_start 
                     AND chapter_number < uvr.chapter_end), 0)
                    +
                    -- Last chapter verses
                    uvr.verse_end
            END
        ) as verses_in_book
    FROM user_verse_ranges uvr
    GROUP BY uvr.user_id, uvr.book_id
)
SELECT 
    u.user_id,
    u.username,
    COUNT(DISTINCT vc.book_id) as books_started,
    SUM(vc.verses_in_book) as total_verses_memorized,
    MAX(uvr.updated_at) as last_activity
FROM users u
LEFT JOIN verse_counts vc ON u.user_id = vc.user_id
LEFT JOIN user_verse_ranges uvr ON u.user_id = uvr.user_id
GROUP BY u.user_id, u.username;

CREATE INDEX idx_user_progress_summary_user_id ON user_progress_summary(user_id);