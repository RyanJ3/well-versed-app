-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS bible_data_json (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bible_books (
    book_id VARCHAR(4) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    testament VARCHAR(50) NOT NULL,
    book_group VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS bible_verses (
    verse_id VARCHAR(15) PRIMARY KEY,
    book_id VARCHAR(4) REFERENCES bible_books(book_id),
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL
);

-- Function to populate bible data
CREATE OR REPLACE FUNCTION populate_bible_data() RETURNS VOID AS $$
DECLARE
    json_data JSONB;
    book_data JSONB;
    book_rec RECORD;
    chapter_num INTEGER;
    verse_num INTEGER;
    b_id VARCHAR(4);
    v_id VARCHAR(15);
    canonical_status TEXT;
    chapter_count INTEGER;
    verse_count INTEGER;
    processed_books INTEGER := 0;
    processed_verses INTEGER := 0;
BEGIN
    -- Get the latest JSON data from the table
    SELECT data INTO json_data FROM bible_data_json ORDER BY created_at DESC LIMIT 1;

    IF json_data IS NULL THEN
        RAISE EXCEPTION 'No Bible data found in bible_data_json table';
    END IF;

    -- Process each book
    FOR book_rec IN SELECT value FROM jsonb_array_elements(json_data->'books')
    LOOP
        book_data := book_rec.value;
        canonical_status := book_data->>'canonicalAffiliation';

        -- Skip books that aren't canonical
        IF canonical_status = 'NONE' THEN
            CONTINUE;
        END IF;

        -- Extract book ID, handling special cases for numbered books
        b_id := UPPER(SUBSTRING((book_data->>'name') FROM 1 FOR 4));

        IF SUBSTRING(b_id FROM 1 FOR 1) ~ '^[0-9]$' THEN
            b_id := SUBSTRING(b_id FROM 1 FOR 1) || UPPER(SUBSTRING((book_data->>'name') FROM 3 FOR 3));
        END IF;

        -- Insert book record
        INSERT INTO public.bible_books (book_id, name, testament, book_group)
        VALUES (
            b_id,
            book_data->>'name',
            book_data->>'testament',
            book_data->>'bookGroup'
        )
        ON CONFLICT (book_id) DO NOTHING;

        processed_books := processed_books + 1;

        -- Create verses for each chapter
        chapter_count := jsonb_array_length(book_data->'chapters');

        FOR chapter_num IN 1..chapter_count LOOP
            -- Get number of verses in this chapter
            verse_count := (book_data->'chapters'->(chapter_num-1))::INTEGER;

            -- Create each verse in this chapter
            FOR verse_num IN 1..verse_count LOOP
                v_id := b_id || '-' || chapter_num || '-' || verse_num;

                -- Insert verse
                INSERT INTO public.bible_verses (verse_id, book_id, chapter_number, verse_number)
                VALUES (v_id, b_id, chapter_num, verse_num)
                ON CONFLICT (verse_id) DO NOTHING;

                processed_verses := processed_verses + 1;
            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Bible data import complete: % books and % verses processed', processed_books, processed_verses;
END;
$$ LANGUAGE plpgsql;

-- Procedure to import bible JSON
CREATE OR REPLACE PROCEDURE import_bible_json(json_content text) 
LANGUAGE plpgsql AS $$
BEGIN
    -- Insert the JSON data into the bible_data_json table
    INSERT INTO bible_data_json (data, created_at)
    VALUES (json_content::jsonb, NOW());
    
    -- Call the function to populate data
    PERFORM populate_bible_data();
END;
$$;

-- Call the procedure (replace JSON_PLACEHOLDER with actual JSON)
CALL import_bible_json('JSON_PLACEHOLDER');