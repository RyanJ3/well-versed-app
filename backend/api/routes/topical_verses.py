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
    # For verse ranges
    end_verse_id: Optional[int] = None
    end_chapter: Optional[int] = None
    end_verse_number: Optional[int] = None
    is_range: bool = False
    display_reference: Optional[str] = None


class TopicResponse(BaseModel):
    topic_id: int
    topic_name: str
    description: Optional[str] = None
    verse_count: int
    passage_count: Optional[int] = None
    category: Optional[str] = None


def get_current_user_id() -> int:
    """Placeholder for auth"""
    return 1


def _group_into_ranges(verses: List[dict]) -> List[List[dict]]:
    """Group consecutive verses into ranges"""
    if not verses:
        return []
    
    grouped = []
    current_group = [verses[0]]
    
    for i in range(1, len(verses)):
        prev = verses[i - 1]
        curr = verses[i]
        
        # Check if verses are consecutive (same book)
        same_book = prev.get("book_id") == curr.get("book_id") or prev.get("book_name") == curr.get("book_name")
        
        # Check if consecutive within chapter
        same_chapter = prev["chapter"] == curr["chapter"]
        consecutive_in_chapter = same_chapter and curr["verse_number"] == prev["verse_number"] + 1
        
        if same_book and consecutive_in_chapter:
            # Add to current group for consecutive verses in same chapter
            current_group.append(curr)
        else:
            # Start new group
            grouped.append(current_group)
            current_group = [curr]
    
    # Add the last group
    if current_group:
        grouped.append(current_group)
    
    return grouped


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
    """Get all available topics from database"""
    # Query actual topics from the database
    query = """
        SELECT 
            t.topic_id,
            t.topic_name,
            t.description,
            NULL as category,
            COUNT(DISTINCT vt.verse_id) as verse_count
        FROM topics t
        LEFT JOIN verse_topics vt ON t.topic_id = vt.topic_id
        GROUP BY t.topic_id, t.topic_name, t.description
        HAVING COUNT(DISTINCT vt.verse_id) > 0
        ORDER BY t.topic_name
    """
    
    results = db.fetch_all(query)
    
    if not results:
        # Fallback to sample topics if database is empty
        logger.warning("No topics found in database, using sample topics")
        topics = []
        for topic in SAMPLE_TOPICS[:10]:
            topics.append(TopicResponse(
                topic_id=topic["id"],
                topic_name=topic["name"],
                description=topic["description"],
                verse_count=4,  # Default count
                category=topic["category"]
            ))
        return topics
    
    topics = []
    for row in results:
        topics.append(TopicResponse(
            topic_id=row["topic_id"],
            topic_name=row["topic_name"],
            description=row.get("description", ""),
            verse_count=row["verse_count"],
            category=row.get("category", "General")
        ))
    
    return topics


