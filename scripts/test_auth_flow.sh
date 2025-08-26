#!/bin/bash

# Source environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Use environment variable or fallback
TEST_PASSWORD="${LOCAL_TEST_PASSWORD:-ChangeMe123!}"

echo "Testing Authentication Flow"
echo "============================"

# Test backend health
echo "1. Backend Health Check:"
curl -s http://localhost:8000/api/health | python3 -m json.tool | head -5

# Test auth health
echo -e "\n2. Auth Health Check:"
curl -s http://localhost:8000/api/auth/health | python3 -m json.tool

# Test login endpoint with mock credentials
echo -e "\n3. Testing Login (local mode - any credentials work):"
response=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"test@example.com\", \"password\": \"${TEST_PASSWORD}\"}")

if echo "$response" | grep -q "access_token"; then
    echo "✅ Login successful!"
    echo "$response" | python3 -m json.tool | head -10
else
    echo "❌ Login failed"
    echo "$response"
fi

echo -e "\n============================"
echo "To test in browser:"
echo "1. Open http://localhost:4200"
echo "2. You should be redirected to /login"
echo "3. Use any email/password (local mode)"
echo "4. Or click 'Use test account' button"
echo "5. After login, click user menu -> Sign Out"
echo "6. You should be redirected back to /login"