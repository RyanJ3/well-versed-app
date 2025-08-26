#!/bin/bash

# Check for required environment variable
TEST_USER="${LOCAL_TEST_USERS%%,*}"  # Get first user from comma-separated list

if [ -z "$TEST_USER" ]; then
    echo "Error: LOCAL_TEST_USERS must be set"
    echo "Run: source .env (or set environment variables)"
    exit 1
fi

echo "Testing 3-attempt rate limiting with Redis enabled..."
echo "Using test user: $TEST_USER"

for i in 1 2 3 4; do
  echo ""
  echo "=== Attempt $i ==="
  
  response=$(curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$TEST_USER\",\"password\":\"WrongPassword\"}" \
    -s)
  
  echo "Response: $response"
  
  # Extract detail message
  detail=$(echo "$response" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('detail', 'No detail'))" 2>/dev/null || echo "Failed to parse JSON")
  echo "Detail: $detail"
  
  sleep 1
done

echo ""
echo "Test complete. The 4th attempt should be blocked."