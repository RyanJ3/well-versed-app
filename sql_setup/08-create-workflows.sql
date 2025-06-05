-- =====================================================
-- 08-create-workflows.sql
-- Workflow and lesson tables
-- =====================================================
SET search_path TO wellversed01DEV;

-- Main workflows table
CREATE TABLE workflows (
    workflow_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table
CREATE TABLE workflow_lessons (
    lesson_id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(workflow_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    video_url TEXT,
    article_text TEXT,
    article_url TEXT,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_workflows_user ON workflows(user_id);
CREATE INDEX idx_workflows_public ON workflows(is_public);
CREATE INDEX idx_lessons_workflow ON workflow_lessons(workflow_id);
CREATE INDEX idx_lessons_position ON workflow_lessons(workflow_id, position);

-- Trigger for updated_at on workflows
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
