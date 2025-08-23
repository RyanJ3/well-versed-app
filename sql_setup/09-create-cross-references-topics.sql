-- =====================================================
-- 09-create-cross-references-topics.sql
-- Add cross-references and topics support for OpenBible data
-- =====================================================
SET search_path TO wellversed01DEV;

-- Topics table (hierarchical support for future expansion)
CREATE TABLE IF NOT EXISTS topics (
    topic_id SERIAL PRIMARY KEY,
    topic_name VARCHAR(100) UNIQUE NOT NULL,
    parent_topic_id INT REFERENCES topics(topic_id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Verse-to-topic mappings with voting/confidence
CREATE TABLE IF NOT EXISTS verse_topics (
    id SERIAL PRIMARY KEY,
    verse_id INT NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    topic_id INT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    votes INT DEFAULT 0,
    confidence_score FLOAT DEFAULT 0.0, -- Normalized 0-1
    source VARCHAR(50) DEFAULT 'OpenBible',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(verse_id, topic_id)
);

-- Cross-references between verses
CREATE TABLE IF NOT EXISTS cross_references (
    id SERIAL PRIMARY KEY,
    from_verse_id INT NOT NULL REFERENCES bible_verses(id),
    to_verse_id INT NOT NULL REFERENCES bible_verses(id),
    reference_type VARCHAR(50) DEFAULT 'related', -- quote, allusion, parallel, prophecy, etc.
    votes INT DEFAULT 0,
    confidence_score FLOAT DEFAULT 0.0, -- Normalized 0-1
    source VARCHAR(50) DEFAULT 'TSK', -- Treasury of Scripture Knowledge
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_verse_id, to_verse_id),
    CHECK(from_verse_id != to_verse_id)
);

-- Indexes for performance
CREATE INDEX idx_verse_topics_verse ON verse_topics(verse_id);
CREATE INDEX idx_verse_topics_topic ON verse_topics(topic_id);
CREATE INDEX idx_verse_topics_confidence ON verse_topics(confidence_score DESC);
CREATE INDEX idx_cross_references_from ON cross_references(from_verse_id);
CREATE INDEX idx_cross_references_to ON cross_references(to_verse_id);
CREATE INDEX idx_cross_references_confidence ON cross_references(confidence_score DESC);

-- Helper function to convert OSIS format (e.g., Gen.1.1) to verse_id
CREATE OR REPLACE FUNCTION get_verse_id_from_osis(osis_ref VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    book_abbrev VARCHAR;
    chapter_num INT;
    verse_num INT;
    book_id_result INT;
    verse_id_result INT;
    parts TEXT[];
BEGIN
    -- Parse OSIS format (e.g., Gen.1.1, 1Sam.2.3)
    parts := string_to_array(osis_ref, '.');
    
    IF array_length(parts, 1) != 3 THEN
        RETURN NULL;
    END IF;
    
    book_abbrev := parts[1];
    chapter_num := parts[2]::INT;
    verse_num := parts[3]::INT;
    
    -- Map OSIS book abbreviation to book_id
    book_id_result := CASE book_abbrev
        -- Old Testament
        WHEN 'Gen' THEN 1
        WHEN 'Exod' THEN 2
        WHEN 'Lev' THEN 3
        WHEN 'Num' THEN 4
        WHEN 'Deut' THEN 5
        WHEN 'Josh' THEN 6
        WHEN 'Judg' THEN 7
        WHEN 'Ruth' THEN 8
        WHEN '1Sam' THEN 9
        WHEN '2Sam' THEN 10
        WHEN '1Kgs' THEN 11
        WHEN '2Kgs' THEN 12
        WHEN '1Chr' THEN 13
        WHEN '2Chr' THEN 14
        WHEN 'Ezra' THEN 15
        WHEN 'Neh' THEN 16
        WHEN 'Esth' THEN 17
        WHEN 'Job' THEN 18
        WHEN 'Ps' THEN 19
        WHEN 'Prov' THEN 20
        WHEN 'Eccl' THEN 21
        WHEN 'Song' THEN 22
        WHEN 'Isa' THEN 23
        WHEN 'Jer' THEN 24
        WHEN 'Lam' THEN 25
        WHEN 'Ezek' THEN 26
        WHEN 'Dan' THEN 27
        WHEN 'Hos' THEN 28
        WHEN 'Joel' THEN 29
        WHEN 'Amos' THEN 30
        WHEN 'Obad' THEN 31
        WHEN 'Jonah' THEN 32
        WHEN 'Mic' THEN 33
        WHEN 'Nah' THEN 34
        WHEN 'Hab' THEN 35
        WHEN 'Zeph' THEN 36
        WHEN 'Hag' THEN 37
        WHEN 'Zech' THEN 38
        WHEN 'Mal' THEN 39
        -- New Testament
        WHEN 'Matt' THEN 40
        WHEN 'Mark' THEN 41
        WHEN 'Luke' THEN 42
        WHEN 'John' THEN 43
        WHEN 'Acts' THEN 44
        WHEN 'Rom' THEN 45
        WHEN '1Cor' THEN 46
        WHEN '2Cor' THEN 47
        WHEN 'Gal' THEN 48
        WHEN 'Eph' THEN 49
        WHEN 'Phil' THEN 50
        WHEN 'Col' THEN 51
        WHEN '1Thess' THEN 52
        WHEN '2Thess' THEN 53
        WHEN '1Tim' THEN 54
        WHEN '2Tim' THEN 55
        WHEN 'Titus' THEN 56
        WHEN 'Phlm' THEN 57
        WHEN 'Heb' THEN 58
        WHEN 'Jas' THEN 59
        WHEN '1Pet' THEN 60
        WHEN '2Pet' THEN 61
        WHEN '1John' THEN 62
        WHEN '2John' THEN 63
        WHEN '3John' THEN 64
        WHEN 'Jude' THEN 65
        WHEN 'Rev' THEN 66
        ELSE NULL
    END;
    
    IF book_id_result IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Find the verse_id in your system
    SELECT id INTO verse_id_result
    FROM bible_verses bv
    WHERE bv.book_id = book_id_result
    AND bv.chapter_number = chapter_num
    AND bv.verse_number = verse_num;
    
    RETURN verse_id_result;
END;
$$ LANGUAGE plpgsql;

-- Function to handle OSIS verse ranges (e.g., Gen.1.1-Gen.1.5)
CREATE OR REPLACE FUNCTION get_osis_verse_range(
    osis_range VARCHAR
)
RETURNS TABLE(verse_id INT) AS $$
DECLARE
    range_parts TEXT[];
    start_ref VARCHAR;
    end_ref VARCHAR;
    start_id INT;
    end_id INT;
BEGIN
    -- Check if it's a range or single verse
    IF position('-' in osis_range) > 0 THEN
        -- It's a range
        range_parts := string_to_array(osis_range, '-');
        start_ref := range_parts[1];
        end_ref := range_parts[2];
        
        -- Get start and end verse IDs
        start_id := get_verse_id_from_osis(start_ref);
        end_id := get_verse_id_from_osis(end_ref);
        
        IF start_id IS NULL OR end_id IS NULL THEN
            RETURN;
        END IF;
        
        -- Return all verses in the range
        RETURN QUERY
        SELECT bv.id 
        FROM bible_verses bv
        WHERE bv.id >= start_id AND bv.id <= end_id
        ORDER BY bv.id;
    ELSE
        -- Single verse
        RETURN QUERY
        SELECT get_verse_id_from_osis(osis_range);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Query helpers for application use
CREATE OR REPLACE FUNCTION get_verse_topics(verse_id_param INT)
RETURNS TABLE(
    topic_name VARCHAR,
    confidence_score FLOAT,
    votes INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.topic_name, vt.confidence_score, vt.votes
    FROM verse_topics vt
    JOIN topics t ON vt.topic_id = t.topic_id
    WHERE vt.verse_id = verse_id_param
    ORDER BY vt.confidence_score DESC, vt.votes DESC;
END;
$$ LANGUAGE plpgsql;

-- Get cross-references for a verse
CREATE OR REPLACE FUNCTION get_verse_cross_references(verse_id_param INT)
RETURNS TABLE(
    reference TEXT,
    book_name VARCHAR,
    chapter INT,
    verse INT,
    confidence_score FLOAT,
    direction VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    -- Verses this verse references
    SELECT 
        bb.book_name || ' ' || bv.chapter_number || ':' || bv.verse_number as reference,
        bb.book_name,
        bv.chapter_number,
        bv.verse_number,
        cr.confidence_score,
        'from'::VARCHAR as direction
    FROM cross_references cr
    JOIN bible_verses bv ON cr.to_verse_id = bv.id
    JOIN bible_books bb ON bv.book_id = bb.book_id
    WHERE cr.from_verse_id = verse_id_param
    
    UNION ALL
    
    -- Verses that reference this verse
    SELECT 
        bb.book_name || ' ' || bv.chapter_number || ':' || bv.verse_number as reference,
        bb.book_name,
        bv.chapter_number,
        bv.verse_number,
        cr.confidence_score,
        'to'::VARCHAR as direction
    FROM cross_references cr
    JOIN bible_verses bv ON cr.from_verse_id = bv.id
    JOIN bible_books bb ON bv.book_id = bb.book_id
    WHERE cr.to_verse_id = verse_id_param
    
    ORDER BY confidence_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Permissions are automatically granted to schema owner
-- No explicit GRANT statements needed