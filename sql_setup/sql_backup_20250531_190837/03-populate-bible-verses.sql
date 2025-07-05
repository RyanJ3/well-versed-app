-- =====================================================
-- 03-populate-bible-verses.sql
-- (This is handled by Python script to insert bible data)
-- =====================================================
-- Set schema
SET search_path TO wellversed01dev, public;

-- Clear existing data
TRUNCATE TABLE bible_verses CASCADE;

-- Bible verses will be inserted via Python script that reads this file
-- and appends INSERT statements dynamically from bible_base_data.json