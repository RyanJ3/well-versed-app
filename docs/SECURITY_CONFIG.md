# Security Configuration Guide

## Critical Security Requirements

### 1. JWT Secret Configuration (Local Development)

**IMPORTANT**: For local development, you MUST set a persistent JWT secret.

Generate a secure secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add to your `.env` file:
```
LOCAL_JWT_SECRET=<generated_secret_here>
```

**Never commit this secret to version control!**

### 2. CORS Configuration

The application now has strict CORS controls:

- **Local**: Allows localhost:4200, localhost:3000
- **Development**: Configured via FRONTEND_URL
- **Production**: Must set ALLOWED_ORIGINS in environment

For production:
```
ALLOWED_ORIGINS=https://wellversed.io,https://www.wellversed.io
```

### 3. Secure Token Storage

The application now uses a hybrid approach for token storage:

- **Access Token**: Stored in sessionStorage (short-lived, 1 hour)
- **ID Token**: Stored in sessionStorage
- **Refresh Token**: Stored in httpOnly cookie (secure, 30 days)

Benefits:
- Refresh tokens are protected from XSS attacks
- Access tokens remain accessible for API calls
- Automatic token refresh before expiry

### 4. Cookie Security Settings

Cookies are configured with:
- `httpOnly`: Prevents JavaScript access
- `secure`: HTTPS-only in production
- `sameSite=strict`: CSRF protection
- Path restricted to `/api/auth`

### 5. Environment-Specific Security

#### Local Development
- JWT uses HS256 with local secret
- Cookies use HTTP (not HTTPS)
- CORS allows localhost origins

#### Production
- JWT uses RS256 with Cognito JWKS
- Cookies require HTTPS
- CORS restricted to production domains
- Must configure AWS Cognito properly

## Deployment Checklist

### Backend
- [ ] Set `LOCAL_JWT_SECRET` for local development
- [ ] Configure `ALLOWED_ORIGINS` for production
- [ ] Set `ENVIRONMENT` variable correctly
- [ ] Configure Cognito credentials for production
- [ ] Enable HTTPS in production

### Frontend
- [ ] Ensure `withCredentials: true` for auth requests
- [ ] Configure proper API URL
- [ ] Remove any hardcoded tokens or secrets

## Security Best Practices

1. **Never expose Cognito client secret to frontend**
2. **Always use HTTPS in production**
3. **Implement rate limiting on auth endpoints**
4. **Add token blacklisting for logout**
5. **Monitor failed login attempts**
6. **Implement proper password policies**
7. **Enable MFA for production users**
8. **Regular security audits**

## Testing Authentication

### Local Testing
```bash
# Set environment to local
export ENVIRONMENT=local

# Generate and set JWT secret
export LOCAL_JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Start backend
python backend/main.py

# Test login
# Set LOCAL_TEST_PASSWORD in your .env file
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test@example.com\",\"password\":\"${LOCAL_TEST_PASSWORD}\"}"
```

### Production Testing
- Verify Cognito configuration
- Test with real Cognito user pool
- Ensure HTTPS is working
- Verify CORS restrictions