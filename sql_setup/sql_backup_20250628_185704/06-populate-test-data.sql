-- =====================================================
-- 06-populate-test-data.sql
-- Insert test data (run after all tables created)
-- =====================================================
SET search_path TO wellversed01DEV;

-- Create test decks
INSERT INTO decks (user_id, name, description, is_public) VALUES 
(1, 'Psalms of Praise', 'Popular psalms for memorization', true),
(1, 'Gospel Essentials', 'Key verses from the Gospels', true),
(1, 'Romans Road', 'Salvation verses from Romans', false)
ON CONFLICT DO NOTHING;

-- Add sample saved deck
INSERT INTO saved_decks (user_id, deck_id)
SELECT 1, deck_id FROM decks WHERE name = 'Psalms of Praise' AND is_public = true
ON CONFLICT DO NOTHING;