@router.get("/topics/{topic_id}/verses", response_model=List[TopicalVerseResponse])
def get_topical_verses(
    topic_id: int,
    user_id: int = Depends(get_current_user_id),
    limit: int = Query(200, description="Maximum number of verses to return"),
    db: DatabaseConnection = Depends(get_db),
):
    """Get verses for a specific topic from database"""
    logger.info(f"Getting topical verses for topic_id: {topic_id}")
    
    # Get topic name first
    topic_query = "SELECT topic_name FROM topics WHERE topic_id = %s"
    topic_result = db.fetch_one(topic_query, (topic_id,))
    
    if not topic_result:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    topic_name = topic_result["topic_name"]
    
    # Query verses for this topic from database
    query = """
        SELECT
            bv.id as verse_id,
            bv.verse_code,
            bb.book_name,
            bb.book_id,
            bv.chapter_number as chapter,
            bv.verse_number,
            COALESCE(uv.practice_count, 0) as practice_count,
            COALESCE(uv.practice_count > 0, false) as is_memorized,
            COALESCE(uvc.confidence_score, 0.0) as confidence_score,
            vt.confidence_score as topic_relevance
        FROM verse_topics vt
        JOIN bible_verses bv ON vt.verse_id = bv.id
        JOIN bible_books bb ON bv.book_id = bb.book_id
        LEFT JOIN user_verses uv ON bv.id = uv.verse_id AND uv.user_id = %s
        LEFT JOIN user_verse_confidence uvc ON bv.id = uvc.verse_id AND uvc.user_id = %s
        WHERE vt.topic_id = %s
        ORDER BY bb.book_id, bv.chapter_number, bv.verse_number
        LIMIT %s
    """
    
    try:
        results = db.fetch_all(query, (user_id, user_id, topic_id, limit))
        
        if not results:
            logger.warning(f"No verses found for topic_id: {topic_id}")
            return []
        
        logger.info(f"Found {len(results)} verses for topic: {topic_name}")
        
        # Group consecutive verses into ranges
        grouped_refs = _group_into_ranges(results)
        logger.info(f"Grouped into {len(grouped_refs)} ranges from {len(results)} individual verses")
        
        # Convert to response format
        verses = []
        for group in grouped_refs:
            first_verse = group[0]
            last_verse = group[-1] if len(group) > 1 else first_verse
            is_range = len(group) > 1
            
            # Create display reference string
            if is_range:
                if first_verse["chapter"] == last_verse["chapter"]:
                    # Same chapter range
                    display_ref = f"{first_verse['book_name']} {first_verse['chapter']}:{first_verse['verse_number']}-{last_verse['verse_number']}"
                else:
                    # Cross-chapter range
                    display_ref = f"{first_verse['book_name']} {first_verse['chapter']}:{first_verse['verse_number']}-{last_verse['chapter']}:{last_verse['verse_number']}"
            else:
                display_ref = f"{first_verse['book_name']} {first_verse['chapter']}:{first_verse['verse_number']}"
            
            # Check if all verses in range are memorized
            all_memorized = all(v["is_memorized"] for v in group)
            
            # Use highest topic relevance and sum practice counts
            max_relevance = max(v["topic_relevance"] for v in group)
            total_practice = sum(v["practice_count"] for v in group)
            avg_score = sum(v["confidence_score"] for v in group) / len(group)
            
            verses.append(TopicalVerseResponse(
                verse_id=first_verse["verse_id"],
                verse_code=first_verse["verse_code"],
                book_name=first_verse["book_name"],
                chapter=first_verse["chapter"],
                verse_number=first_verse["verse_number"],
                verse_text=None,  # Will be fetched separately by frontend
                is_memorized=all_memorized,
                practice_count=total_practice,
                confidence_score=avg_score,
                topic_relevance=max_relevance,
                topic_name=topic_name,
                # Range fields
                end_verse_id=last_verse["verse_id"] if is_range else None,
                end_chapter=last_verse["chapter"] if is_range else None,
                end_verse_number=last_verse["verse_number"] if is_range else None,
                is_range=is_range,
                display_reference=display_ref
            ))
        
        # Sort by relevance (highest first)
        verses.sort(key=lambda v: v.topic_relevance, reverse=True)
        
        return verses
        
    except Exception as e:
        logger.error(f"Error querying topical verses: {e}")
        # Fallback to hardcoded data if database query fails
        logger.warning("Falling back to sample verses")
        
    # Fallback: Hardcoded verse references (kept as backup)
    topic_verses = {
        1: [  # Faith
            "58-11-1", "58-11-6", "47-5-7", "45-10-17",  # Heb 11:1, Heb 11:6, 2 Cor 5:7, Rom 10:17
            "41-11-22", "59-2-19", "48-2-20", "45-1-17",  # Mark 11:22, James 2:19, Gal 2:20, Rom 1:17
            "40-17-20", "40-21-21", "41-9-23", "42-17-5",  # Matt 17:20, Matt 21:21, Mark 9:23, Luke 17:5
            "60-1-5", "60-1-7", "60-1-8", "60-1-9"       # 1 Pet 1:5, 1:7, 1:8, 1:9
        ],
        2: [  # Love
            "43-3-16", "62-4-8", "43-13-34", "46-13-13",  # John 3:16, 1 John 4:8, John 13:34, 1 Cor 13:13
            "46-13-4", "46-13-5", "46-13-6", "46-13-7",   # 1 Cor 13:4-7
            "45-13-8", "45-13-9", "45-13-10", "48-5-22",  # Rom 13:8-10, Gal 5:22
            "62-4-19", "62-4-20", "62-4-21", "40-22-37", # 1 John 4:19-21, Matt 22:37
            "40-22-39", "43-15-12", "43-15-13", "49-5-2"  # Matt 22:39, John 15:12-13, Eph 5:2
        ],
        3: [  # Peace
            "43-14-27", "50-4-7", "23-26-3", "40-11-28",  # John 14:27, Phil 4:7, Isa 26:3, Matt 11:28
            "45-5-1", "51-2-14", "45-14-17", "45-15-33",  # Rom 5:1, Col 2:14, Rom 14:17, Rom 15:33
            "19-119-165", "19-29-11", "19-4-8", "23-9-6", # Ps 119:165, Ps 29:11, Ps 4:8, Isa 9:6
            "43-16-33", "49-2-14", "53-5-23", "58-12-14"  # John 16:33, Eph 2:14, 2 Thess 5:23, Heb 12:14
        ],
        4: [  # Strength
            "23-40-31", "50-4-13", "47-12-9", "49-6-10",  # Isa 40:31, Phil 4:13, 2 Cor 12:9, Eph 6:10
            "19-46-1", "19-18-2", "19-27-1", "19-28-7",   # Ps 46:1, Ps 18:2, Ps 27:1, Ps 28:7
            "23-41-10", "23-40-29", "14-31-6", "42-10-27", # Isa 41:10, Isa 40:29, Deut 31:6, Neh 8:10
            "51-1-11", "49-3-16", "55-1-7", "19-73-26"    # Col 1:11, Eph 3:16, 2 Tim 1:7, Ps 73:26
        ],
        5: [  # Wisdom
            "20-3-5", "59-1-5", "20-3-6", "20-3-7",       # Prov 3:5-7, James 1:5
            "20-1-7", "20-2-6", "20-4-7", "20-9-10",      # Prov 1:7, 2:6, 4:7, 9:10
            "46-1-25", "46-1-30", "51-2-3", "51-1-9",     # 1 Cor 1:25, 1:30, Col 2:3, Col 1:9
            "18-28-28", "19-111-10", "21-7-12", "59-3-17" # Job 28:28, Ps 111:10, Ecc 7:12, James 3:17
        ],
        6: [  # Hope
            "24-29-11", "45-15-13", "25-3-25", "19-42-11", # Jer 29:11, Rom 15:13, Lam 3:25, Ps 42:11
            "45-5-5", "45-8-24", "45-8-25", "45-12-12",    # Rom 5:5, 8:24-25, 12:12
            "58-11-1", "58-6-19", "60-1-3", "60-1-21",     # Heb 11:1, 6:19, 1 Pet 1:3, 1:21
            "19-31-24", "19-39-7", "19-62-5", "20-23-18"   # Ps 31:24, 39:7, 62:5, Prov 23:18
        ],
        7: [  # Joy
            "19-16-11", "16-8-10", "50-4-4", "43-15-11",  # Ps 16:11, Neh 8:10, Phil 4:4, John 15:11
            "19-30-5", "19-51-12", "19-126-5", "45-15-13", # Ps 30:5, 51:12, 126:5, Rom 15:13
            "48-5-22", "43-16-22", "43-16-24", "60-1-8",   # Gal 5:22, John 16:22, 16:24, 1 Pet 1:8
            "58-12-2", "59-1-2", "19-5-11", "19-100-1"     # Heb 12:2, James 1:2, Ps 5:11, Ps 100:1
        ],
        8: [  # Prayer
            "52-5-17", "40-6-6", "50-4-6", "42-18-1",     # 1 Thess 5:17, Matt 6:6, Phil 4:6, Luke 18:1
            "40-7-7", "40-21-22", "59-5-16", "62-5-14",   # Matt 7:7, 21:22, James 5:16, 1 John 5:14
            "24-33-3", "19-145-18", "43-14-13", "43-14-14", # Jer 33:3, Ps 145:18, John 14:13-14
            "45-8-26", "49-6-18", "51-4-2", "58-4-16"      # Rom 8:26, Eph 6:18, Col 4:2, Heb 4:16
        ],
        9: [  # Forgiveness
            "49-4-32", "62-1-9", "40-6-14", "40-6-15",    # Eph 4:32, 1 John 1:9, Matt 6:14-15
            "51-3-13", "40-18-21", "40-18-22", "42-6-37",  # Col 3:13, Matt 18:21-22, Luke 6:37
            "44-3-19", "19-103-12", "23-43-25", "23-1-18", # Acts 3:19, Ps 103:12, Isa 43:25, Isa 1:18
            "41-11-25", "42-17-3", "42-17-4", "19-32-5"    # Mark 11:25, Luke 17:3-4, Ps 32:5
        ],
        10: [  # Salvation
            "44-4-12", "49-2-8", "45-10-9", "43-14-6",    # Acts 4:12, Eph 2:8, Rom 10:9, John 14:6
            "45-10-13", "43-3-16", "43-3-17", "43-5-24",  # Rom 10:13, John 3:16-17, John 5:24
            "44-16-31", "56-2-5", "45-6-23", "45-3-23",   # Acts 16:31, Titus 2:5, Rom 6:23, Rom 3:23
            "60-1-5", "60-1-9", "53-2-8", "43-10-28"      # 1 Pet 1:5, 1:9, 2 Thess 2:8, John 10:28
        ]
    }
    
    # Get verse codes for this topic
    verse_codes = topic_verses.get(topic_id, [])[:limit]
    
    if not verse_codes:
        logger.warning(f"No verses found for topic_id: {topic_id}")
        return []
    
    # Query the verses from database
    placeholders = ','.join(['%s'] * len(verse_codes))
    query = f"""
        SELECT
            bv.id as verse_id,
            bv.verse_code,
            bb.book_name,
            bv.chapter_number as chapter,
            bv.verse_number,
            COALESCE(uv.practice_count, 0) as practice_count,
            COALESCE(uv.practice_count > 0, false) as is_memorized,
            COALESCE(uvc.confidence_score, 0.0) as confidence_score,
            bb.book_id
        FROM bible_verses bv
        JOIN bible_books bb ON bv.book_id = bb.book_id
        LEFT JOIN user_verses uv ON bv.id = uv.verse_id AND uv.user_id = %s
        LEFT JOIN user_verse_confidence uvc ON bv.id = uvc.verse_id AND uvc.user_id = %s
        WHERE bv.verse_code IN ({placeholders})
        ORDER BY bb.book_id, bv.chapter_number, bv.verse_number
    """
    
    try:
        params = [user_id, user_id] + verse_codes
        results = db.fetch_all(query, params)
        
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
                verse_text=None,  # Will be fetched by frontend via ESV API
                is_memorized=row["is_memorized"],
                practice_count=row["practice_count"],
                confidence_score=row["confidence_score"],
                topic_relevance=1.0,  # All curated verses are highly relevant
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