# AWS Cognito Authentication Setup Guide

## Overview

This guide covers setting up AWS Cognito authentication for the Well Versed app in both development and production environments.

## Architecture

```
┌─────────────┐      ┌──────────────┐     ┌──────────────┐
│   Frontend  │────▶│   Backend    │────▶│   Cognito    │
│  (Angular)  │◀────│   (FastAPI)  │◀────│ (User Pool)  │
└─────────────┘      └──────────────┘     └──────────────┘
      │                     │                     │
      │                     │                     │
      ▼                     ▼                     ▼
 [Auth Service]     [Auth Middleware]      [User Groups]
 [Interceptor]      [Token Validation]     [Permissions]
 [Guards]           [User Context]         [MFA (prod)]
```

## Local Development Setup

### 1. Using Docker Compose (Recommended)

```bash
# Start services with Cognito Local
docker-compose -f docker-compose.local.yml up -d

# Services available at:
# - Frontend: http://localhost:4200
# - Backend: http://localhost:8000
# - Cognito Local: http://localhost:9229
```

### 2. Manual Setup

```bash
# Install Cognito Local globally
npm install -g cognito-local

# Run Cognito Local
cognito-local

# Set environment variables
export ENVIRONMENT=local
export COGNITO_USER_POOL_ID=local_pool_id
export COGNITO_CLIENT_ID=local_client_id
```

### 3. Testing Authentication Locally

```python
# Create test user (run in Python console)
import requests

# Create user
# Set LOCAL_TEST_PASSWORD in your .env file
response = requests.post('http://localhost:8000/api/auth/test-user', json={
    'email': 'test@example.com',
    'password': os.getenv('LOCAL_TEST_PASSWORD', 'ChangeMe123!')
})

# Login
# Set LOCAL_TEST_PASSWORD in your .env file
response = requests.post('http://localhost:8000/api/auth/login', json={
    'username': 'test@example.com',
    'password': os.getenv('LOCAL_TEST_PASSWORD', 'ChangeMe123!')
})

tokens = response.json()
print(f"Access Token: {tokens['access_token']}")
```

## AWS Setup (Development/Staging/Production)

### 1. Prerequisites

- AWS Account with appropriate permissions
- Terraform installed (v1.0+)
- AWS CLI configured

### 2. Create Cognito User Pool with Terraform

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan deployment for dev environment
terraform plan -var-file=environments/dev.tfvars

# Apply configuration
terraform apply -var-file=environments/dev.tfvars

# Save outputs
terraform output > ../cognito-config.txt
```

### 3. Manual AWS Console Setup (Alternative)

1. **Create User Pool:**
   - Go to AWS Cognito Console
   - Click "Create user pool"
   - Choose "Email" as sign-in option
   - Set password policy (8+ chars, uppercase, lowercase, numbers, symbols)
   - Enable MFA (optional for dev, required for prod)
   - Add custom attributes: `bible_version`

2. **Create App Client:**
   - In User Pool, go to "App clients"
   - Create new app client
   - Enable "USER_PASSWORD_AUTH" flow
   - Set token expiration (1hr access, 30d refresh)
   - Note the Client ID

3. **Create User Groups:**
   - Create groups: `users`, `premium`, `admin`
   - Set precedence (admin=1, premium=5, users=10)

### 4. Configure Environment Variables

```bash
# .env file for development
ENVIRONMENT=development
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=https://well-versed-dev.auth.us-east-1.amazoncognito.com
COGNITO_REDIRECT_URI=http://localhost:4200/auth/callback
```

## Production Deployment

### 1. Security Best Practices

- **Enable MFA** for all production users
- **Use secrets manager** for sensitive configuration
- **Enable advanced security** features in Cognito
- **Set up WAF** rules for authentication endpoints
- **Monitor failed login attempts** with CloudWatch
- **Implement rate limiting** on auth endpoints

### 2. Environment Configuration

```bash
# Production environment variables (use AWS Secrets Manager)
aws secretsmanager create-secret \
  --name well-versed/prod/cognito \
  --secret-string '{
    "user_pool_id": "us-east-1_xxxxxxxxx",
    "client_id": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
    "client_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxx"
  }'
```

### 3. Backend Deployment

```python
# backend/config.py - Production configuration
import boto3
import json

