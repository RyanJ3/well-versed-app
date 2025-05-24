#!/bin/bash
# start_dev.sh - Development startup (DB in Docker, apps local)

echo "Starting Well Versed in dev mode..."

# 1. Start only database
echo "Starting database..."
docker compose down
docker compose up -d db

# 2. Wait for database
echo "Waiting for database..."
sleep 5
until docker compose exec -T db pg_isready -U postgres || pg_isready -h localhost -p 5432 -q; do
    sleep 2
done

# 3. Setup database
echo "Setting up database..."
cd sql_setup
python3 setup_database.py
cd ..

echo ""
echo "Database ready! Now run:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && source venv/bin/activate && python3 main.py"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && ng serve --proxy-config proxy.conf.local.json"