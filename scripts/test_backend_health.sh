#!/bin/bash

# Source environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Use environment variable or fallback
TEST_PASSWORD="${LOCAL_TEST_PASSWORD:-ChangeMe123!}"

echo "Testing backend health..."

# Test health endpoint
echo "1. Testing /api/health endpoint:"
curl -s http://localhost:8000/api/health | python3 -m json.tool || echo "Failed to connect to backend"

echo ""
echo "2. Testing auth health endpoint:"
curl -s http://localhost:8000/api/auth/health | python3 -m json.tool || echo "Failed to connect to auth endpoint"

echo ""
echo "3. Testing login with mock credentials (local mode):"
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"test@example.com\", \"password\": \"${TEST_PASSWORD}\"}" \
  -s | python3 -m json.tool || echo "Failed to login"