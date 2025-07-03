# backend/routers/user_verses.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging
from datetime import datetime
from database import DatabaseConnection
import db_pool

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class VerseDetail(BaseModel):
    verse_id: str  # This is the verse_code (e.g., "40-1-1" for Matthew 1:1)
    book_id: int   # Numerical book ID
    chapter_number: int
    verse_number: int
    isApocryphal: bool = False

class UserVerseResponse(BaseModel):
    verse: VerseDetail
    practice_count: int
    last_practiced: Optional[str]
    created_at: str
    updated_at: Optional[str]

class VerseUpdate(BaseModel):
    practice_count: int
    last_practiced: Optional[str] = None

class VerseTextsRequest(BaseModel):
    verse_codes: List[str]
    bible_id: Optional[str] = None

def get_db():
    """Dependency to get database connection"""
    return DatabaseConnection(db_pool.db_pool)

@router.get("/{user_id}")
async def get_user_verses(user_id: int, include_apocrypha: bool = False, db: DatabaseConnection = Depends(get_db)) -> List[UserVerseResponse]:
    """Get all verses memorized by user"""
    logger.info(f"Getting verses for user {user_id}, include_apocrypha={include_apocrypha}")
    
    # Build query based on apocrypha preference
    query = """
        SELECT 
            bv.verse_code as verse_id,
            bv.book_id,
            bv.chapter_number,
            bv.verse_number,
            bv.is_apocryphal,
            uv.practice_count,
            uv.last_practiced::text,
            uv.created_at::text,
            uv.updated_at::text
        FROM user_verses uv
        JOIN bible_verses bv ON uv.verse_id = bv.id
        WHERE uv.user_id = %s
    """
    
    # Add filter if not including apocrypha
    if not include_apocrypha:
        query += " AND bv.is_apocryphal = FALSE"
    
    query += " ORDER BY bv.book_id, bv.chapter_number, bv.verse_number"
    
    verses = db.fetch_all(query, (user_id,))
    
    result = []
    for v in verses:
        result.append(UserVerseResponse(
            verse=VerseDetail(
                verse_id=v['verse_id'],
                book_id=v['book_id'],
                chapter_number=v['chapter_number'],
                verse_number=v['verse_number'],
                isApocryphal=v.get('is_apocryphal', False)
            ),
            practice_count=v['practice_count'],
            last_practiced=v['last_practiced'],
            created_at=v['created_at'],
            updated_at=v['updated_at']
        ))
    
    logger.info(f"Found {len(result)} verses for user {user_id}")
    return result

@router.put("/{user_id}/{book_id:int}/{chapter_num:int}/{verse_num:int}")
async def save_verse(
    user_id: int,
    book_id: int,
    chapter_num: int,
    verse_num: int,
    verse_update: VerseUpdate,
    db: DatabaseConnection = Depends(get_db)
):
    """Save or update a memorized verse using numerical IDs"""
    verse_code = f"{book_id}-{chapter_num}-{verse_num}"
    logger.info(f"Saving verse {verse_code} for user {user_id}")
    
    # Get verse ID from verse_code
    verse = db.fetch_one(
        "SELECT id FROM bible_verses WHERE verse_code = %s",
        (verse_code,)
    )
    
    if not verse:
        logger.error(f"Verse {verse_code} not found")
        raise HTTPException(status_code=404, detail=f"Verse {verse_code} not found")
    
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

@router.delete("/{user_id}/{book_id:int}/{chapter_num:int}/{verse_num:int}")
async def delete_verse(
    user_id: int,
    book_id: int,
    chapter_num: int,
    verse_num: int,
    db: DatabaseConnection = Depends(get_db)
):
    """Delete a memorized verse using numerical IDs"""
    verse_code = f"{book_id}-{chapter_num}-{verse_num}"
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

@router.post("/{user_id}/chapters/{book_id:int}/{chapter_num}")
async def save_chapter(
    user_id: int,
    book_id: int,
    chapter_num: int,
    db: DatabaseConnection = Depends(get_db)
):
    """Mark entire chapter as memorized"""
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
            last_practiced = EXCLUDED.last_practiced,
            updated_at = CURRENT_TIMESTAMP
    """
    
    db.execute_many(query, params_list)
    
    logger.info(f"Saved {len(verses)} verses for chapter {book_id} {chapter_num}")
    return {"message": f"Chapter saved successfully", "verses_count": len(verses)}

@router.delete("/{user_id}/chapters/{book_id:int}/{chapter_num}")
async def clear_chapter(
    user_id: int,
    book_id: int,
    chapter_num: int,
    db: DatabaseConnection = Depends(get_db)
):
    """Clear all memorized verses in a chapter"""
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

@router.post("/{user_id}/books/{book_id:int}")
async def save_book(
    user_id: int,
    book_id: int,
    db: DatabaseConnection = Depends(get_db)
):
    """Mark entire book as memorized"""
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
            last_practiced = EXCLUDED.last_practiced,
            updated_at = CURRENT_TIMESTAMP
    """
    
    db.execute_many(query, params_list)
    
    logger.info(f"Saved {len(verses)} verses for book {book_id}")
    return {"message": f"Book saved successfully", "verses_count": len(verses)}

