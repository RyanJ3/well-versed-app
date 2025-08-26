#!/bin/bash

echo "Simulating Browser Login Flow"
echo "=============================="

# Clear any previous tokens
rm -f /tmp/browser_*.json 2>/dev/null

# Step 1: Login
echo "1. Logging in..."
curl -s -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d @test_login.json > /tmp/browser_login.json

if grep -q "access_token" /tmp/browser_login.json; then
    echo "✅ Login successful"
    TOKEN=$(python3 -c "import json; print(json.load(open('/tmp/browser_login.json'))['access_token'])")
    echo "   Token: ${TOKEN:0:50}..."
else
    echo "❌ Login failed"
    cat /tmp/browser_login.json
    exit 1
fi

# Step 2: Immediately call /auth/me with the token (simulating what the frontend does)
echo -e "\n2. Fetching user info (like frontend does after login)..."
curl -s -X GET http://localhost:4200/api/auth/me \
  -H "Authorization: Bearer $TOKEN" > /tmp/browser_user.json

if grep -q "user_id" /tmp/browser_user.json; then
    echo "✅ User fetch successful"
    python3 -m json.tool /tmp/browser_user.json | head -8
else
    echo "❌ User fetch failed"
    cat /tmp/browser_user.json
    echo -e "\nHTTP Status:"
    curl -s -o /dev/null -w "%{http_code}\n" -X GET http://localhost:4200/api/auth/me \
      -H "Authorization: Bearer $TOKEN"
fi

echo -e "\n=============================="
echo "Summary: The login flow should work without showing 'Not authenticated'"