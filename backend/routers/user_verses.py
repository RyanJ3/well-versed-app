# backend/routers/user_verses.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime
from database import DatabaseConnection
import db_pool
from book_mapper import normalize_verse_code

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class VerseDetail(BaseModel):
    verse_id: str  # This is the verse_code
    book_id: str
    chapter_number: int
    verse_number: int

class UserVerseResponse(BaseModel):
    verse: VerseDetail
    practice_count: int
    last_practiced: Optional[str]
    created_at: str
    updated_at: Optional[str]

class VerseUpdate(BaseModel):
    practice_count: int
    last_practiced: Optional[str] = None

def get_db():
    """Dependency to get database connection"""
    return DatabaseConnection(db_pool.db_pool)

@router.get("/{user_id}")
async def get_user_verses(user_id: int, db: DatabaseConnection = Depends(get_db)) -> List[UserVerseResponse]:
    """Get all verses memorized by user"""
    logger.info(f"Getting verses for user {user_id}")
    
    query = """
        SELECT 
            bv.verse_code as verse_id,
            bv.book_id,
            bv.chapter_number,
            bv.verse_number,
            uv.practice_count,
            uv.last_practiced::text,
            uv.created_at::text,
            uv.updated_at::text
        FROM user_verses uv
        JOIN bible_verses bv ON uv.verse_id = bv.id
        WHERE uv.user_id = %s
        ORDER BY bv.book_id, bv.chapter_number, bv.verse_number
    """
    
    verses = db.fetch_all(query, (user_id,))
    
    result = []
    for v in verses:
        result.append(UserVerseResponse(
            verse=VerseDetail(
                verse_id=v['verse_id'],
                book_id=v['book_id'],
                chapter_number=v['chapter_number'],
                verse_number=v['verse_number']
            ),
            practice_count=v['practice_count'],
            last_practiced=v['last_practiced'],
            created_at=v['created_at'],
            updated_at=v['updated_at']
        ))
    
    logger.info(f"Found {len(result)} verses for user {user_id}")
    return result

@router.get("/test/verses/{book_id}")
async def test_verses(book_id: str, db: DatabaseConnection = Depends(get_db)):
    """Test endpoint to check verses in database"""
    from book_mapper import BOOK_ID_MAP
    book_id = BOOK_ID_MAP.get(book_id, book_id)
    
    verses = db.fetch_all(
        "SELECT verse_code, chapter_number, verse_number FROM bible_verses WHERE book_id = %s AND chapter_number = 1 LIMIT 10",
        (book_id,)
    )
    return {"book_id": book_id, "verses": verses}

@router.put("/{user_id}/{verse_code:path}")
async def save_verse(
    user_id: int,
    verse_code: str,
    verse_update: VerseUpdate,
    db: DatabaseConnection = Depends(get_db)
):
    """Save or update a memorized verse"""
    # Normalize verse code to database format
    verse_code = normalize_verse_code(verse_code)
    logger.info(f"Saving verse {verse_code} for user {user_id}")
    
    # Get verse ID from verse_code
    verse = db.fetch_one(
        "SELECT id FROM bible_verses WHERE verse_code = %s",
        (verse_code,)
    )
    
    if not verse:
        logger.error(f"Verse {verse_code} not found")
        # Log what verses we DO have for debugging
        similar = db.fetch_all(
            "SELECT verse_code FROM bible_verses WHERE book_id = %s AND chapter_number = %s LIMIT 5",
            (verse_code.split('-')[0], int(verse_code.split('-')[1]))
        )
        logger.error(f"Similar verses: {[v['verse_code'] for v in similar]}")
        raise HTTPException(status_code=404, detail="Verse not found")
    
    verse_id = verse['id']
    
    # Upsert user verse
    query = """
        INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (user_id, verse_id) 
        DO UPDATE SET
            practice_count = EXCLUDED.practice_count,
            last_practiced = EXCLUDED.last_practiced,
            updated_at = CURRENT_TIMESTAMP
    """
    
    db.execute(query, (
        user_id,
        verse_id,
        verse_update.practice_count,
        verse_update.last_practiced or datetime.now().isoformat()
    ))
    
    logger.info(f"Verse {verse_code} saved for user {user_id}")
    return {"message": "Verse saved successfully"}

@router.delete("/{user_id}/{verse_code:path}")
async def delete_verse(
    user_id: int,
    verse_code: str,
    db: DatabaseConnection = Depends(get_db)
):
    """Delete a memorized verse"""
    # Normalize verse code to database format
    verse_code = normalize_verse_code(verse_code)
    logger.info(f"Deleting verse {verse_code} for user {user_id}")
    
    # Get verse ID from verse_code
    verse = db.fetch_one(
        "SELECT id FROM bible_verses WHERE verse_code = %s",
        (verse_code,)
    )
    
    if verse:
        query = "DELETE FROM user_verses WHERE user_id = %s AND verse_id = %s"
        db.execute(query, (user_id, verse['id']))
        logger.info(f"Verse {verse_code} deleted for user {user_id}")
    
    return {"message": "Verse deleted successfully"}

