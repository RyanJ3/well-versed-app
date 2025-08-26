#!/bin/bash

echo "Testing Login Page Loads Without Errors"
echo "========================================"

# Check if login page loads
echo "1. Checking login page loads..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/login)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Login page loads successfully (HTTP $HTTP_STATUS)"
else
    echo "❌ Login page failed to load (HTTP $HTTP_STATUS)"
fi

# Check if any unauthenticated API calls fail
echo -e "\n2. Checking for auth errors on login page..."
# This should return 403 but shouldn't cause UI errors
curl -s http://localhost:4200/api/auth/me 2>&1 | grep -q "Not authenticated"
if [ $? -eq 0 ]; then
    echo "✅ Unauthenticated API calls handled correctly"
else
    echo "⚠️  Unexpected response from unauthenticated API call"
fi

echo -e "\n3. Testing login flow..."
RESPONSE=$(curl -s -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d @test_login.json)

if echo "$RESPONSE" | grep -q "access_token"; then
    echo "✅ Login endpoint works correctly"
    
    # Extract token and test authenticated call
    TOKEN=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
    USER_RESPONSE=$(curl -s -X GET http://localhost:4200/api/auth/me \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$USER_RESPONSE" | grep -q "user_id"; then
        echo "✅ Authenticated API calls work correctly"
    else
        echo "❌ Authenticated API call failed"
    fi
else
    echo "❌ Login failed"
fi

echo -e "\n========================================"
echo "Summary:"
echo "- Login page should load without 'Not authenticated' error"
echo "- You can now:"
echo "  1. Open http://localhost:4200"
echo "  2. Click 'Use test account' button"
echo "  3. Click 'Sign In'"
echo "  4. Access protected routes"
echo "  5. Click user menu → Sign Out to logout"