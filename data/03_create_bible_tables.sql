-- data/03_create_bible_tables.sql
-- Normalized Bible structure tables

CREATE TABLE books (
    book_id SMALLINT PRIMARY KEY,
    book_code CHAR(4) NOT NULL UNIQUE,
    book_name VARCHAR(50) NOT NULL,
    testament testament_type NOT NULL,
    book_group book_group_type NOT NULL,
    total_chapters SMALLINT NOT NULL,
    total_verses INTEGER NOT NULL,
    canonical_affiliation canonical_type NOT NULL,
    is_apocryphal_book BOOLEAN DEFAULT FALSE,
    display_order SMALLINT NOT NULL
);

CREATE TABLE chapter_verse_counts (
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_count SMALLINT NOT NULL,
    PRIMARY KEY (book_id, chapter_number)
);

-- New table for all possible verses
CREATE TABLE bible_verses (
    verse_id SERIAL PRIMARY KEY,
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_number SMALLINT NOT NULL,
    verse_code VARCHAR(20),  -- Will be populated via trigger
    UNIQUE(book_id, chapter_number, verse_number)
);

CREATE TABLE apocryphal_content (
    apocryphal_id SERIAL PRIMARY KEY,
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_start SMALLINT,
    verse_end SMALLINT,
    description VARCHAR(100),
    UNIQUE(book_id, chapter_number, verse_start, verse_end)
);

-- Indexes for performance
CREATE INDEX idx_bible_verses_book ON bible_verses(book_id);
CREATE INDEX idx_bible_verses_chapter ON bible_verses(book_id, chapter_number);
CREATE INDEX idx_bible_verses_code ON bible_verses(verse_code);