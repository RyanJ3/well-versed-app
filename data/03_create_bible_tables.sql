-- /data/03_create_bible_tables.sql
-- Bible structure tables

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

CREATE TABLE apocryphal_content (
    apocryphal_id SERIAL PRIMARY KEY,
    book_id SMALLINT NOT NULL REFERENCES books(book_id),
    chapter_number SMALLINT NOT NULL,
    verse_start SMALLINT,
    verse_end SMALLINT,
    description VARCHAR(100),
    UNIQUE(book_id, chapter_number, verse_start, verse_end)
);