@router.delete("/{user_id}/books/{book_id:int}")
async def clear_book(
    user_id: int,
    book_id: int,
    db: DatabaseConnection = Depends(get_db)
):
    """Clear all memorized verses in a book"""
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

@router.post("/{user_id}/verses/texts")
async def get_verse_texts(
    user_id: int,
    request: VerseTextsRequest,
    db: DatabaseConnection = Depends(get_db)
) -> Dict[str, str]:
    """Get verse texts using the user's preferred provider"""
    from services.api_bible import APIBibleService
    from services.esv_api import ESVService, ESVRateLimitError
    from config import Config

    verse_codes = request.verse_codes
    bible_id = request.bible_id or Config.DEFAULT_BIBLE_ID

    logger.info(
        f"Getting texts for {len(verse_codes)} verses for user {user_id}"
    )

    # Determine provider from user settings
    user_pref = db.fetch_one(
        "SELECT use_esv_api, esv_api_token FROM users WHERE user_id = %s",
        (user_id,),
    )
    use_esv = user_pref.get("use_esv_api") if user_pref else False
    esv_token = user_pref.get("esv_api_token") if user_pref else None

    try:
        if use_esv and esv_token:
            logger.info("Using ESV API for verse texts")
            # Get verse references
            refs_query = """
                SELECT bv.verse_code, bb.book_name, bv.chapter_number, bv.verse_number
                FROM bible_verses bv
                JOIN bible_books bb ON bv.book_id = bb.book_id
                WHERE bv.verse_code = ANY(%s)
            """
            refs = db.fetch_all(refs_query, (verse_codes,))
            ref_map = {
                r["verse_code"]: f"{r['book_name']} {r['chapter_number']}:{r['verse_number']}"
                for r in refs
            }

            esv = ESVService(esv_token)
            verse_texts = esv.get_verses_batch(ref_map)
        else:
            logger.info("Using API.Bible for verse texts")
            api_bible = APIBibleService(Config.API_BIBLE_KEY, bible_id)
            verse_texts = api_bible.get_verses_batch(verse_codes, bible_id)

        logger.info(f"Successfully retrieved {len(verse_texts)} verse texts")
        # Ensure all requested codes are present
        return {code: verse_texts.get(code, "") for code in verse_codes}

    except ESVRateLimitError as e:
        logger.warning(f"ESV API rate limited for {e.wait_seconds} seconds")
        raise HTTPException(status_code=429, detail={"wait_seconds": e.wait_seconds})
    except Exception as e:
        logger.error(f"Error getting verse texts: {e}")
        return {code: "" for code in verse_codes}

class ConfidenceUpdate(BaseModel):
    confidence_score: int
    last_reviewed: Optional[str] = None


@router.put("/confidence/{user_id}/{verse_id}")
async def update_confidence(
    user_id: int,
    verse_id: int,
    update: ConfidenceUpdate,
    db: DatabaseConnection = Depends(get_db),
):
    """Update a user's confidence score for a verse."""
    logger.info(
        f"Updating confidence for user {user_id}, verse {verse_id} to {update.confidence_score}"
    )

    query = """
        INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, last_reviewed)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (user_id, verse_id)
        DO UPDATE SET
            confidence_score = EXCLUDED.confidence_score,
            last_reviewed = EXCLUDED.last_reviewed,
            review_count = user_verse_confidence.review_count + 1
    """

    db.execute(
        query,
        (
            user_id,
            verse_id,
            update.confidence_score,
            update.last_reviewed or datetime.now().isoformat(),
        ),
    )

    return {"message": "Confidence updated"}


@router.delete("/{user_id}")
async def clear_user_memorization(
    user_id: int, db: DatabaseConnection = Depends(get_db)
) -> dict:
    """Remove all memorization data for a user."""
    logger.info(f"Clearing memorization data for user {user_id}")

    try:
        db.execute("DELETE FROM user_verse_confidence WHERE user_id = %s", (user_id,))
        db.execute("DELETE FROM user_verses WHERE user_id = %s", (user_id,))
        logger.info(f"Memorization data cleared for user {user_id}")
        return {"message": "Memorization data cleared"}
    except Exception as e:
        logger.error(f"Failed to clear data for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear memorization data")

