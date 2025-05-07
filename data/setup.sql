-- Create database (run this as postgres superuser)
CREATE DATABASE well_versed;

-- Connect to the database (run separately or use \c well_versed in psql)
-- \c well_versed

-- Create application roles
CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password_here';
CREATE ROLE data_editor_limited;

-- Grant only SELECT, INSERT, UPDATE on tables
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO data_editor_limited;

-- Ensure the same permissions are applied to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE ON TABLES TO data_editor_limited;

-- Grant role to user
GRANT data_editor_limited TO app_user;

-- Create users table
CREATE TABLE public.users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Create user settings table
CREATE TABLE public.user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
    denomination VARCHAR(50),
    include_apocrypha BOOLEAN DEFAULT FALSE
);

-- Create verses table
CREATE TABLE public.verses (
    verse_id VARCHAR(12) PRIMARY KEY,
    verse_number INTEGER NOT NULL
);

-- Create user verses table (junction table)
CREATE TABLE public.user_verses (
    user_id INTEGER REFERENCES public.users(user_id) ON DELETE CASCADE,
    verse_id VARCHAR(12) REFERENCES public.verses(verse_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    PRIMARY KEY (user_id, verse_id),
);

-- Create indexes for performance
CREATE INDEX idx_verses_verse_id ON public.verses(verse_id);
CREATE INDEX idx_user_verses_user_id ON public.user_verses(user_id);
CREATE INDEX idx_user_verses_verse_id ON public.user_verses(verse_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);

-- Sample data - Insert test user (password is 'testpass' - in production use properly hashed passwords)
INSERT INTO public.users (username, email, password_hash, first_name, last_name)
VALUES ('testuser', 'test@example.com', 'testpass', 'Test', 'User');

-- Insert user settings for test user
INSERT INTO public.user_settings (user_id, denomination, include_apocrypha)
VALUES (1, 'Non-denominational', FALSE);

-- Insert sample verses (just a few examples)
INSERT INTO public.verses (verse_id, verse_number)
VALUES 
('GEN-1-1', 1),
('GEN-1-2', 2),
('PSA-23-1', 1),
('JHN-3-16', 16),
('ROM-8-28', 28);

-- Insert sample user verses (memorization progress)
INSERT INTO public.user_verses (user_id, verse_id)
VALUES 
(1, 'JHN-3-16'),
(1, 'PSA-23-1'),
(1, 'ROM-8-28');

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO data_editor_limited;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO data_editor_limited;