def get_cognito_config_from_secrets():
    """Retrieve Cognito config from AWS Secrets Manager"""
    if os.getenv("ENVIRONMENT") == "production":
        client = boto3.client('secretsmanager')
        secret = client.get_secret_value(SecretId='well-versed/prod/cognito')
        config = json.loads(secret['SecretString'])
        return config
    return None
```

### 4. Frontend Deployment

```typescript
// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.wellversed.io',
  cognitoConfig: {
    region: 'us-east-1',
    userPoolId: 'INJECTED_AT_BUILD_TIME',
    clientId: 'INJECTED_AT_BUILD_TIME'
  }
};
```

## Testing Strategy

### 1. Unit Tests

```python
# backend/tests/test_auth.py
import pytest
from unittest.mock import Mock, patch
from infrastructure.auth.cognito_service import CognitoService

def test_token_verification():
    service = CognitoService()
    mock_token = "eyJ..."
    
    with patch.object(service, '_get_jwks') as mock_jwks:
        mock_jwks.return_value = {"keys": [...]}
        result = service.verify_token(mock_token)
        assert result is not None
```

### 2. Integration Tests

```typescript
// frontend/src/app/services/auth/auth.service.spec.ts
describe('AuthService', () => {
  it('should authenticate user', async () => {
    const service = TestBed.inject(AuthService);
    const user = await service.login('test@example.com', 'password').toPromise();
    expect(user.email).toBe('test@example.com');
  });
});
```

### 3. E2E Tests

```typescript
// e2e/auth.e2e.spec.ts
describe('Authentication Flow', () => {
  it('should login and access protected route', async () => {
    await page.goto('/login');
    await page.fill('[name=email]', 'test@example.com');
    // Use password from LOCAL_TEST_PASSWORD environment variable
    await page.fill('[name=password]', process.env.LOCAL_TEST_PASSWORD || 'ChangeMe123!');
    await page.click('[type=submit]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.user-email')).toContainText('test@example.com');
  });
});
```

## Monitoring & Troubleshooting

### 1. CloudWatch Metrics

- Monitor sign-in attempts
- Track token refresh rates
- Alert on authentication failures

### 2. Common Issues

**Issue: "Invalid token" errors**
- Check JWKS URL configuration
- Verify token hasn't expired
- Ensure correct user pool ID

**Issue: CORS errors**
- Add frontend URL to CORS configuration
- Check API Gateway settings

**Issue: User can't login**
- Check user status in Cognito console
- Verify password meets requirements
- Check if account needs confirmation

### 3. Debug Mode

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# backend/infrastructure/auth/cognito_service.py
logger.debug(f"Token verification attempt for kid: {kid}")
logger.debug(f"JWKS URL: {self.config.jwks_url}")
```

## Migration from Existing Users

If you have existing users to migrate:

```python
# scripts/migrate_users.py
import boto3
import hashlib

cognito = boto3.client('cognito-idp')

def migrate_user(email, temp_password):
    """Create user in Cognito with temporary password"""
    response = cognito.admin_create_user(
        UserPoolId='us-east-1_xxxxxxxxx',
        Username=email,
        UserAttributes=[
            {'Name': 'email', 'Value': email},
            {'Name': 'email_verified', 'Value': 'true'}
        ],
        TemporaryPassword=temp_password,
        MessageAction='SUPPRESS'
    )
    return response

# Migrate users from database
with connection.cursor() as cursor:
    cursor.execute("SELECT email FROM users")
    for row in cursor.fetchall():
        migrate_user(row['email'], generate_temp_password())
```

## Cost Optimization

### Cognito Pricing (as of 2024)
- First 50,000 MAUs: Free
- 50,001-100,000 MAUs: $0.0055/MAU
- MFA SMS: $0.06/message

### Cost Saving Tips
1. Use email verification instead of SMS
2. Implement proper token caching
3. Use refresh tokens effectively
4. Consider federated identity for social logins

## Next Steps

1. ✅ Set up Cognito infrastructure
2. ✅ Implement authentication middleware
3. ✅ Create frontend auth service
4. ✅ Add guards and interceptors
5. ⏳ Deploy to AWS
6. ⏳ Set up monitoring
7. ⏳ Implement MFA
8. ⏳ Add social login providers