#!/bin/bash
# ============================================
# Setup secure secrets storage outside project
# ============================================

SECRETS_DIR="$HOME/.config/wellversed"
SECRETS_FILE="$SECRETS_DIR/secrets.env"

echo "This will create a secure secrets file at:"
echo "  $SECRETS_FILE"
echo ""
echo "This keeps sensitive data outside your project directory"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create directory with restricted permissions
    mkdir -p "$SECRETS_DIR"
    chmod 700 "$SECRETS_DIR"
    
    # Create secrets file
    cat > "$SECRETS_FILE" << 'EOF'
# ============================================
# Well Versed Secrets - KEEP SECURE
# ============================================
# This file contains sensitive data
# Never commit or share these values
# ============================================

# Database Password
export DATABASE_PASSWORD="your_secure_password_here"

# JWT Secret (generate with: openssl rand -hex 32)
export LOCAL_JWT_SECRET="your_jwt_secret_min_32_chars_here"

# Test Password
export LOCAL_TEST_PASSWORD="TestPassword123!"

# API Keys
export API_BIBLE_KEY="your_api_bible_key"
export MAPBOX_TOKEN="your_mapbox_token"

# Production Secrets (if needed)
# export COGNITO_CLIENT_SECRET="your_cognito_secret"
# export AWS_SECRET_ACCESS_KEY="your_aws_secret"
# export REDIS_PASSWORD="your_redis_password"
EOF

    # Set restrictive permissions
    chmod 600 "$SECRETS_FILE"
    
    # Create loader script in project
    cat > "load_secrets.sh" << EOF
#!/bin/bash
# Load secrets from secure location
SECRETS_FILE="$SECRETS_FILE"

if [ -f "\$SECRETS_FILE" ]; then
    source "\$SECRETS_FILE"
    echo "✓ Secrets loaded from \$SECRETS_FILE"
else
    echo "❌ Secrets file not found: \$SECRETS_FILE"
    exit 1
fi

# Load non-sensitive environment variables
source ./env.sh
EOF
    
    chmod +x load_secrets.sh
    
    echo "✓ Created secrets file: $SECRETS_FILE"
    echo "✓ Created loader script: load_secrets.sh"
    echo ""
    echo "Next steps:"
    echo "  1. Edit $SECRETS_FILE with your actual secrets"
    echo "  2. Run: source ./load_secrets.sh"
    echo ""
    echo "The secrets file has restricted permissions (600) for security"
else
    echo "Cancelled"
fi