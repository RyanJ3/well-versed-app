#!/bin/bash

echo "Testing Auth Flow"
echo "================="

# Test 1: Login endpoint
echo "1. Testing login..."
response=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"test123"}')

if echo "$response" | grep -q "access_token"; then
  echo "✅ Login successful"
  token=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
  echo "Token: ${token:0:50}..."
  
  # Test 2: Access protected endpoint with token
  echo ""
  echo "2. Testing protected endpoint with token..."
  me_response=$(curl -s -X GET http://localhost:8000/api/auth/me \
    -H "Authorization: Bearer $token")
  
  if echo "$me_response" | grep -q "email"; then
    echo "✅ Protected endpoint accessible with token"
    echo "$me_response" | python3 -m json.tool
  else
    echo "❌ Failed to access protected endpoint"
  fi
else
  echo "❌ Login failed"
  echo "$response"
fi

echo ""
echo "3. Frontend login page status..."
curl -s http://localhost:4200/login -o /dev/null -w "HTTP Status: %{http_code}\n"

echo ""
echo "You can now test in browser:"
echo "1. Go to http://localhost:4200/login"
echo "2. Use any email/password (local mode)"
echo "3. Should redirect to main app after login"