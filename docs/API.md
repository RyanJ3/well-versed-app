# API Documentation - Well Versed

## Overview

The Well Versed API is built with FastAPI and provides RESTful endpoints for all application features. 

**Base URL**: `http://localhost:8000/api`  
**Documentation**: `http://localhost:8000/docs` (Interactive Swagger UI)  
**Alternative Docs**: `http://localhost:8000/redoc` (ReDoc format)

## Authentication

Currently, the API uses a hardcoded user (ID: 1) for development. Authentication system to be implemented.

## Common Response Formats

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "detail": "Error description"
}
```

## Endpoints

### Health Check

#### Check API Health
```http
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

### User Management

#### Get User Profile
```http
GET /api/users/{user_id}
```

**Response**:
```json
{
  "id": 1,
  "email": "test@example.com",
  "name": "Test User",
  "first_name": "Test",
  "last_name": "User",
  "denomination": "Non-denominational",
  "preferred_bible": "ESV",
  "include_apocrypha": false,
  "use_esv_api": false,
  "esv_api_token": null,
  "created_at": "2024-01-01T00:00:00",
  "verses_memorized": 259,
  "streak_days": 0,
  "books_started": 10
}
```

#### Update User Profile
```http
PUT /api/users/{user_id}
```

**Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "denomination": "Baptist",
  "preferred_bible": "NIV",
  "include_apocrypha": true,
  "use_esv_api": true,
  "esv_api_token": "your_esv_token"
}
```

---

### Verse Management

#### Get User's Memorized Verses
```http
GET /api/user-verses/{user_id}?include_apocrypha=false
```

**Query Parameters**:
- `include_apocrypha` (boolean): Include apocryphal books

**Response**:
```json
[
  {
    "verse": {
      "verse_id": "1-1-1",
      "book_id": 1,
      "chapter_number": 1,
      "verse_number": 1,
      "isApocryphal": false
    },
    "practice_count": 3,
    "last_practiced": "2024-01-15T10:30:00",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-15T10:30:00"
  }
]
```

#### Save/Update Single Verse
```http
PUT /api/user-verses/{user_id}/{book_id}/{chapter}/{verse}
```

**Example**: Save John 3:16
```http
PUT /api/user-verses/1/43/3/16
```

**Request Body**:
```json
{
  "practice_count": 1,
  "last_practiced": "2024-01-15T10:30:00"
}
```

#### Delete Single Verse
```http
DELETE /api/user-verses/{user_id}/{book_id}/{chapter}/{verse}
```

#### Save Entire Chapter
```http
POST /api/user-verses/{user_id}/chapters/{book_id}/{chapter}
```

**Response**:
```json
{
  "message": "Chapter saved successfully",
  "verses_count": 31
}
```

#### Delete Entire Chapter
```http
DELETE /api/user-verses/{user_id}/chapters/{book_id}/{chapter}
```

#### Save Entire Book
```http
POST /api/user-verses/{user_id}/books/{book_id}
```

#### Delete Entire Book
```http
DELETE /api/user-verses/{user_id}/books/{book_id}
```

#### Get Verse Texts
```http
POST /api/user-verses/{user_id}/verses/texts
```

**Request Body**:
```json
{
  "verse_codes": ["1-1-1", "1-1-2", "1-1-3"],
  "bible_id": "de4e12af7f28f599-02"
}
```

**Response**:
```json
{
  "1-1-1": "In the beginning God created the heaven and the earth.",
  "1-1-2": "And the earth was without form, and void...",
  "1-1-3": "And God said, Let there be light: and there was light."
}
```

#### Update Confidence Score
```http
PUT /api/user-verses/confidence/{user_id}/{verse_id}
```

**Request Body**:
```json
{
  "confidence_score": 85,
  "last_reviewed": "2024-01-15T10:30:00"
}
```

---

### Deck Management

#### Get Public Decks
```http
GET /api/decks/public?skip=0&limit=20&tag=beginner&user_id=1
```

**Query Parameters**:
- `skip` (int): Pagination offset
- `limit` (int): Results per page
- `tag` (string): Filter by tag
- `user_id` (int): Check if saved by user

#### Get User's Decks
```http
GET /api/decks/user/{user_id}
```

#### Get Saved Decks
```http
GET /api/decks/saved/{user_id}
```

#### Get Single Deck
```http
GET /api/decks/{deck_id}
```

#### Create Deck
```http
POST /api/decks
```

**Request Body**:
```json
{
  "name": "Psalms of Comfort",
  "description": "Encouraging psalms for difficult times",
  "is_public": true,
  "verse_codes": ["19-23-1", "19-23-2", "19-23-3"],
  "tags": ["comfort", "psalms", "beginner"]
}
```

#### Update Deck
```http
PUT /api/decks/{deck_id}
```

**Request Body**:
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "is_public": false
}
```

#### Delete Deck
```http
DELETE /api/decks/{deck_id}
```

#### Get Deck Verses
```http
GET /api/decks/{deck_id}/verses?user_id=1&bible_id=de4e12af7f28f599-02
```

**Response**:
```json
{
  "deck_id": 1,
  "deck_name": "Psalms of Praise",
  "total_cards": 2,
  "cards": [
    {
      "card_id": 1,
      "card_type": "verse_range",
      "reference": "Psalm 23:1-6",
      "verses": [
        {
          "verse_id": 13524,
          "verse_code": "19-23-1",
          "book_id": 19,
          "book_name": "Psalms",
          "chapter_number": 23,
          "verse_number": 1,
          "reference": "Psalms 23:1",
          "text": "The LORD is my shepherd; I shall not want.",
          "verse_order": 1
        }
      ],
      "position": 1,
      "added_at": "2024-01-01T00:00:00",
      "confidence_score": 80,
      "last_reviewed": "2024-01-15T10:30:00"
    }
  ]
}
```

