"""Topical verses API routes"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from core.dependencies import get_db
from database import DatabaseConnection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/topical", tags=["topical-verses"])


class TopicalVerseResponse(BaseModel):
    verse_id: int
    verse_code: str
    book_name: str
    chapter: int
    verse_number: int
    verse_text: Optional[str] = None
    is_memorized: bool = False
    practice_count: int = 0
    confidence_score: float = 0.0
    topic_relevance: float = 0.0
    topic_name: str


class TopicResponse(BaseModel):
    topic_id: int
    topic_name: str
    description: Optional[str] = None
    verse_count: int
    category: Optional[str] = None


def get_current_user_id() -> int:
    """Placeholder for auth"""
    return 1


# Sample topics - in a real implementation, these would be in the database
SAMPLE_TOPICS = [
    {"id": 1, "name": "Faith", "description": "Verses about faith and belief", "category": "Spiritual", "keywords": ["faith", "believe", "trust", "confidence"]},
    {"id": 2, "name": "Love", "description": "Verses about God's love and loving others", "category": "Relationships", "keywords": ["love", "beloved", "charity", "compassion"]},
    {"id": 3, "name": "Peace", "description": "Verses about peace and comfort", "category": "Comfort", "keywords": ["peace", "comfort", "rest", "still"]},
    {"id": 4, "name": "Strength", "description": "Verses about God's strength and power", "category": "Spiritual", "keywords": ["strength", "power", "mighty", "strong"]},
    {"id": 5, "name": "Wisdom", "description": "Verses about wisdom and understanding", "category": "Knowledge", "keywords": ["wisdom", "understanding", "knowledge", "wise"]},
    {"id": 6, "name": "Hope", "description": "Verses about hope and future", "category": "Comfort", "keywords": ["hope", "future", "promise", "expectation"]},
    {"id": 7, "name": "Joy", "description": "Verses about joy and happiness", "category": "Emotions", "keywords": ["joy", "rejoice", "glad", "happiness"]},
    {"id": 8, "name": "Prayer", "description": "Verses about prayer and communication with God", "category": "Spiritual", "keywords": ["pray", "prayer", "ask", "seek", "call"]},
    {"id": 9, "name": "Forgiveness", "description": "Verses about forgiveness and mercy", "category": "Relationships", "keywords": ["forgive", "forgiveness", "mercy", "pardon"]},
    {"id": 10, "name": "Salvation", "description": "Verses about salvation and redemption", "category": "Spiritual", "keywords": ["salvation", "save", "redeem", "deliver"]},
]


@router.get("/topics", response_model=List[TopicResponse])
def get_topics(db: DatabaseConnection = Depends(get_db)):
    """Get all available topics"""
    # For now, return sample topics. In a real implementation, 
    # this would query a topics table in the database
    topics = []
    
    for topic in SAMPLE_TOPICS:
        # Count verses for each topic by searching verse text
        count_query = """
            SELECT COUNT(DISTINCT bv.id) as verse_count
            FROM bible_verses bv
            JOIN verse_text vt ON bv.id = vt.verse_id
            WHERE LOWER(vt.text) ~ %s
        """
        
        # Create a regex pattern from keywords (PostgreSQL format)
        keywords_pattern = '\\b(' + '|'.join(topic["keywords"]) + ')\\b'
        
        try:
            result = db.fetch_one(count_query, (keywords_pattern,))
            verse_count = result["verse_count"] if result else 0
        except Exception as e:
            logger.warning(f"Error counting verses for topic {topic['name']}: {e}")
            verse_count = 0
        
        topics.append(TopicResponse(
            topic_id=topic["id"],
            topic_name=topic["name"],
            description=topic["description"],
            verse_count=verse_count,
            category=topic["category"]
        ))
    
    return topics


@router.get("/topics/{topic_id}/verses", response_model=List[TopicalVerseResponse])
def get_topical_verses(
    topic_id: int,
    user_id: int = Depends(get_current_user_id),
    limit: int = Query(50, description="Maximum number of verses to return"),
    db: DatabaseConnection = Depends(get_db),
):
    """Get verses for a specific topic"""
    logger.info(f"Getting topical verses for topic_id: {topic_id}")
    
    # Find the topic
    topic = next((t for t in SAMPLE_TOPICS if t["id"] == topic_id), None)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Create a regex pattern from keywords (PostgreSQL format)
    keywords_pattern = '\\b(' + '|'.join(topic["keywords"]) + ')\\b'
    
    # Query verses that contain the topic keywords
    query = """
        SELECT DISTINCT
            bv.id as verse_id,
            bv.verse_code,
            bb.book_name,
            bv.chapter_number as chapter,
            bv.verse_number,
            vt.text as verse_text,
            COALESCE(uv.practice_count, 0) as practice_count,
            COALESCE(uv.practice_count > 0, false) as is_memorized,
            COALESCE(uvc.confidence_score, 0.0) as confidence_score,
            -- Calculate relevance based on keyword matches (using PostgreSQL functions)
            (LENGTH(LOWER(vt.text)) - LENGTH(REGEXP_REPLACE(LOWER(vt.text), %s, '', 'g'))) / GREATEST(LENGTH(LOWER(vt.text)), 1) as topic_relevance
        FROM bible_verses bv
        JOIN bible_books bb ON bv.book_id = bb.book_id
        JOIN verse_text vt ON bv.id = vt.verse_id
        LEFT JOIN user_verses uv ON bv.id = uv.verse_id AND uv.user_id = %s
        LEFT JOIN user_verse_confidence uvc ON bv.id = uvc.verse_id AND uvc.user_id = %s
        WHERE LOWER(vt.text) ~ %s
        ORDER BY topic_relevance DESC, bb.book_order, bv.chapter_number, bv.verse_number
        LIMIT %s
    """
    
    try:
        results = db.fetch_all(query, (keywords_pattern, user_id, user_id, keywords_pattern, limit))
        
        logger.info(f"Found {len(results)} verses for topic '{topic['name']}'")
        
        # Convert to response format
        topical_verses = []
        for row in results:
            topical_verses.append(TopicalVerseResponse(
                verse_id=row["verse_id"],
                verse_code=row["verse_code"],
                book_name=row["book_name"],
                chapter=row["chapter"],
                verse_number=row["verse_number"],
                verse_text=row["verse_text"],
                is_memorized=row["is_memorized"],
                practice_count=row["practice_count"],
                confidence_score=row["confidence_score"],
                topic_relevance=row["topic_relevance"] or 0.0,
                topic_name=topic["name"]
            ))
        
        return topical_verses
        
    except Exception as e:
        logger.error(f"Error fetching topical verses: {e}")
        return []


@router.get("/search")
def search_topics(
    query: str = Query(..., min_length=2, description="Search query for topics"),
    db: DatabaseConnection = Depends(get_db),
):
    """Search topics by name or description"""
    query_lower = query.lower()
    
    matching_topics = []
    for topic in SAMPLE_TOPICS:
        if (query_lower in topic["name"].lower() or 
            query_lower in topic["description"].lower() or
            any(query_lower in keyword.lower() for keyword in topic["keywords"])):
            matching_topics.append(topic)
    
    return matching_topics