#!/bin/bash
# ============================================
# Load Well Versed Environment + Secrets
# ============================================
# This script loads both secrets and environment variables
# Usage: source ./load_secrets.sh
# ============================================

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Loading Well Versed environment..."

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load secrets first
SECRETS_FILE="$HOME/.config/wellversed/secrets.env"
if [ -f "$SECRETS_FILE" ]; then
    source "$SECRETS_FILE"
    echo -e "${GREEN}✓${NC} Loaded secrets from secure location"
elif [ -f "$SCRIPT_DIR/secrets.env" ]; then
    echo -e "${YELLOW}⚠️${NC}  Loading secrets from project directory (temporary)"
    echo "   Please move to secure location:"
    echo -e "${YELLOW}   mkdir -p ~/.config/wellversed${NC}"
    echo -e "${YELLOW}   mv secrets.env ~/.config/wellversed/${NC}"
    echo -e "${YELLOW}   chmod 600 ~/.config/wellversed/secrets.env${NC}"
    source "$SCRIPT_DIR/secrets.env"
else
    echo -e "${RED}✗${NC} No secrets file found!"
    echo "   Expected: $SECRETS_FILE"
    echo "   Or temporary: $SCRIPT_DIR/secrets.env"
    echo ""
    echo "   Create one with: cp .env.example secrets.env"
    return 1 2>/dev/null || exit 1
fi

# Load environment configuration
if [ -f "$SCRIPT_DIR/env.sh" ]; then
    # Skip the secrets loading part in env.sh since we already did it
    source "$SCRIPT_DIR/env.sh" --force 2>/dev/null
    echo -e "${GREEN}✓${NC} Loaded environment configuration"
else
    echo -e "${RED}✗${NC} env.sh not found!"
    return 1 2>/dev/null || exit 1
fi

# Quick validation
echo ""
echo "Environment Status:"
echo "==================="
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Database: ${GREEN}$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME${NC}"
echo -e "API: ${GREEN}$API_HOST:$API_PORT${NC}"
echo -e "Frontend: ${GREEN}$FRONTEND_URL${NC}"

# Check critical secrets
echo ""
echo "Secrets Status:"
echo "==============="
if [ -n "$DATABASE_PASSWORD" ]; then
    echo -e "Database Password: ${GREEN}✓ Set${NC}"
else
    echo -e "Database Password: ${RED}✗ Not set${NC}"
fi

if [ -n "$LOCAL_JWT_SECRET" ] && [ ${#LOCAL_JWT_SECRET} -ge 32 ]; then
    echo -e "JWT Secret: ${GREEN}✓ Set (${#LOCAL_JWT_SECRET} chars)${NC}"
else
    echo -e "JWT Secret: ${RED}✗ Not set or too short${NC}"
fi

if [ -n "$API_BIBLE_KEY" ]; then
    echo -e "API Bible Key: ${GREEN}✓ Set${NC}"
else
    echo -e "API Bible Key: ${YELLOW}⚠ Not set${NC}"
fi

echo ""
echo -e "${GREEN}Ready!${NC} Available commands:"
echo "  wellversed_env      - Show current environment"
echo "  wellversed_validate - Validate all variables"
echo "  wellversed_start    - Start the application"
echo "  wellversed_unset    - Clear all variables"