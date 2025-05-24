-- /data/07_create_triggers.sql
-- Trigger functions and triggers

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

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
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