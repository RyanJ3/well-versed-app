-- /data/07_create_triggers.sql
-- Trigger functions and triggers

-- Update save count when decks are saved/unsaved
CREATE OR REPLACE FUNCTION update_deck_save_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE decks SET save_count = save_count + 1 WHERE deck_id = NEW.deck_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE decks SET save_count = save_count - 1 WHERE deck_id = OLD.deck_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to parse verse_id
CREATE OR REPLACE FUNCTION parse_verse_id(verse_id_str VARCHAR)
RETURNS TABLE(book_code VARCHAR, chapter_num INTEGER, verse_num INTEGER) AS $$
DECLARE
    parts TEXT[];
BEGIN
    parts := string_to_array(verse_id_str, '-');
    IF array_length(parts, 1) = 3 THEN
        RETURN QUERY SELECT 
            parts[1]::VARCHAR,
            parts[2]::INTEGER,
            parts[3]::INTEGER;
    ELSE
        RAISE EXCEPTION 'Invalid verse_id format: %', verse_id_str;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_deck_saves
AFTER INSERT OR DELETE ON saved_decks
FOR EACH ROW EXECUTE FUNCTION update_deck_save_count();

CREATE TRIGGER update_user_verses_timestamp
BEFORE UPDATE ON user_verses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_decks_timestamp
BEFORE UPDATE ON decks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_timestamp
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();