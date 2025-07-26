-- =====================================================
-- 03-create-users.sql
-- User management tables
-- =====================================================
SET search_path TO wellversed01DEV;

-- Main users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    denomination VARCHAR(100),
    preferred_bible VARCHAR(50),
    use_esv_api BOOLEAN DEFAULT FALSE,
    esv_api_token VARCHAR(200),
    include_apocrypha BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default test user
INSERT INTO users (email, password_hash, name, first_name, last_name, include_apocrypha)
VALUES ('test@example.com', 'testsalt1234567890abcd$48ad3ee8fdea554e8ac10838509590f53897a0f604be565cb2c444957772a25a', 'Test User', 'Test', 'User', false)
ON CONFLICT (email) DO NOTHING;

CREATE TABLE api_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'eng';
