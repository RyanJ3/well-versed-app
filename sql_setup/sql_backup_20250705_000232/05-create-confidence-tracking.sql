-- =====================================================
-- 05-create-confidence-tracking.sql
-- Track user confidence/mastery of verses
-- =====================================================
SET search_path TO wellversed01DEV;

-- Confidence tracking table
CREATE TABLE user_verse_confidence (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    last_reviewed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    review_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);

-- Indexes
CREATE INDEX idx_confidence_user ON user_verse_confidence(user_id);
CREATE INDEX idx_confidence_last_reviewed ON user_verse_confidence(last_reviewed);
CREATE INDEX idx_confidence_score ON user_verse_confidence(confidence_score);

-- Update trigger
CREATE TRIGGER update_confidence_updated_at BEFORE UPDATE ON user_verse_confidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
