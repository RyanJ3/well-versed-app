# Database Schema - Well Versed

## Overview

Well Versed uses PostgreSQL 16 with a comprehensive schema designed for Bible verse memorization tracking. The database includes ~31,000 verses across 73 books (including Apocrypha).

**Database Name**: `wellversed01DEV`  
**Schema**: `wellversed01dev` (lowercase in queries)  
**Total Tables**: 21

## Schema Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   users     │     │ bible_books  │     │ bible_verses │
├─────────────┤     ├──────────────┤     ├──────────────┤
│ user_id PK  │     │ book_id PK   │     │ id PK        │
│ email       │     │ book_name    │     │ verse_code   │
│ name        │     │ testament    │     │ book_id FK   │
│ ...         │     │ book_group   │     │ chapter_num  │
└─────────────┘     └──────────────┘     │ verse_num    │
       │                                  └──────────────┘
       │                                         │
       ├─────────────────┬───────────────────────┤
       ↓                 ↓                       ↓
┌─────────────┐   ┌──────────────┐    ┌──────────────────┐
│ user_verses │   │    decks     │    │ confidence       │
├─────────────┤   ├──────────────┤    ├──────────────────┤
│ user_id FK  │   │ deck_id PK   │    │ user_id FK       │
│ verse_id FK │   │ user_id FK   │    │ verse_id FK      │
│ practice_ct │   │ name         │    │ confidence_score │
└─────────────┘   └──────────────┘    └──────────────────┘
```

## Core Tables

### users
Stores user accounts and preferences.

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    denomination VARCHAR(100),
    preferred_bible VARCHAR(50),
    use_esv_api BOOLEAN DEFAULT FALSE,
    esv_api_token VARCHAR(200),
    include_apocrypha BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields**:
- `user_id`: Auto-incrementing primary key
- `include_apocrypha`: Whether to show deuterocanonical books
- `use_esv_api`: Toggle for ESV API usage
- `esv_api_token`: User's personal ESV API token

### bible_books
Reference table for all 73 Bible books.

```sql
CREATE TABLE bible_books (
    book_id INTEGER PRIMARY KEY,
    book_name VARCHAR(50) NOT NULL,
    book_code_3 VARCHAR(3),        -- 3-letter abbreviation (e.g., GEN)
    book_code_4 VARCHAR(4),        -- 4-letter abbreviation
    testament VARCHAR(20) NOT NULL,
    book_group VARCHAR(50) NOT NULL,
    canonical_affiliation VARCHAR(50) NOT NULL DEFAULT 'All',
    chapter_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Book Groups**:
- Torah (Genesis-Deuteronomy)
- Historical
- Wisdom
- Major Prophets
- Minor Prophets
- Gospels
- Pauline Epistles
- General Epistles
- Apocalyptic

**Canonical Affiliations**:
- `All`: Protestant canon
- `Catholic`: Catholic deuterocanon
- `Eastern Orthodox`: Orthodox canon
- `NONE`: Non-canonical

### bible_verses
Contains all Bible verses with references.

```sql
CREATE TABLE bible_verses (
    id SERIAL PRIMARY KEY,
    verse_code VARCHAR(20) UNIQUE NOT NULL,  -- Format: "book-chapter-verse"
    book_id INTEGER NOT NULL REFERENCES bible_books(book_id),
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    is_apocryphal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Verse Code Format**: `{book_id}-{chapter}-{verse}`
- Example: `1-1-1` = Genesis 1:1
- Example: `40-3-16` = Matthew 3:16

### user_verses
Tracks which verses users have memorized.

```sql
CREATE TABLE user_verses (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id INTEGER REFERENCES bible_verses(id) ON DELETE CASCADE,
    practice_count INTEGER DEFAULT 1,
    last_practiced TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);
```

### user_verse_confidence
Tracks confidence scores for spaced repetition.

```sql
CREATE TABLE user_verse_confidence (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    last_reviewed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    review_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, verse_id)
);
```

## Deck System Tables

### decks
User-created verse collections.

```sql
CREATE TABLE decks (
    deck_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### saved_decks
Tracks which decks users have bookmarked.

```sql
CREATE TABLE saved_decks (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, deck_id)
);
```

### deck_cards
Individual flashcards within decks.

```sql
CREATE TABLE deck_cards (
    card_id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
    card_type VARCHAR(20) DEFAULT 'verse_range',  -- 'single_verse' or 'verse_range'
    reference TEXT NOT NULL,                       -- Human-readable reference
    start_verse_id INTEGER NOT NULL REFERENCES bible_verses(id),
    end_verse_id INTEGER REFERENCES bible_verses(id),
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### card_verses
Maps verses to cards (for multi-verse cards).

```sql
CREATE TABLE card_verses (
    card_id INTEGER NOT NULL REFERENCES deck_cards(card_id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    verse_order INTEGER NOT NULL,
    PRIMARY KEY (card_id, verse_id)
);
```

### deck_tags & deck_tag_map
Tag system for deck categorization.

```sql
CREATE TABLE deck_tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deck_tag_map (
    deck_id INTEGER REFERENCES decks(deck_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES deck_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, tag_id)
);
```

## Course System Tables

### courses
Structured learning paths.

```sql
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### course_lessons
Individual lessons within courses.

```sql
CREATE TABLE course_lessons (
    lesson_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL,
    content_data JSONB,
    flashcards_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### course_enrollments
Tracks user enrollment and progress.

```sql
CREATE TABLE course_enrollments (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    current_lesson_id INTEGER REFERENCES course_lessons(lesson_id),
    current_lesson_position INTEGER DEFAULT 1,
    lessons_completed INTEGER DEFAULT 0,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, course_id)
);
```

### lesson_progress
Detailed progress tracking per lesson.

```sql
CREATE TABLE lesson_progress (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    flashcards_required INTEGER DEFAULT 0,
    flashcards_completed INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT TRUE,
    quiz_attempts INTEGER DEFAULT 0,
    best_score INTEGER,
    last_attempt TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, lesson_id)
);
```

## Biblical Journey Tables

### biblical_journeys
Stores journey metadata.

```sql
CREATE TABLE biblical_journeys (
    journey_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    testament VARCHAR(20) NOT NULL,
    journey_type VARCHAR(50),
    journey_order INTEGER,
    start_year INTEGER,
    end_year INTEGER,
    scripture_refs VARCHAR(200),
    description TEXT,
    color VARCHAR(7),  -- Hex color for map display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### journey_waypoints
Individual stops on journeys.

```sql
CREATE TABLE journey_waypoints (
    waypoint_id SERIAL PRIMARY KEY,
    journey_id INTEGER NOT NULL REFERENCES biblical_journeys(journey_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    location_name VARCHAR(100) NOT NULL,
    modern_name VARCHAR(100),
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    description TEXT,
    events JSONB,  -- Structured event data
    distance_from_start INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Events JSONB Format**:
```json
{
  "events": [
    {
      "title": "Event Title",
      "description": "What happened here",
      "scriptures": ["Acts 13:1-3"],
      "visualEffect": "miracle|conflict|teaching|divine-light"
    }
  ]
}
```

## Feature Request Tables

### feature_requests
Community feature voting system.

```sql
CREATE TABLE feature_requests (
    request_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(20),
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### feature_request_votes
Tracks user votes.

```sql
CREATE TABLE feature_request_votes (
    request_id INTEGER REFERENCES feature_requests(request_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    vote_type VARCHAR(4) NOT NULL CHECK (vote_type IN ('up','down')),
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (request_id, user_id)
);
```

## Key Indexes

Performance-critical indexes:

```sql
-- Verse lookups
CREATE INDEX idx_bible_verses_code ON bible_verses(verse_code);
CREATE INDEX idx_bible_verses_location ON bible_verses(book_id, chapter_number, verse_number);

-- User data
CREATE INDEX idx_user_verses_user ON user_verses(user_id);
CREATE INDEX idx_user_verses_practice ON user_verses(last_practiced);

-- Confidence tracking
CREATE INDEX idx_confidence_score ON user_verse_confidence(confidence_score);
CREATE INDEX idx_confidence_last_reviewed ON user_verse_confidence(last_reviewed);

-- Deck system
CREATE INDEX idx_decks_public ON decks(is_public);
CREATE INDEX idx_deck_cards_position ON deck_cards(deck_id, position);
```

## Common Queries

### Get all verses for a chapter
```sql
SELECT * FROM bible_verses 
WHERE book_id = 1 AND chapter_number = 1 
ORDER BY verse_number;
```

### Get user's memorized verses with book names
```sql
SELECT bv.*, bb.book_name, uv.practice_count, uv.last_practiced
FROM user_verses uv
JOIN bible_verses bv ON uv.verse_id = bv.id
JOIN bible_books bb ON bv.book_id = bb.book_id
WHERE uv.user_id = 1
ORDER BY bv.book_id, bv.chapter_number, bv.verse_number;
```

### Get public decks with tags
```sql
SELECT d.*, u.name as creator_name, 
       ARRAY_AGG(dt.tag_name) as tags,
       COUNT(DISTINCT dc.card_id) as card_count
FROM decks d
JOIN users u ON d.user_id = u.user_id
LEFT JOIN deck_cards dc ON d.deck_id = dc.deck_id
LEFT JOIN deck_tag_map dtm ON d.deck_id = dtm.deck_id
LEFT JOIN deck_tags dt ON dtm.tag_id = dt.tag_id
WHERE d.is_public = TRUE
GROUP BY d.deck_id, u.name
ORDER BY d.created_at DESC;
```

### Get confidence distribution for a user
```sql
SELECT 
    CASE 
        WHEN confidence_score >= 90 THEN 'Mastered'
        WHEN confidence_score >= 70 THEN 'Proficient'
        WHEN confidence_score >= 50 THEN 'Learning'
        ELSE 'New'
    END as level,
    COUNT(*) as verse_count
FROM user_verse_confidence
WHERE user_id = 1
GROUP BY level
ORDER BY MIN(confidence_score) DESC;
```

## Data Volume

Typical data volumes after setup:
- **bible_books**: 73 rows
- **bible_verses**: ~31,000 rows
- **biblical_journeys**: 5 journeys
- **journey_waypoints**: ~50 waypoints
- **Test user verses**: ~259 memorized verses

## Maintenance

### Update timestamps automatically
All tables with `updated_at` use this trigger:

```sql
CREATE TRIGGER update_{table}_updated_at 
BEFORE UPDATE ON {table}
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Check table sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'wellversed01dev'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Vacuum and analyze
```sql
VACUUM ANALYZE wellversed01dev.bible_verses;
VACUUM ANALYZE wellversed01dev.user_verses;
```