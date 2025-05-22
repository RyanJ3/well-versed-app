#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Well Versed Development Setup ===${NC}"

# Database configuration
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="wellversed01DEV"

# Export for backend
export DATABASE_HOST=$DB_HOST
export DATABASE_PORT=$DB_PORT
export DATABASE_USER=$DB_USER
export DATABASE_PASSWORD=$DB_PASSWORD
export DATABASE_NAME=$DB_NAME

echo -e "${YELLOW}Step 1: Stopping existing containers...${NC}"
docker-compose down

echo -e "${YELLOW}Step 2: Starting PostgreSQL container...${NC}"
docker run -d \
  --name wellversed-postgres \
  -e POSTGRES_USER=$DB_USER \
  -e POSTGRES_PASSWORD=$DB_PASSWORD \
  -e POSTGRES_DB=postgres \
  -p $DB_PORT:5432 \
  postgres:16-alpine

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

echo -e "${YELLOW}Step 3: Creating database and schema...${NC}"

# Create the SQL setup script
cat > /tmp/wellversed_setup.sql << 'EOF'
-- Drop database if exists and recreate
DROP DATABASE IF EXISTS wellversed01DEV;
CREATE DATABASE wellversed01DEV;

-- Connect to the new database
\c wellversed01DEV

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    denomination VARCHAR(50),
    include_apocrypha BOOLEAN DEFAULT FALSE,
    preferred_bible VARCHAR(50) DEFAULT 'ESV'
);

-- Create verses table with is_apocryphal field
CREATE TABLE IF NOT EXISTS verses (
    verse_id VARCHAR(12) PRIMARY KEY,
    verse_number INTEGER NOT NULL,
    is_apocryphal BOOLEAN DEFAULT FALSE
);

-- Create user verses table with practice tracking
CREATE TABLE IF NOT EXISTS user_verses (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id VARCHAR(12) REFERENCES verses(verse_id) ON DELETE CASCADE,
    practice_count INTEGER DEFAULT 0,
    last_practiced TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);

-- Create indexes for performance
CREATE INDEX idx_verses_verse_id ON verses(verse_id);
CREATE INDEX idx_user_verses_user_id ON user_verses(user_id);
CREATE INDEX idx_user_verses_verse_id ON user_verses(verse_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Insert test user
INSERT INTO users (username, email, password_hash, first_name, last_name)
VALUES ('testuser', 'test@example.com', 'test_hash', 'Test', 'User')
ON CONFLICT (username) DO NOTHING;

-- Insert user settings for test user
INSERT INTO user_settings (user_id, denomination, include_apocrypha, preferred_bible)
VALUES (1, 'Non-denominational', FALSE, 'ESV')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample verses with apocryphal status
INSERT INTO verses (verse_id, verse_number, is_apocryphal) VALUES 
('GEN-1-1', 1, FALSE),
('GEN-1-2', 2, FALSE),
('PSA-23-1', 1, FALSE),
('PSA-151-1', 1, TRUE),  -- Psalm 151 is apocryphal
('JHN-3-16', 16, FALSE),
('ROM-8-28', 28, FALSE),
('DAN-3-24', 24, FALSE),
('DAN-3-25', 25, TRUE),  -- Additions to Daniel are apocryphal
('SIR-1-1', 1, TRUE)    -- Sirach is apocryphal
ON CONFLICT (verse_id) DO NOTHING;

-- Grant permissions (if needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Display setup summary
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as verse_count FROM verses;
SELECT COUNT(*) as apocryphal_verse_count FROM verses WHERE is_apocryphal = TRUE;
EOF

# Execute the SQL script
docker exec -i wellversed-postgres psql -U $DB_USER < /tmp/wellversed_setup.sql

echo -e "${YELLOW}Step 4: Creating backend .env file...${NC}"
cat > backend/.env << EOF
DATABASE_HOST=$DB_HOST
DATABASE_PORT=$DB_PORT
DATABASE_USER=$DB_USER
DATABASE_PASSWORD=$DB_PASSWORD
DATABASE_NAME=$DB_NAME
EOF

echo -e "${YELLOW}Step 5: Starting backend...${NC}"
cd backend
python -m venv venv 2>/dev/null || python3 -m venv venv
source venv/bin/activate || source venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo -e "${YELLOW}Step 6: Starting frontend...${NC}"
cd frontend
npm install
npm run serve &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo -e "Frontend: ${GREEN}http://localhost:4200${NC}"
echo -e "Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "Database: ${GREEN}localhost:5432/wellversed01DEV${NC}"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC}"
echo "kill $BACKEND_PID $FRONTEND_PID && docker stop wellversed-postgres"
echo ""
echo -e "${YELLOW}To connect to database:${NC}"
echo "docker exec -it wellversed-postgres psql -U postgres -d wellversed01DEV"

# Keep script running
wait