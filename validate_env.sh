#!/bin/bash

# ============================================
# Environment Variables Validation Script
# ============================================
# This script validates that all required environment variables are set
# Run this before starting the application
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Current environment
ENVIRONMENT=${ENVIRONMENT:-local}

echo "============================================"
echo "Validating environment variables for: $ENVIRONMENT"
echo "============================================"

# Check if secrets are loaded
SECRETS_LOADED=false
if [ -f "$HOME/.config/wellversed/secrets.env" ]; then
    echo "Secrets location: ~/.config/wellversed/secrets.env ✓"
    SECRETS_LOADED=true
elif [ -f "./secrets.env" ]; then
    echo "Secrets location: ./secrets.env (temporary)"
    SECRETS_LOADED=true
else
    echo "Secrets location: NOT FOUND ✗"
    echo "  Create with: cp .env.example secrets.env"
    echo "  Then move to: ~/.config/wellversed/secrets.env"
fi
echo ""

# Track validation status
VALIDATION_FAILED=0
MISSING_VARS=()
WARNINGS=()

# Function to check if variable is set
check_required() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}✗${NC} $var_name is not set"
        MISSING_VARS+=("$var_name")
        VALIDATION_FAILED=1
    else
        # Mask sensitive values in output
        if [[ "$var_name" == *"PASSWORD"* ]] || [[ "$var_name" == *"SECRET"* ]] || [[ "$var_name" == *"KEY"* ]]; then
            echo -e "${GREEN}✓${NC} $var_name is set (***masked***)"
        else
            echo -e "${GREEN}✓${NC} $var_name is set"
        fi
    fi
}

# Function to check optional variable with warning
check_optional() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}⚠${NC} $var_name is not set (optional)"
        WARNINGS+=("$var_name")
    else
        echo -e "${GREEN}✓${NC} $var_name is set"
    fi
}

echo ""
echo "Core Configuration:"
echo "-------------------"
check_required "ENVIRONMENT"

echo ""
echo "Database Configuration:"
echo "-----------------------"
check_required "DATABASE_HOST"
check_required "DATABASE_PORT"
check_required "DATABASE_NAME"
check_required "DATABASE_USER"
check_required "DATABASE_PASSWORD"

echo ""
echo "Security Configuration:"
echo "-----------------------"
check_required "LOCAL_JWT_SECRET"

if [ "$ENVIRONMENT" = "local" ] || [ "$ENVIRONMENT" = "development" ]; then
    check_required "LOCAL_TEST_USERS"
    check_required "LOCAL_TEST_PASSWORD"
fi

echo ""
echo "API Configuration:"
echo "------------------"
check_required "API_HOST"
check_required "API_PORT"
check_required "FRONTEND_URL"
check_required "API_BIBLE_KEY"

if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo ""
    echo "Production Configuration:"
    echo "-------------------------"
    check_required "AWS_REGION"
    check_required "COGNITO_USER_POOL_ID"
    check_required "COGNITO_CLIENT_ID"
    check_required "COGNITO_CLIENT_SECRET"
    check_required "ALLOWED_ORIGINS"
    
    echo ""
    echo "Production Optional:"
    echo "--------------------"
    check_optional "AWS_ACCESS_KEY_ID"
    check_optional "AWS_SECRET_ACCESS_KEY"
    check_optional "REDIS_PASSWORD"
    check_optional "DATADOG_API_KEY"
    check_optional "SENTRY_DSN"
    check_optional "SENDGRID_API_KEY"
fi

echo ""
echo "Redis Configuration:"
echo "--------------------"
check_optional "USE_REDIS"
check_optional "REDIS_HOST"
check_optional "REDIS_PORT"

echo ""
echo "Additional Services:"
echo "--------------------"
check_optional "MAPBOX_TOKEN"

# Validation for specific requirements
echo ""
echo "Security Validations:"
echo "---------------------"

# Check JWT secret strength
if [ -n "$LOCAL_JWT_SECRET" ]; then
    if [ ${#LOCAL_JWT_SECRET} -lt 32 ]; then
        echo -e "${YELLOW}⚠${NC} LOCAL_JWT_SECRET should be at least 32 characters"
        WARNINGS+=("LOCAL_JWT_SECRET length")
    else
        echo -e "${GREEN}✓${NC} LOCAL_JWT_SECRET length is sufficient"
    fi
fi

# Check database password strength
if [ -n "$DATABASE_PASSWORD" ]; then
    if [ "$DATABASE_PASSWORD" = "postgres" ] || [ "$DATABASE_PASSWORD" = "password" ]; then
        echo -e "${RED}✗${NC} DATABASE_PASSWORD is using a default/weak value"
        VALIDATION_FAILED=1
    else
        echo -e "${GREEN}✓${NC} DATABASE_PASSWORD is not a default value"
    fi
fi

# Check test password in non-production
if [ "$ENVIRONMENT" != "production" ] && [ -n "$LOCAL_TEST_PASSWORD" ]; then
    if [ ${#LOCAL_TEST_PASSWORD} -lt 8 ]; then
        echo -e "${YELLOW}⚠${NC} LOCAL_TEST_PASSWORD should be at least 8 characters"
        WARNINGS+=("LOCAL_TEST_PASSWORD length")
    else
        echo -e "${GREEN}✓${NC} LOCAL_TEST_PASSWORD length is sufficient"
    fi
fi

echo ""
echo "============================================"
echo "Validation Summary:"
echo "============================================"

if [ $VALIDATION_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All required environment variables are set!${NC}"
    
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Warnings (${#WARNINGS[@]}):${NC}"
        for warning in "${WARNINGS[@]}"; do
            echo "  - $warning"
        done
    fi
    
    echo ""
    echo "You can now run the application with:"
    echo "  docker compose up"
    echo "or"
    echo "  docker compose -f docker-compose.auth.yml up"
    
    exit 0
else
    echo -e "${RED}✗ Validation failed!${NC}"
    echo ""
    echo "Missing required variables (${#MISSING_VARS[@]}):"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    
    echo ""
    echo "To fix this:"
    echo "1. Set the missing environment variables"
    echo "2. Or source the .env file: source .env"
    echo "3. Then run this script again"
    
    exit 1
fi