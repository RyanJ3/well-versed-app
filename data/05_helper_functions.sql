-- /data/05_helper_functions.sql
-- Utility functions for the API

-- Get user verses expanded from ranges (for API compatibility)
CREATE OR REPLACE FUNCTION get_user_verses_expanded(
    p_user_id INTEGER,
    p_include_apocrypha BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    verse_id VARCHAR,
    book_code CHAR(3),
    chapter_number SMALLINT,
    verse_number SMALLINT,
    is_apocryphal BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    WITH expanded_verses AS (
        SELECT 
            uvr.user_id,
            b.book_code,
            ch.chapter_num,
            v.verse_num,
            uvr.created_at,
            uvr.updated_at,
            b.book_id
        FROM user_verse_ranges uvr
        JOIN books b ON b.book_id = uvr.book_id
        CROSS JOIN LATERAL (
            SELECT generate_series(uvr.chapter_start, uvr.chapter_end) AS chapter_num
        ) ch
        CROSS JOIN LATERAL (
            SELECT generate_series(
                CASE WHEN ch.chapter_num = uvr.chapter_start THEN uvr.verse_start ELSE 1 END,
                CASE WHEN ch.chapter_num = uvr.chapter_end THEN uvr.verse_end 
                     ELSE (SELECT verse_count FROM chapter_verse_counts 
                           WHERE book_id = uvr.book_id AND chapter_number = ch.chapter_num) 
                END
            ) AS verse_num
        ) v
        WHERE uvr.user_id = p_user_id
    )
    SELECT 
        CONCAT(ev.book_code, '-', ev.chapter_num, '-', ev.verse_num)::VARCHAR as verse_id,
        ev.book_code,
        ev.chapter_num::SMALLINT,
        ev.verse_num::SMALLINT,
        COALESCE(
            EXISTS(
                SELECT 1 FROM apocryphal_content ac
                WHERE ac.book_id = ev.book_id 
                AND ac.chapter_number = ev.chapter_num
                AND (ac.verse_start IS NULL OR 
                     (ev.verse_num >= ac.verse_start AND ev.verse_num <= ac.verse_end))
            ),
            FALSE
        ) as is_apocryphal,
        ev.created_at,
        ev.updated_at
    FROM expanded_verses ev
    WHERE p_include_apocrypha OR NOT EXISTS(
        SELECT 1 FROM apocryphal_content ac
        WHERE ac.book_id = ev.book_id 
        AND ac.chapter_number = ev.chapter_num
        AND (ac.verse_start IS NULL OR 
             (ev.verse_num >= ac.verse_start AND ev.verse_num <= ac.verse_end))
    );
END;
$$ LANGUAGE plpgsql;

-- Delete single verse (handles range splitting)
CREATE OR REPLACE FUNCTION delete_memorized_verse(
    p_user_id INTEGER,
    p_book_id SMALLINT,
    p_chapter SMALLINT,
    p_verse SMALLINT
) RETURNS VOID AS $$
DECLARE
    v_range RECORD;
BEGIN
    -- Find range containing this verse
    SELECT * INTO v_range
    FROM user_verse_ranges
    WHERE user_id = p_user_id 
    AND book_id = p_book_id
    AND ((chapter_start < p_chapter) OR 
         (chapter_start = p_chapter AND verse_start <= p_verse))
    AND ((chapter_end > p_chapter) OR 
         (chapter_end = p_chapter AND verse_end >= p_verse));
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Handle different cases
    IF v_range.chapter_start = p_chapter AND v_range.chapter_end = p_chapter THEN
        -- Single chapter range
        IF v_range.verse_start = p_verse AND v_range.verse_end = p_verse THEN
            -- Single verse, delete the range
            DELETE FROM user_verse_ranges WHERE range_id = v_range.range_id;
        ELSIF v_range.verse_start = p_verse THEN
            -- First verse, adjust start
            UPDATE user_verse_ranges 
            SET verse_start = p_verse + 1 
            WHERE range_id = v_range.range_id;
        ELSIF v_range.verse_end = p_verse THEN
            -- Last verse, adjust end
            UPDATE user_verse_ranges 
            SET verse_end = p_verse - 1 
            WHERE range_id = v_range.range_id;
        ELSE
            -- Middle verse, split range
            UPDATE user_verse_ranges 
            SET verse_end = p_verse - 1 
            WHERE range_id = v_range.range_id;
            
            INSERT INTO user_verse_ranges (user_id, book_id, chapter_start, verse_start, chapter_end, verse_end)
            VALUES (p_user_id, p_book_id, p_chapter, p_verse + 1, p_chapter, v_range.verse_end);
        END IF;
    ELSE
        -- Multi-chapter range - more complex splitting logic needed
        -- This is simplified - you'd need more sophisticated logic for all cases
        NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;