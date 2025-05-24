-- sql_setup/04-test-data.sql
-- Create test user
-- If you need to run this manually:
SET search_path TO wellversed01DEV;

-- Verify the setup
SELECT 
    'Books:' as item,
    COUNT(*) as count 
FROM bible_books
UNION ALL
SELECT 
    'Verses:' as item,
    COUNT(*) as count 
FROM bible_verses
UNION ALL
SELECT 
    'Users:' as item,
    COUNT(*) as count 
FROM users;