#!/bin/bash

# Test script for secure authentication implementation
# This tests the new httpOnly cookie-based authentication

echo "================================================"
echo "Testing Secure Authentication Implementation"
echo "================================================"

API_URL="http://localhost:8000/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check environment variables are required
echo -e "\n${YELLOW}Test 1: Checking environment variable requirements${NC}"
if [ -z "$LOCAL_JWT_SECRET" ] || [ ${#LOCAL_JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}✗ LOCAL_JWT_SECRET not set or too short (min 32 chars)${NC}"
    echo "Generate one with: openssl rand -hex 32"
else
    echo -e "${GREEN}✓ LOCAL_JWT_SECRET is configured${NC}"
fi

if [ -z "$LOCAL_TEST_USERS" ]; then
    echo -e "${RED}✗ LOCAL_TEST_USERS not set${NC}"
else
    echo -e "${GREEN}✓ LOCAL_TEST_USERS is configured: $LOCAL_TEST_USERS${NC}"
fi

if [ -z "$LOCAL_TEST_PASSWORD" ] || [ ${#LOCAL_TEST_PASSWORD} -lt 8 ]; then
    echo -e "${RED}✗ LOCAL_TEST_PASSWORD not set or too short (min 8 chars)${NC}"
else
    echo -e "${GREEN}✓ LOCAL_TEST_PASSWORD is configured${NC}"
fi

# Test 2: Login and check cookies
echo -e "\n${YELLOW}Test 2: Testing login with httpOnly cookies${NC}"
echo "Attempting login..."

# Login and save cookies
RESPONSE=$(curl -s -c cookies.txt -w "\n%{http_code}" \
    -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"test@example.com\",\"password\":\"$LOCAL_TEST_PASSWORD\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Login successful (HTTP $HTTP_CODE)${NC}"
    
    # Check if cookies were set
    if grep -q "access_token" cookies.txt; then
        echo -e "${GREEN}✓ Access token cookie was set${NC}"
    else
        echo -e "${RED}✗ Access token cookie not found${NC}"
    fi
    
    if grep -q "refresh_token" cookies.txt; then
        echo -e "${GREEN}✓ Refresh token cookie was set${NC}"
    else
        echo -e "${RED}✗ Refresh token cookie not found${NC}"
    fi
    
    # Check response doesn't contain tokens
    if echo "$BODY" | grep -q '"access_token":""'; then
        echo -e "${GREEN}✓ Access token not exposed in response body${NC}"
    else
        echo -e "${RED}✗ Access token might be exposed in response${NC}"
    fi
else
    echo -e "${RED}✗ Login failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi

# Test 3: Access protected endpoint with cookies
echo -e "\n${YELLOW}Test 3: Accessing protected endpoint with cookie auth${NC}"

ME_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" \
    -X GET "$API_URL/auth/me")

ME_HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n 1)
ME_BODY=$(echo "$ME_RESPONSE" | sed '$d')

if [ "$ME_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Successfully accessed /auth/me with cookie auth${NC}"
    echo "User info: $ME_BODY"
else
    echo -e "${RED}✗ Failed to access /auth/me (HTTP $ME_HTTP_CODE)${NC}"
    echo "Response: $ME_BODY"
fi

# Test 4: Token refresh
echo -e "\n${YELLOW}Test 4: Testing token refresh with rotation${NC}"

REFRESH_RESPONSE=$(curl -s -c cookies_new.txt -b cookies.txt -w "\n%{http_code}" \
    -X POST "$API_URL/auth/refresh")

REFRESH_HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n 1)
REFRESH_BODY=$(echo "$REFRESH_RESPONSE" | sed '$d')

if [ "$REFRESH_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Token refresh successful${NC}"
    
    # Check if new cookies were set
    if grep -q "access_token" cookies_new.txt; then
        echo -e "${GREEN}✓ New access token cookie was set${NC}"
    fi
else
    echo -e "${RED}✗ Token refresh failed (HTTP $REFRESH_HTTP_CODE)${NC}"
    echo "Response: $REFRESH_BODY"
fi

# Test 5: Logout
echo -e "\n${YELLOW}Test 5: Testing logout${NC}"

LOGOUT_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" \
    -X POST "$API_URL/auth/logout")

LOGOUT_HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n 1)
LOGOUT_BODY=$(echo "$LOGOUT_RESPONSE" | sed '$d')

if [ "$LOGOUT_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Logout successful${NC}"
    
    # Test that the token is now invalid
    ME_AFTER_LOGOUT=$(curl -s -b cookies.txt -w "\n%{http_code}" \
        -X GET "$API_URL/auth/me")
    
    ME_AFTER_HTTP_CODE=$(echo "$ME_AFTER_LOGOUT" | tail -n 1)
    
    if [ "$ME_AFTER_HTTP_CODE" = "401" ]; then
        echo -e "${GREEN}✓ Token properly invalidated after logout${NC}"
    else
        echo -e "${RED}✗ Token still valid after logout (HTTP $ME_AFTER_HTTP_CODE)${NC}"
    fi
else
    echo -e "${RED}✗ Logout failed (HTTP $LOGOUT_HTTP_CODE)${NC}"
fi

# Test 6: Check rate limiting
echo -e "\n${YELLOW}Test 6: Testing rate limiting (3 attempts max)${NC}"

for i in {1..4}; do
    echo -n "Attempt $i: "
    LOGIN_ATTEMPT=$(curl -s -w "\n%{http_code}" \
        -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"test@example.com\",\"password\":\"wrongpassword\"}")
    
    ATTEMPT_CODE=$(echo "$LOGIN_ATTEMPT" | tail -n 1)
    ATTEMPT_BODY=$(echo "$LOGIN_ATTEMPT" | sed '$d')
    
    if [ "$ATTEMPT_CODE" = "429" ]; then
        echo -e "${GREEN}✓ Rate limited after 3 attempts${NC}"
        echo "Message: $(echo $ATTEMPT_BODY | jq -r '.detail')"
        break
    elif [ "$ATTEMPT_CODE" = "401" ]; then
        echo -e "${YELLOW}Failed login (attempt $i of 3)${NC}"
    fi
done

# Cleanup
rm -f cookies.txt cookies_new.txt

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}Security test completed!${NC}"
echo -e "${GREEN}================================================${NC}"