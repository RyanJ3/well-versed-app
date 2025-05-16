# Well Versed Backend Setup Guide

This guide will help you set up the Python backend for the Well Versed Bible memorization app.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Configuration settings
│   ├── database.py       # Database connection
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   └── api/
│       ├── __init__.py
│       ├── router.py     # Main API router
│       └── users.py      # User endpoints
├── requirements.txt
└── Dockerfile
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the backend directory with your Amazon Aurora PostgreSQL credentials:

```
DATABASE_HOST=your-aurora-host.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=well_versed
```

### 2. Install Requirements

```bash
pip install -r requirements.txt
```

### 3. Create Empty Files

Create the following empty files to complete the structure:
```bash
touch app/__init__.py
touch app/api/__init__.py
```

### 4. Run the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000, with interactive documentation at http://localhost:8000/docs.

## API Endpoints

Currently implemented endpoints:

- `GET /api/users/{user_id}` - Get user profile information
- `PUT /api/users/{user_id}` - Update user profile information

## Next Steps

1. Implement authentication
2. Add Bible verse tracking endpoints
3. Implement memorization progress tracking
