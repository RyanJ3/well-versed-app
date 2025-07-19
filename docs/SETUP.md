# Setup Guide - Well Versed

This guide provides detailed instructions for setting up the Well Versed application for local development.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Installation](#manual-installation)
- [API Keys Configuration](#api-keys-configuration)
- [Database Setup Details](#database-setup-details)
- [Verification Steps](#verification-steps)
- [Common Issues](#common-issues)

## Prerequisites

### Required Software

#### Option 1: Docker Installation (Recommended)
- Docker Desktop (includes Docker Compose)
  - [Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Mac](https://docs.docker.com/desktop/install/mac-install/)
  - [Linux](https://docs.docker.com/desktop/install/linux-install/)

#### Option 2: Manual Installation
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL 16+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### System Requirements
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

## Quick Start with Docker

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/well-versed.git
cd well-versed
```

### 2. Environment Configuration
```bash
# Copy the environment template
cp backend/.env.example backend/.env

# Edit the configuration
# On Mac/Linux:
nano backend/.env
# On Windows:
notepad backend/.env
```

### 3. Configure Environment Variables
```env
# Database Configuration (Docker defaults)
DATABASE_HOST=db  # Use 'db' for Docker, 'localhost' for manual
DATABASE_PORT=5432
DATABASE_NAME=wellversed01DEV
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password_here

# API Configuration
API_BIBLE_KEY=your_api_bible_key_here
DEFAULT_BIBLE_ID=de4e12af7f28f599-02  # ASV Bible

# Application URLs
FRONTEND_URL=http://localhost:4200
API_PORT=8000
```

### 4. Start Docker Services
```bash
# Start all services in background
docker-compose up -d

# View logs (optional)
docker-compose logs -f

# Stop with Ctrl+C
```

### 5. Initialize Database
```bash
# Install Python dependencies for setup script
cd sql_setup
pip install -r requirements.txt

# Run database setup
python3 setup_database.py

# For complete reset (WARNING: deletes all data)
python3 setup_database.py --drop
```

### 6. Access the Application
- **Frontend**: http://localhost:4200
- **API Documentation**: http://localhost:8000/docs
- **Database**: `localhost:5432` (username: postgres)

## Manual Installation

### 1. PostgreSQL Setup
```bash
# Create database
createdb wellversed01DEV

# Verify connection
psql -U postgres -d wellversed01DEV -c "SELECT version();"
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings (use localhost for DATABASE_HOST)
```

### 3. Database Schema Setup
```bash
cd ../sql_setup

# Install setup dependencies
pip install -r requirements.txt

# Initialize database
python3 setup_database.py

# Options:
# --drop           : Complete reset (drops existing schema)
# --no-test-data   : Skip test data insertion
# --verify-only    : Check existing setup without changes
```

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm start
# or
ng serve
```

### 5. Start Backend Server
```bash
cd ../backend
source venv/bin/activate  # If not already activated

# Start with auto-reload
python3 main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Keys Configuration

### API.Bible (Required)

1. **Create Account**
   - Visit https://scripture.api.bible/
   - Click "Get Started" or "Sign Up"
   - Complete registration

2. **Generate API Key**
   - Log into your account
   - Go to "Applications" → "Create New"
   - Name your application (e.g., "Well Versed Dev")
   - Copy the generated API key

3. **Configure in Application**
   - Add to `backend/.env`: `API_BIBLE_KEY=your_key_here`
   - Default Bible ID: `de4e12af7f28f599-02` (ASV)

4. **Find Other Bible IDs**
   - Use the API endpoint: `GET https://api.scripture.api.bible/v1/bibles`
   - Or check the [Bible list](https://scripture.api.bible/bibles)

### ESV API (Optional)

1. **Register for Access**
   - Visit https://api.esv.org/
   - Click "Create Account"
   - Submit application (may take 1-2 days for approval)

2. **Configure for Users**
   - Users add their personal tokens in Profile Settings
   - Not required for basic functionality

## Database Setup Details

### What Gets Created

The setup script creates:
- **Schema**: `wellversed01DEV`
- **73 Bible books** (including Apocrypha)
- **31,000+ verses** with references
- **Biblical journey data** (Paul's journeys, Exodus, etc.)
- **Test user** (ID: 1, email: test@example.com)
- **Sample memorization data** for testing

### Setup Script Options

```bash
# Full setup with test data
python3 setup_database.py

# Production setup (no test data)
python3 setup_database.py --no-test-data

# Complete reset
python3 setup_database.py --drop

# Verify installation
python3 setup_database.py --verify-only
```

### Manual Database Setup (Advanced)

If the Python script fails:
```bash
# Execute SQL files manually
cd sql_setup
psql -U postgres -d wellversed01DEV -f 01-drop-schema.sql  # WARNING: Drops everything
psql -U postgres -d wellversed01DEV -f 02-create-schema.sql
psql -U postgres -d wellversed01DEV -f 03-create-users.sql
# ... continue for all numbered SQL files

# Then run Python script for Bible data
python3 setup_database.py --verify-only
```

## Verification Steps

### 1. Check Docker Services
```bash
docker-compose ps
# Should show 3 services running: db, backend, frontend
```

### 2. Test API Health
```bash
curl http://localhost:8000/api/health
# Should return: {"status":"healthy","database":"connected"}
```

### 3. Verify Database
```bash
cd sql_setup
python3 setup_database.py --verify-only
```

### 4. Test Frontend Proxy
- Open http://localhost:4200
- Open browser DevTools (F12)
- Check Network tab for API calls to `/api/*`
- Should see successful requests (200 status)

## Common Issues

### Port Already in Use
```bash
# Find process using port
# Mac/Linux:
lsof -i :8000
lsof -i :4200
lsof -i :5432

# Windows:
netstat -ano | findstr :8000

# Kill process or change port in docker-compose.yml
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps db

# Check logs
docker-compose logs db

# Try direct connection
psql -h localhost -p 5432 -U postgres -d wellversed01DEV
```

### Frontend Can't Connect to Backend
1. Check `frontend/proxy.conf.json`:
   ```json
   {
     "/api": {
       "target": "http://localhost:8000",
       "secure": false
     }
   }
   ```

2. Ensure backend is running on port 8000

3. Check CORS settings in `backend/main.py`

### Memory Issues During Setup
- Close other applications
- Use `--no-test-data` flag
- Increase Docker Desktop memory allocation:
  - Docker Desktop → Settings → Resources → Memory

### API.Bible Rate Limiting
- Free tier: 5000 requests/day
- Check usage at https://scripture.api.bible/
- Consider implementing caching

## Next Steps

After successful setup:

1. **Explore the API**
   - Visit http://localhost:8000/docs
   - Try out endpoints with the interactive documentation

2. **Test User Features**
   - User ID 1 has pre-loaded memorization data
   - Try different Bible tracker views

3. **Create Content**
   - Make a flashcard deck
   - Create a course
   - Vote on feature requests

4. **Development Workflow**
   - Frontend changes auto-reload
   - Backend changes auto-reload with `--reload` flag
   - Database changes require re-running setup script

## Getting Help

- Check the [Architecture Guide](ARCHITECTURE.md) for system overview
- See [API Documentation](API.md) for endpoint details
- Review [Database Schema](DATABASE.md) for table structures
- Search existing issues on GitHub
- Create a new issue with:
  - Your OS and versions
  - Error messages
  - Steps to reproduce