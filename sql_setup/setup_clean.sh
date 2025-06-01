#!/bin/bash
# setup_clean.sh - Clean setup script for Well Versed database

# Load environment variables
if [ -f "../backend/.env" ]; then
    export $(grep -v '^#' ../backend/.env | xargs)
else
    echo "Error: backend/.env not found"
    exit 1
fi

echo "Setting up Well Versed database..."
echo "Database: $DATABASE_NAME on $DATABASE_HOST:$DATABASE_PORT"

# Use Python setup script with appropriate flags
if [ "$1" == "--drop" ]; then
    echo "WARNING: This will DROP the existing schema!"
    python3 setup_database.py --drop
else
    python3 setup_database.py
fi
