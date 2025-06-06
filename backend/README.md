# backend/README.md
# Well Versed Backend API

FastAPI backend for Bible verse memorization tracking.

## Setup

1. Create `.env` file:
```bash
cp .env.example .env
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup database:
```bash
cd ../sql_setup
python3 03-populate-bible-verses.py
psql -U postgres -d wellversed01DEV < 04-test-data.sql
```

4. Run server:
```bash
python3 main.py
# or
uvicorn main:app --reload
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/users/{user_id}` - Get user info
- `PUT /api/users/{user_id}` - Update user profile
- `GET /api/user-verses/{user_id}` - Get memorized verses
- `PUT /api/user-verses/{user_id}/{verse_code}` - Save/update verse
- `DELETE /api/user-verses/{user_id}/{verse_code}` - Delete verse
- `POST /api/user-verses/{user_id}/chapters/{book_id}/{chapter}` - Save chapter
- `DELETE /api/user-verses/{user_id}/chapters/{book_id}/{chapter}` - Clear chapter
- `POST /api/user-verses/{user_id}/books/{book_id}` - Save book
- `DELETE /api/user-verses/{user_id}/books/{book_id}` - Clear book
- `GET /api/feature-requests` - List feature requests
- `GET /api/feature-requests/{id}` - Get a single request
- `POST /api/feature-requests` - Create a new request
- `POST /api/feature-requests/{id}/vote` - Vote on a request
- `DELETE /api/feature-requests/{id}/vote/{user_id}` - Remove a vote
- `GET /api/feature-requests/{id}/comments` - List comments
- `POST /api/feature-requests/{id}/comments` - Add a comment
- `GET /api/feature-requests/user/{user_id}` - Requests by user
- `GET /api/feature-requests/trending` - Trending requests

## Testing

```bash
python3 test_api.py
```

## Docker

Use with main docker-compose.yml in project root.

# API Bible Integration

## Setup
1. Get API key from https://scripture.api.bible/
2. Add to `.env`: `API_BIBLE_KEY=your_key_here`
3. Restart backend

## Files
- `backend/services/api_bible.py` - API Bible service
- `backend/routers/user_verses.py` - Includes `/verses/texts` endpoint

# Amazon Cognito Integration

## Setup
1. Create a User Pool and App Client in the AWS console.
2. Add the following variables to your `.env`:
   ```
   AWS_REGION=us-east-1
   COGNITO_USER_POOL_ID=your_pool_id
   COGNITO_APP_CLIENT_ID=your_client_id
   ```
3. Restart the backend after setting these values.

## Files
- `backend/services/aws_cognito.py` - Cognito helper class
- `backend/routers/auth.py` - Signup and login endpoints
