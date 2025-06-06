-- 10-create-workflow-ratings.sql
-- Table for storing user ratings on workflows
SET search_path TO wellversed01DEV;

CREATE TABLE workflow_ratings (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    workflow_id INTEGER NOT NULL REFERENCES workflows(workflow_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, workflow_id)
);

CREATE INDEX idx_workflow_ratings_workflow ON workflow_ratings(workflow_id);
CREATE INDEX idx_workflow_ratings_user ON workflow_ratings(user_id);

