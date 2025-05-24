#!/bin/bash
# start_all.sh - Complete startup script

echo "Starting Well Versed..."

# 1. Clean up any existing containers/volumes
echo "Cleaning up old containers..."
docker compose down -v --remove-orphans

# 2. Start all services with docker compose
echo "Starting services..."
docker compose up -d

# 3. Wait for database to be ready
echo "Waiting for database..."
sleep 10
until docker compose exec -T db pg_isready -U postgres; do
    sleep 2
done

# 4. Setup database
echo "Setting up database..."
cd sql_setup
python3 setup_database.py
cd ..

echo ""
echo "All services started!"
echo "Frontend: http://localhost:4200"
echo "Backend: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"