#!/bin/bash

# Use environment variables for test credentials
TEST_USER="${LOCAL_TEST_USERS%%,*}"  # Get first user from comma-separated list
TEST_PASS="${LOCAL_TEST_PASSWORD}"

if [ -z "$TEST_USER" ] || [ -z "$TEST_PASS" ]; then
    echo "Error: LOCAL_TEST_USERS and LOCAL_TEST_PASSWORD must be set"
    echo "Run: source .env (or set environment variables)"
    exit 1
fi

# Login and get token
echo "Logging in as $TEST_USER..."
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}" > /tmp/login_response.json

# Extract token
TOKEN=$(python3 -c "import json; print(json.load(open('/tmp/login_response.json'))['access_token'])")

echo "Token obtained: ${TOKEN:0:50}..."

# Test /auth/me
echo "Testing /api/auth/me..."
curl -s -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool