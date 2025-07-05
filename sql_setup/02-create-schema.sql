-- =====================================================
-- 02-create-schema.sql
-- Creates the schema and common functions
-- =====================================================
CREATE SCHEMA IF NOT EXISTS wellversed01DEV;
SET search_path TO wellversed01DEV;

-- Common function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'wellversed01dev' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;