#### Add Verses to Deck
```http
POST /api/decks/{deck_id}/verses
```

**Request Body**:
```json
{
  "verse_codes": ["1-1-1", "1-1-2", "1-1-3"],
  "reference": "Genesis 1:1-3"
}
```

#### Save/Unsave Deck
```http
POST /api/decks/{deck_id}/save
```

**Request Body**:
```json
{
  "user_id": 1
}
```

```http
DELETE /api/decks/{deck_id}/save/{user_id}
```

---

### Course Management

#### Get Public Courses
```http
GET /api/courses/public?search=genesis&tags=beginner,old-testament
```

#### Get User's Created Courses
```http
GET /api/courses/user/{user_id}
```

#### Get Enrolled Courses
```http
GET /api/courses/enrolled/{user_id}
```

#### Create Course
```http
POST /api/courses
```

**Request Body**:
```json
{
  "title": "Journey Through Genesis",
  "description": "A comprehensive study of the book of Genesis",
  "thumbnail_url": "https://example.com/image.jpg",
  "is_public": true,
  "tags": ["genesis", "beginner", "old-testament"]
}
```

#### Enroll in Course
```http
POST /api/courses/{course_id}/enroll?user_id=1
```

#### Get Course Progress
```http
GET /api/courses/{course_id}/progress/{user_id}
```

#### Add Lesson to Course
```http
POST /api/courses/{course_id}/lessons
```

**Request Body**:
```json
{
  "title": "Creation Story",
  "description": "Understanding Genesis 1-2",
  "content_type": "text",
  "content_data": {
    "html": "<h1>The Creation Story</h1><p>Content here...</p>"
  },
  "flashcards_required": 10,
  "position": 1
}
```

---

### Feature Requests

#### List Feature Requests
```http
GET /api/feature-requests?page=1&per_page=20&type=feature&status=open&sort_by=upvotes
```

**Query Parameters**:
- `page` (int): Page number
- `per_page` (int): Items per page
- `type` (string): Request type
- `status` (string): Request status
- `sort_by` (string): Sort order (upvotes, newest, priority)
- `search` (string): Search in title/description

#### Create Feature Request
```http
POST /api/feature-requests
```

**Request Body**:
```json
{
  "title": "Add audio playback for verses",
  "description": "It would be helpful to hear verses read aloud",
  "type": "feature",
  "user_id": 1,
  "tags": ["audio", "accessibility"]
}
```

#### Vote on Request
```http
POST /api/feature-requests/{request_id}/vote
```

**Request Body**:
```json
{
  "user_id": 1,
  "vote_type": "up"
}
```

---

### Biblical Atlas

#### List All Journeys
```http
GET /api/atlas/journeys
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Paul's First Missionary Journey",
    "testament": "New Testament",
    "journey_type": "missionary",
    "journey_order": 4,
    "start_year": 46,
    "end_year": 48,
    "scripture_refs": "Acts 13-14",
    "description": "Paul and Barnabas spread the Gospel...",
    "color": "#4169E1"
  }
]
```

#### Get Journey Details
```http
GET /api/atlas/journeys/{journey_id}
```

**Response**:
```json
{
  "journey": {
    "id": 1,
    "name": "Paul's First Missionary Journey",
    "testament": "New Testament",
    "journey_type": "missionary"
  },
  "waypoints": [
    {
      "waypoint_id": 1,
      "position": 1,
      "location_name": "Antioch (Syria)",
      "modern_name": "Antakya, Turkey",
      "latitude": 36.2,
      "longitude": 36.16,
      "description": "The starting point...",
      "events": {
        "events": [
          {
            "title": "Commissioned by the Church",
            "description": "The Holy Spirit called Paul...",
            "scriptures": ["Acts 13:1-3"],
            "visualEffect": "divine-light"
          }
        ]
      },
      "distance_from_start": 0
    }
  ]
}
```

## Book ID Reference

| ID | Book Name | Testament |
|----|-----------|-----------|
| 1  | Genesis | Old Testament |
| 2  | Exodus | Old Testament |
| ... | ... | ... |
| 39 | Malachi | Old Testament |
| 40 | Matthew | New Testament |
| ... | ... | ... |
| 66 | Revelation | New Testament |
| 67 | Tobit | Apocrypha |
| ... | ... | ... |
| 73 | Baruch | Apocrypha |

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited (ESV API) |
| 500 | Internal Server Error |

## Rate Limits

- **API.Bible**: 5,000 requests/day (free tier)
- **ESV API**: 100 requests/hour per user token
- **No rate limits** on local API endpoints

## Testing Endpoints

Use the interactive documentation at http://localhost:8000/docs to test all endpoints with the "Try it out" feature.

### Example cURL Commands

```bash
# Get user profile
curl -X GET "http://localhost:8000/api/users/1"

# Save a verse
curl -X PUT "http://localhost:8000/api/user-verses/1/1/1/1" \
  -H "Content-Type: application/json" \
  -d '{"practice_count": 1}'

# Get verse texts
curl -X POST "http://localhost:8000/api/user-verses/1/verses/texts" \
  -H "Content-Type: application/json" \
  -d '{"verse_codes": ["1-1-1", "1-1-2"]}'
```