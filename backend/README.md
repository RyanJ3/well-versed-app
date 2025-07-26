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
- `GET /api/verses` - Get memorized verses for the current user
- `PUT /api/verses/{book_id}/{chapter}/{verse}` - Save or update a verse
- `POST /api/verses/chapters/{book_id}/{chapter}` - Mark a chapter as memorized
- `DELETE /api/verses/chapters/{book_id}/{chapter}` - Clear a memorized chapter
- `POST /api/verses/books/{book_id}` - Mark an entire book as memorized
- `DELETE /api/verses/books/{book_id}` - Clear a memorized book
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

# ESV API Integration

## Setup
The ESV API is optional and can be enabled per user. Each user supplies their
own API token which is stored in the `esv_api_token` column.

1. Obtain a token from <https://api.esv.org/>
2. In the profile page, enable **Use ESV API** and enter the token.

When enabled, verse text requests will be served from the ESV API instead of
API.Bible.

### Caching
ESV responses are cached in memory with an eviction policy that follows
Crossway's public guidelines:

- No more than **500 verses** are stored at once.
- The cache stores at most half the chapters of any single book.
  Single chapter books are never cached.
- Entries expire after 24 hours so the cache is periodically cleared.

### Database migration
If you already have an existing database you will need to add the new columns:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS use_esv_api BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS esv_api_token VARCHAR(200);
```

Alternatively, re-run the setup script in `sql_setup` to recreate the schema.

