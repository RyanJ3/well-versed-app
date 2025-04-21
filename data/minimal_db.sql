-- This script creates a minimal database for the WellVersed app.

-- get the roles for this database
SELECT rolname FROM pg_roles
WHERE rolname NOT IN ('postgres', 'admin')
  AND rolcanlogin;

-- Create the role
CREATE ROLE data_editor_limited;

-- Grant only SELECT, INSERT, UPDATE on tables
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO data_editor_limited;

-- Ensure the same permissions are applied to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE ON TABLES TO data_editor_limited;

-- replace "testuser" and "testpass" with actual values
CREATE USER testuser WITH PASSWORD 'testpass';

-- Table: public.users
CREATE TABLE public.users (
    user_id serial4 NOT NULL,
    username varchar(50) NOT NULL,
    email varchar(100) NOT NULL,
    password_hash varchar(255) NOT NULL,
    first_name varchar(50) NULL,
    last_name varchar(50) NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
    last_login timestamp NULL,
    active bool DEFAULT true NULL,
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_username_key UNIQUE (username)
);

-- Table: public.user_settings
CREATE TABLE public.user_settings (
    setting_id serial4 NOT NULL,
    user_id int4 NOT NULL,
    denomination varchar(50) NULL,
    include_apocrypha bool DEFAULT false NULL,
    CONSTRAINT user_settings_pkey PRIMARY KEY (setting_id),
    CONSTRAINT user_settings_user_id_key UNIQUE (user_id),
    CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE
);

-- Table: public.verses
CREATE TABLE public.verses (
    verse_id varchar(12) NOT NULL,
    verse_number int4 NOT NULL,
    CONSTRAINT verses_pkey PRIMARY KEY (verse_id)
);

-- Table: public.user_verses
CREATE TABLE public.user_verses (
    user_id int4 NOT NULL,
    verse_id varchar(12) NOT NULL,
    confidence int4 DEFAULT 1 NOT NULL CHECK (confidence BETWEEN 1 AND 1000), -- Numeric progress level 1-1000
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp,
    CONSTRAINT user_verses_pkey PRIMARY KEY (user_id, verse_id),
    CONSTRAINT user_verses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
    CONSTRAINT user_verses_verse_id_fkey FOREIGN KEY (verse_id) REFERENCES public.verses(verse_id) ON DELETE CASCADE
);
