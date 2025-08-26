# Well Versed Environment Setup Guide

## Overview

This application uses a two-file approach for environment configuration:
- **`env.sh`** - Non-sensitive configuration (can be committed)
- **`secrets.env`** - Sensitive values like passwords and API keys (NEVER commit)

## Quick Start

### 1. Create your secrets file
```bash
# Copy the template
cp secrets.env ~/.config/wellversed/secrets.env

# Or if you want to test first:
# Edit secrets.env in place, then move it later
```

### 2. Edit the secrets file with your actual values
```bash
# Edit the file (use your preferred editor)
nano ~/.config/wellversed/secrets.env

# Required values to update:
# - DATABASE_PASSWORD
# - LOCAL_JWT_SECRET (generate with: openssl rand -hex 32)
# - LOCAL_TEST_PASSWORD
# - API_BIBLE_KEY
# - MAPBOX_TOKEN
```

### 3. Secure the secrets file
```bash
# Create secure directory and move file
mkdir -p ~/.config/wellversed
mv secrets.env ~/.config/wellversed/
chmod 600 ~/.config/wellversed/secrets.env
```

### 4. Load the environment
```bash
# Option A: Load everything at once
source ./load_secrets.sh

# Option B: Load manually
source ./env.sh  # This will auto-load secrets if found

# Option C: Add to your .bashrc for auto-loading
echo "cd /path/to/well-versed-app && source ./env.sh" >> ~/.bashrc
```

### 5. Validate your setup
```bash
# Check all required variables are set
./validate_env.sh

# Or use the helper function
wellversed_validate
```

### 6. Start the application
```bash
# Using helper function
wellversed_start

# Or manually
docker compose -f docker-compose.auth.yml up
```

## File Structure

```
well-versed-app/
├── env.sh                 # Non-sensitive environment variables
├── load_secrets.sh        # Helper to load both env and secrets
├── validate_env.sh        # Validation script
├── secrets.env           # Template (move to ~/.config/wellversed/)
├── .env.example          # Documentation of all variables
└── docker-compose.auth.yml  # Uses environment variables
```

## Environment Variables

### Core Configuration (in `env.sh`)
- `ENVIRONMENT` - Environment mode (local/development/staging/production)
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`
- `API_HOST`, `API_PORT`, `FRONTEND_URL`
- `REDIS_HOST`, `REDIS_PORT`, `USE_REDIS`
- `AUDIT_LOGGING`, `AUDIT_LOG_FILE`

### Sensitive Values (in `secrets.env`)
- `DATABASE_PASSWORD` - PostgreSQL password
- `LOCAL_JWT_SECRET` - JWT signing secret (min 32 chars)
- `LOCAL_TEST_PASSWORD` - Password for test users
- `API_BIBLE_KEY` - API Bible service key
- `MAPBOX_TOKEN` - Mapbox API token
- `COGNITO_CLIENT_SECRET` - AWS Cognito secret (production)

## Helper Functions

Once you've sourced `env.sh` or `load_secrets.sh`, these commands are available:

| Command | Description |
|---------|-------------|
| `wellversed_env` | Show current environment variables |
| `wellversed_validate` | Validate all required variables are set |
| `wellversed_start` | Start the application with Docker Compose |
| `wellversed_unset` | Clear all Well Versed variables |

## Security Best Practices

1. **NEVER commit `secrets.env` or `.env` files** to version control
2. **Store secrets outside the project** directory (`~/.config/wellversed/`)
3. **Use restrictive permissions** (`chmod 600`) on secrets files
4. **Generate strong secrets**:
   ```bash
   # Generate JWT secret
   openssl rand -hex 32
   
   # Generate database password
   openssl rand -base64 32
   ```
5. **Use different secrets** for each environment (local/staging/production)
6. **Rotate secrets regularly** especially after any potential exposure

## Production Deployment

For production, use AWS Secrets Manager or Parameter Store instead of files:

```bash
# Store secrets in AWS
aws secretsmanager create-secret \
  --name wellversed/production/database \
  --secret-string '{"password":"your-secure-password"}'

# Or use Parameter Store
aws ssm put-parameter \
  --name /wellversed/production/jwt-secret \
  --value "your-jwt-secret" \
  --type SecureString
```

## Troubleshooting

### "Secrets file not found"
```bash
# Check if file exists
ls -la ~/.config/wellversed/secrets.env

# If not, create from template
cp secrets.env ~/.config/wellversed/
chmod 600 ~/.config/wellversed/secrets.env
```

### "Environment variables not set"
```bash
# Make sure you source the files (not execute)
source ./load_secrets.sh  # Correct
./load_secrets.sh        # Wrong - won't set variables in current shell
```

### "Permission denied"
```bash
# Fix permissions
chmod +x validate_env.sh load_secrets.sh
chmod 600 ~/.config/wellversed/secrets.env
```

### "Docker can't find environment variables"
```bash
# Make sure variables are exported
source ./load_secrets.sh  # This exports them
env | grep DATABASE      # Verify they're exported
```

## Development Workflow

1. **First time setup**:
   ```bash
   cp secrets.env ~/.config/wellversed/secrets.env
   # Edit with your values
   nano ~/.config/wellversed/secrets.env
   chmod 600 ~/.config/wellversed/secrets.env
   ```

2. **Daily development**:
   ```bash
   cd /path/to/well-versed-app
   source ./load_secrets.sh
   wellversed_start
   ```

3. **Testing changes**:
   ```bash
   wellversed_validate  # Check setup
   docker compose down  # Stop services
   wellversed_start    # Restart with new config
   ```

## Notes

- The `env.sh` file can be safely committed as it contains no secrets
- The `secrets.env` template can be committed as a reference
- Always validate your environment before starting the application
- Use the helper functions to simplify your workflow