#!/bin/bash
# ============================================
# Well Versed Environment Variables
# ============================================
# Source this file to load environment variables:
#   source ./env.sh
# Or add to your shell session:
#   echo "source /path/to/well-versed-app/env.sh" >> ~/.bashrc
# ============================================

# Get the directory where this script is located
WELLVERSED_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if we're in the well-versed project directory
if [[ "$PWD" != *"well-versed-app"* ]] && [[ "$1" != "--force" ]]; then
    echo "⚠️  Not in well-versed-app directory. Use --force to load anyway."
    return 1 2>/dev/null || exit 1
fi

# ============================================
# Load Secrets from External File
# ============================================
SECRETS_FILE="$HOME/.config/wellversed/secrets.env"
if [ -f "$SECRETS_FILE" ]; then
    source "$SECRETS_FILE"
    echo "✓ Loaded secrets from $SECRETS_FILE"
elif [ -f "$WELLVERSED_DIR/secrets.env" ]; then
    echo "⚠️  Found secrets.env in project directory"
    echo "   Move it to secure location with:"
    echo "   mkdir -p ~/.config/wellversed && mv secrets.env ~/.config/wellversed/ && chmod 600 ~/.config/wellversed/secrets.env"
    source "$WELLVERSED_DIR/secrets.env"
else
    echo "⚠️  No secrets file found"
    echo "   Expected location: $SECRETS_FILE"
    echo "   Create from template: cp secrets.env ~/.config/wellversed/ && chmod 600 ~/.config/wellversed/secrets.env"
fi

# ============================================
# Core Configuration
# ============================================
export ENVIRONMENT="local"

# ============================================
# Database Configuration
# ============================================
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
export DATABASE_NAME="wellversed01DEV"
export DATABASE_USER="postgres"
# DATABASE_PASSWORD is loaded from secrets.env

# ============================================
# Security & Authentication
# ============================================
# Note: Sensitive values (JWT secret, passwords) should be in ~/.config/wellversed/secrets.env
export LOCAL_TEST_USERS="test@example.com,admin@example.com"
# LOCAL_JWT_SECRET is loaded from secrets.env
# LOCAL_TEST_PASSWORD is loaded from secrets.env

# ============================================
# API Configuration
# ============================================
export API_HOST="0.0.0.0"
export API_PORT="8000"
export FRONTEND_URL="http://localhost:4200"

# API Bible
# API_BIBLE_KEY is loaded from secrets.env
export API_BIBLE_HOST="https://api.scripture.api.bible"
export DEFAULT_BIBLE_ID="de4e12af7f28f599-02"
export SKIP_API_BIBLE_CHECK="false"

# ============================================
# Redis Configuration
# ============================================
export USE_REDIS="true"
export REDIS_HOST="redis"  # Use "localhost" if Redis is on host, "redis" for Docker
export REDIS_PORT="6379"
export REDIS_DB="0"
export REDIS_BLACKLIST_DB="1"

# ============================================
# Security & Audit
# ============================================
export AUDIT_LOGGING="true"
export AUDIT_LOG_FILE="/var/log/wellversed/audit.log"
export AUDIT_LOG_PII="false"

# ============================================
# AWS Configuration (for production)
# ============================================
# Uncomment and fill for production/staging
# export AWS_REGION="us-east-1"
# export COGNITO_USER_POOL_ID="us-east-1_xxxxxxxxx"
# export COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
# export COGNITO_CLIENT_SECRET="your_cognito_secret"
# export COGNITO_DOMAIN="https://your-domain.auth.us-east-1.amazoncognito.com"

# ============================================
# Additional Services
# ============================================
# MAPBOX_TOKEN is loaded from secrets.env

# ============================================
# Helper Functions
# ============================================

# Function to show current Well Versed environment
wellversed_env() {
    echo "Well Versed Environment Variables:"
    echo "=================================="
    echo "ENVIRONMENT: $ENVIRONMENT"
    echo "DATABASE_HOST: $DATABASE_HOST"
    echo "DATABASE_NAME: $DATABASE_NAME"
    echo "API_PORT: $API_PORT"
    echo "FRONTEND_URL: $FRONTEND_URL"
    echo "USE_REDIS: $USE_REDIS"
    echo "AUDIT_LOGGING: $AUDIT_LOGGING"
    echo ""
    echo "JWT Secret: $(if [ -n "$LOCAL_JWT_SECRET" ]; then echo "✓ Set"; else echo "✗ Not set"; fi)"
    echo "Test Password: $(if [ -n "$LOCAL_TEST_PASSWORD" ]; then echo "✓ Set"; else echo "✗ Not set"; fi)"
    echo "API Bible Key: $(if [ -n "$API_BIBLE_KEY" ]; then echo "✓ Set"; else echo "✗ Not set"; fi)"
}

# Function to validate environment
wellversed_validate() {
    "$WELLVERSED_DIR/validate_env.sh"
}

# Function to start the application
wellversed_start() {
    cd "$WELLVERSED_DIR"
    if wellversed_validate; then
        docker compose -f docker-compose.auth.yml up
    else
        echo "❌ Environment validation failed. Please fix the issues above."
    fi
}

# Function to unset all Well Versed variables
wellversed_unset() {
    unset ENVIRONMENT
    unset DATABASE_HOST DATABASE_PORT DATABASE_NAME DATABASE_USER DATABASE_PASSWORD
    unset LOCAL_JWT_SECRET LOCAL_TEST_USERS LOCAL_TEST_PASSWORD
    unset API_HOST API_PORT FRONTEND_URL
    unset API_BIBLE_KEY API_BIBLE_HOST DEFAULT_BIBLE_ID SKIP_API_BIBLE_CHECK
    unset USE_REDIS REDIS_HOST REDIS_PORT REDIS_DB REDIS_BLACKLIST_DB
    unset AUDIT_LOGGING AUDIT_LOG_FILE AUDIT_LOG_PII
    unset MAPBOX_TOKEN
    echo "✓ Well Versed environment variables unset"
}

echo "✓ Well Versed environment loaded"
echo "  Commands available:"
echo "    wellversed_env      - Show current environment"
echo "    wellversed_validate - Validate environment setup"
echo "    wellversed_start    - Start the application"
echo "    wellversed_unset    - Unset all variables"