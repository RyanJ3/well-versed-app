-- sql_setup/04-test-data.sql
-- Create test user
SET search_path TO wellversed01DEV;

INSERT INTO users (email, name, first_name, last_name, denomination, preferred_bible)
VALUES ('test@example.com', 'Test User', 'Test', 'User', 'Non-denominational', 'KJV')
ON CONFLICT (email) DO NOTHING;

-- Add some memorized verses for the test user (John 3:16, Genesis 1:1, Psalm 23:1)
INSERT INTO user_verses (user_id, verse_id, practice_count)
SELECT 
    (SELECT user_id FROM users WHERE email = 'test@example.com'),
    v.id,
    1
FROM bible_verses v
WHERE v.verse_code IN ('JOHN-003-016', 'GENE-001-001', 'PSAL-023-001')
ON CONFLICT DO NOTHING;

-- Verify
SELECT 
    u.name as user_name,
    COUNT(uv.verse_id) as verses_memorized
FROM users u
LEFT JOIN user_verses uv ON u.user_id = uv.user_id
WHERE u.email = 'test@example.com'
GROUP BY u.user_id, u.name;