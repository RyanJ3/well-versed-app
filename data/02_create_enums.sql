-- /data/02_create_enums.sql
-- Create custom enum types

CREATE TYPE testament_type AS ENUM ('Old Testament', 'New Testament');

CREATE TYPE canonical_type AS ENUM ('All', 'Catholic', 'Eastern Orthodox', 'Protestant', 'NONE');

CREATE TYPE book_group_type AS ENUM (
    'Torah',
    'Historical', 
    'Wisdom',
    'Major Prophets',
    'Minor Prophets',
    'Gospels',
    'Modern Historical',
    'Pauline Epistles',
    'General Epistles',
    'Apocalyptic'
);

CREATE TYPE confidence_level AS ENUM ('0', '1', '2', '3', '4', '5');

CREATE TYPE bible_translation AS ENUM (
    'KJV', 'NIV', 'ESV', 'NASB', 'NLT', 
    'CSB', 'NKJV', 'RSV', 'MSG', 'AMP'
);