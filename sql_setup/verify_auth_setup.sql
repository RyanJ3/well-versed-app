-- verify_auth_setup.sql
SET search_path TO wellversed01DEV;

-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'wellversed01dev' 
AND table_name = 'users'
AND column_name IN ('password_hash', 'is_active', 'is_verified', 'roles', 'last_login', 'failed_login_attempts', 'locked_until')
ORDER BY ordinal_position;

-- Check test users
SELECT email, name, is_active, is_verified, roles, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'No Password' END as password_status
FROM users
WHERE email IN ('test@example.com', 'admin@example.com', 'premium@example.com', 'inactive@example.com')
ORDER BY email;

-- Check user_sessions table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'wellversed01dev' 
    AND table_name = 'user_sessions'
) as sessions_table_exists;

-- Check test data
SELECT u.email, COUNT(uv.verse_id) as verse_count
FROM users u
LEFT JOIN user_verses uv ON u.user_id = uv.user_id
WHERE u.email IN ('test@example.com', 'admin@example.com', 'premium@example.com')
GROUP BY u.email
ORDER BY u.email;
