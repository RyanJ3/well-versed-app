-- /data/01_drop_all.sql
-- Drop everything for fresh start

-- Drop triggers
DROP TRIGGER IF EXISTS update_deck_saves ON saved_decks;
DROP TRIGGER IF EXISTS update_user_verses_timestamp ON user_verses;
DROP TRIGGER IF EXISTS update_decks_timestamp ON decks;

-- Drop functions
DROP FUNCTION IF EXISTS update_deck_save_count() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_verse_details(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS parse_verse_id(VARCHAR) CASCADE;

-- Drop tables
DROP TABLE IF EXISTS deck_tags CASCADE;
DROP TABLE IF EXISTS saved_decks CASCADE;
DROP TABLE IF EXISTS deck_verses CASCADE;
DROP TABLE IF EXISTS decks CASCADE;
DROP TABLE IF EXISTS user_verses CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS apocryphal_content CASCADE;
DROP TABLE IF EXISTS chapter_verse_counts CASCADE;
DROP TABLE IF EXISTS books CASCADE;

-- Drop types
DROP TYPE IF EXISTS testament_type CASCADE;
DROP TYPE IF EXISTS canonical_type CASCADE;
DROP TYPE IF EXISTS book_group_type CASCADE;
DROP TYPE IF EXISTS confidence_level CASCADE;
DROP TYPE IF EXISTS bible_translation CASCADE;