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

## Testing

```bash
python3 test_api.py
```

## Docker

Use with main docker-compose.yml in project root.