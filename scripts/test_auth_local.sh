#!/bin/bash

# Script to test authentication locally without AWS Cognito

echo "Testing local authentication setup..."

# Check for environment variables
if [ -z "$LOCAL_JWT_SECRET" ] || [ -z "$LOCAL_TEST_USERS" ] || [ -z "$LOCAL_TEST_PASSWORD" ]; then
    echo "Error: Required environment variables not set"
    echo "Please set LOCAL_JWT_SECRET, LOCAL_TEST_USERS, and LOCAL_TEST_PASSWORD"
    echo "Run: source ../.env (or set environment variables)"
    exit 1
fi

# Start the backend with local auth
echo "Starting backend with local authentication..."
cd backend
export ENVIRONMENT=local
# Database and API configuration should already be set from environment

# Test login endpoint
TEST_USER="${LOCAL_TEST_USERS%%,*}"  # Get first user from comma-separated list
TEST_PASS="${LOCAL_TEST_PASSWORD}"

echo "Testing login endpoint with user: $TEST_USER..."
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEST_USER\", \"password\": \"$TEST_PASS\"}"

echo ""
echo "Test complete. Check the response above for mock tokens."
echo "In local mode, any credentials will work and return mock tokens."