@router.post("/{user_id}/chapters/{book_id}/{chapter_num}")
async def save_chapter(
    user_id: int,
    book_id: str,
    chapter_num: int,
    db: DatabaseConnection = Depends(get_db)
):
    """Mark entire chapter as memorized"""
    # Map 3-char to 4-char book ID
    from book_mapper import BOOK_ID_MAP
    book_id = BOOK_ID_MAP.get(book_id, book_id)
    
    logger.info(f"Saving chapter {book_id} {chapter_num} for user {user_id}")
    
    # Get all verses in chapter
    verses = db.fetch_all(
        "SELECT id FROM bible_verses WHERE book_id = %s AND chapter_number = %s",
        (book_id, chapter_num)
    )
    
    if not verses:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Insert all verses
    params_list = [
        (user_id, v['id'], 1, datetime.now().isoformat())
        for v in verses
    ]
    
    query = """
        INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (user_id, verse_id) DO UPDATE SET
            practice_count = EXCLUDED.practice_count,
            last_practiced = EXCLUDED.last_practiced
    """
    
    db.execute_many(query, params_list)
    
    logger.info(f"Saved {len(verses)} verses for chapter {book_id} {chapter_num}")
    return {"message": f"Chapter saved successfully", "verses_count": len(verses)}

@router.delete("/{user_id}/chapters/{book_id}/{chapter_num}")
async def clear_chapter(
    user_id: int,
    book_id: str,
    chapter_num: int,
    db: DatabaseConnection = Depends(get_db)
):
    """Clear all memorized verses in a chapter"""
    # Map 3-char to 4-char book ID
    from book_mapper import BOOK_ID_MAP
    book_id = BOOK_ID_MAP.get(book_id, book_id)
    
    logger.info(f"Clearing chapter {book_id} {chapter_num} for user {user_id}")
    
    query = """
        DELETE FROM user_verses 
        WHERE user_id = %s 
        AND verse_id IN (
            SELECT id FROM bible_verses 
            WHERE book_id = %s AND chapter_number = %s
        )
    """
    
    db.execute(query, (user_id, book_id, chapter_num))
    logger.info(f"Cleared chapter {book_id} {chapter_num} for user {user_id}")
    return {"message": "Chapter cleared successfully"}

@router.post("/{user_id}/books/{book_id}")
async def save_book(
    user_id: int,
    book_id: str,
    db: DatabaseConnection = Depends(get_db)
):
    """Mark entire book as memorized"""
    # Map 3-char to 4-char book ID
    from book_mapper import BOOK_ID_MAP
    book_id = BOOK_ID_MAP.get(book_id, book_id)
    
    logger.info(f"Saving book {book_id} for user {user_id}")
    
    # Get all verses in book
    verses = db.fetch_all(
        "SELECT id FROM bible_verses WHERE book_id = %s",
        (book_id,)
    )
    
    if not verses:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Insert all verses
    params_list = [
        (user_id, v['id'], 1, datetime.now().isoformat())
        for v in verses
    ]
    
    query = """
        INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (user_id, verse_id) DO UPDATE SET
            practice_count = EXCLUDED.practice_count,
            last_practiced = EXCLUDED.last_practiced
    """
    
    db.execute_many(query, params_list)
    
    logger.info(f"Saved {len(verses)} verses for book {book_id}")
    return {"message": f"Book saved successfully", "verses_count": len(verses)}

@router.delete("/{user_id}/books/{book_id}")
async def clear_book(
    user_id: int,
    book_id: str,
    db: DatabaseConnection = Depends(get_db)
):
    """Clear all memorized verses in a book"""
    # Map 3-char to 4-char book ID
    from book_mapper import BOOK_ID_MAP
    book_id = BOOK_ID_MAP.get(book_id, book_id)
    
    logger.info(f"Clearing book {book_id} for user {user_id}")
    
    query = """
        DELETE FROM user_verses 
        WHERE user_id = %s 
        AND verse_id IN (
            SELECT id FROM bible_verses 
            WHERE book_id = %s
        )
    """
    
    db.execute(query, (user_id, book_id))
    logger.info(f"Cleared book {book_id} for user {user_id}")
    return {"message": "Book cleared successfully"}

@router.get("/test/verses/{book_id}")
async def test_verses(book_id: str, db: DatabaseConnection = Depends(get_db)):
    """Test endpoint to check verses in database"""
    from book_mapper import BOOK_ID_MAP
    book_id = BOOK_ID_MAP.get(book_id, book_id)
    
    verses = db.fetch_all(
        "SELECT verse_code, chapter_number, verse_number FROM bible_verses WHERE book_id = %s AND chapter_number = 1 LIMIT 10",
        (book_id,)
    )
    return {"book_id": book_id, "verses": verses}