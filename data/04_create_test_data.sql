-- /data/04_create_test_data.sql
-- Create test user and sample data

-- Test user
INSERT INTO users (username, email, password_hash, first_name, last_name) 
VALUES ('testuser', 'test@example.com', 'test_hash', 'Test', 'User')
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_settings (user_id, denomination, preferred_bible, include_apocrypha)
VALUES (1, 'Non-denominational', 'ESV', FALSE)
ON CONFLICT (user_id) DO NOTHING;

-- Sample memorized verses using ranges
-- John 3:16-17
INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
VALUES (1, 43, 3, 16, 3, 17);

-- Psalm 23 (entire chapter)
INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
VALUES (1, 19, 23, 1, 23, 6);

-- Romans 8:28-39 (partial chapter)
INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
VALUES (1, 45, 8, 28, 8, 39);

-- Genesis 1-2 (cross-chapter range)
INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
VALUES (1, 1, 1, 1, 2, 25);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW user_progress_summary;