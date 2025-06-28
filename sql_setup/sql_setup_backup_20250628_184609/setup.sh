#!/bin/bash
# setup.sh - Quick setup script for Well Versed

echo "Setting up Well Versed..."

# Load environment variables from backend/.env
if [ -f "../backend/.env" ]; then
    export $(grep -v '^#' ../backend/.env | xargs)
else
    echo "Error: backend/.env not found"
    exit 1
fi

# Check if PostgreSQL is running
if pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -q 2>/dev/null || docker compose exec -T db pg_isready -U $DATABASE_USER 2>/dev/null; then
    echo "PostgreSQL is running"
else
    echo "PostgreSQL is not running. Starting with Docker..."
    docker compose up -d db
    sleep 5
fi

# Create database
echo "Creating database..."
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER -c "CREATE DATABASE $DATABASE_NAME;" 2>/dev/null || echo "Database already exists"

# Run database setup
echo "Setting up database..."
if [ -d "sql_setup" ]; then
    cd sql_setup
    python3 setup_database.py
    cd ..
else
    python3 setup_database.py
fi

# Setup backend
echo "Setting up backend..."
cd ../backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "Installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt

# Copy .env if needed
cp .env.example .env 2>/dev/null || echo ".env already exists"

cd ..

echo ""
echo "Setup complete! To start the API:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python3 main.py"
