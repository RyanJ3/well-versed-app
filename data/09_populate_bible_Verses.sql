-- data/09_populate_bible_verses.sql
-- Populate bible_verses table with all verse records

INSERT INTO bible_verses (book_id, chapter_number, verse_number)
SELECT 
    b.book_id,
    c.chapter_number,
    v.verse_num
FROM books b
CROSS JOIN chapter_verse_counts c
CROSS JOIN LATERAL generate_series(1, c.verse_count) AS v(verse_num)
WHERE b.book_id = c.book_id
ON CONFLICT (book_id, chapter_number, verse_number) DO NOTHING;

-- Verify the population
DO $$
DECLARE
    expected_count INTEGER;
    actual_count INTEGER;
BEGIN
    -- Calculate expected total verses from chapter_verse_counts
    SELECT SUM(verse_count) INTO expected_count FROM chapter_verse_counts;
    
    -- Get actual count
    SELECT COUNT(*) INTO actual_count FROM bible_verses;
    
    RAISE NOTICE 'Expected verses: %, Actual verses: %', expected_count, actual_count;
    
    IF expected_count != actual_count THEN
        RAISE WARNING 'Verse count mismatch! Expected % but got %', expected_count, actual_count;
    END IF;
END $$;