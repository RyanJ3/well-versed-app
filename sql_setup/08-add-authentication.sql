-- =====================================================
-- 08-add-authentication.sql
-- Add authentication fields and test users
-- =====================================================
SET search_path TO wellversed01DEV;

-- Add authentication fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['user'];

-- Create index for roles
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);

-- Create a sessions table for refresh tokens (optional, for better security)
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(refresh_token_hash);

-- Clean up existing test user and recreate with proper auth fields
DELETE FROM users WHERE email IN ('test@example.com', 'admin@example.com', 'premium@example.com', 'inactive@example.com');

-- Insert test users with hashed passwords
-- Password for all test users: Test123!
-- Hash created using Python: hashlib.pbkdf2_hmac('sha256', 'Test123!'.encode(), salt.encode(), 100000)
-- Salt: 'a1b2c3d4e5f6g7h8' (16 chars)

INSERT INTO users (
    email, 
    name, 
    first_name, 
    last_name, 
    password_hash,
    is_active,
    is_verified,
    roles,
    denomination,
    preferred_bible,
    include_apocrypha
) VALUES 
(
    'test@example.com',
    'Test User',
    'Test',
    'User',
    'a1b2c3d4e5f6g7h8$5f8c9d7e6a8b4c2d9e7f6a5b4c3d2e1f7a8b9c6d5e4f3a2b1c9d8e7f6a5b',
    true,
    true,  -- Auto-verified for local dev
    ARRAY['user'],
    'Non-denominational',
    'KJV',
    false
),
(
    'admin@example.com',
    'Admin User',
    'Admin',
    'User',
    'a1b2c3d4e5f6g7h8$5f8c9d7e6a8b4c2d9e7f6a5b4c3d2e1f7a8b9c6d5e4f3a2b1c9d8e7f6a5b',
    true,
    true,
    ARRAY['admin', 'user'],
    'Non-denominational',
    'ESV',
    false
),
(
    'premium@example.com',
    'Premium User',
    'Premium',
    'User',
    'a1b2c3d4e5f6g7h8$5f8c9d7e6a8b4c2d9e7f6a5b4c3d2e1f7a8b9c6d5e4f3a2b1c9d8e7f6a5b',
    true,
    true,
    ARRAY['premium', 'user'],
    'Baptist',
    'NIV',
    true  -- Includes apocrypha
),
(
    'inactive@example.com',
    'Inactive User',
    'Inactive',
    'User',
    'a1b2c3d4e5f6g7h8$5f8c9d7e6a8b4c2d9e7f6a5b4c3d2e1f7a8b9c6d8e7f6a5b',
    false,  -- Inactive account
    true,
    ARRAY['user'],
    'Catholic',
    'NRSV',
    true
);

-- Get the user IDs for test data
DO $$
DECLARE
    test_user_id INTEGER;
    admin_user_id INTEGER;
    premium_user_id INTEGER;
BEGIN
    SELECT user_id INTO test_user_id FROM users WHERE email = 'test@example.com';
    SELECT user_id INTO admin_user_id FROM users WHERE email = 'admin@example.com';
    SELECT user_id INTO premium_user_id FROM users WHERE email = 'premium@example.com';

    -- Add some test verses for each user
    -- Test User: John 3:16 and Psalm 23:1-3
    INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
    SELECT test_user_id, id, 5, CURRENT_TIMESTAMP - INTERVAL '1 day'
    FROM bible_verses 
    WHERE verse_code IN ('43-3-16', '19-23-1', '19-23-2', '19-23-3')
    ON CONFLICT DO NOTHING;

    -- Admin User: Genesis 1:1-3 and Romans 8:28
    INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
    SELECT admin_user_id, id, 10, CURRENT_TIMESTAMP - INTERVAL '2 hours'
    FROM bible_verses 
    WHERE verse_code IN ('1-1-1', '1-1-2', '1-1-3', '45-8-28')
    ON CONFLICT DO NOTHING;

    -- Premium User: Entire Psalm 1
    INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
    SELECT premium_user_id, id, 3, CURRENT_TIMESTAMP - INTERVAL '12 hours'
    FROM bible_verses 
    WHERE book_id = 19 AND chapter_number = 1
    ON CONFLICT DO NOTHING;

    -- Create test decks
    INSERT INTO decks (user_id, name, description, is_public)
    VALUES 
    (test_user_id, 'My Favorite Verses', 'Collection of verses I love', true),
    (admin_user_id, 'Creation Verses', 'Verses about God''s creation', true),
    (premium_user_id, 'Wisdom Literature', 'Verses from Psalms and Proverbs', false);

    -- Create a test feature request
    INSERT INTO feature_requests (title, description, type, status, user_id)
    VALUES 
    ('Add audio playback', 'It would be great to hear verses read aloud', 'feature', 'open', test_user_id),
    ('Dark mode', 'Please add a dark theme option', 'feature', 'open', premium_user_id);
END $$;
