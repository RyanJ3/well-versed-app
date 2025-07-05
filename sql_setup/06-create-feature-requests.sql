-- =====================================================
-- 06-create-feature-requests.sql
-- User feedback and feature request system
-- =====================================================
SET search_path TO wellversed01DEV;

-- Main feature requests table
CREATE TABLE IF NOT EXISTS feature_requests (
    request_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(20),
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Voting system
CREATE TABLE IF NOT EXISTS feature_request_votes (
    request_id INTEGER REFERENCES feature_requests(request_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    vote_type VARCHAR(4) NOT NULL CHECK (vote_type IN ('up','down')),
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (request_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS feature_request_comments (
    comment_id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES feature_requests(request_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags
CREATE TABLE IF NOT EXISTS feature_request_tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Request-tag mapping
CREATE TABLE IF NOT EXISTS feature_request_tag_map (
    request_id INTEGER REFERENCES feature_requests(request_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES feature_request_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (request_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_requests_user ON feature_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_type ON feature_requests(type);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_request ON feature_request_votes(request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_user ON feature_request_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_request ON feature_request_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_user ON feature_request_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_tag_map_request ON feature_request_tag_map(request_id);

-- Triggers
DROP TRIGGER IF EXISTS update_feature_requests_updated_at ON feature_requests;
CREATE TRIGGER update_feature_requests_updated_at 
    BEFORE UPDATE ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
