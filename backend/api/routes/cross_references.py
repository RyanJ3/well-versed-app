"""Cross-references API routes"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from core.dependencies import get_db
from database import DatabaseConnection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/verses", tags=["cross-references"])


class CrossReferenceResponse(BaseModel):
    verse_id: int
    verse_code: str
    book_name: str
    chapter: int
    verse_number: int
    verse_text: Optional[str] = None
    is_memorized: bool = False
    practice_count: int = 0
    confidence_score: float = 0.0
    cross_ref_confidence: float = 0.0
    direction: str  # 'from' or 'to'


def get_current_user_id() -> int:
    """Placeholder for auth"""
    return 1


@router.get("/lookup")
def lookup_verse(
    book_id: int = Query(...),
    chapter: int = Query(...),
    verse: int = Query(...),
    db: DatabaseConnection = Depends(get_db),
):
    """Look up a verse by book, chapter, and verse number"""
    query = """
        SELECT id, verse_code, book_id, chapter_number, verse_number
        FROM bible_verses
        WHERE book_id = %s AND chapter_number = %s AND verse_number = %s
    """
    result = db.fetch_one(query, (book_id, chapter, verse))
    if not result:
        raise HTTPException(status_code=404, detail="Verse not found")
    return result


@router.get("/{verse_id}/cross-references", response_model=List[CrossReferenceResponse])
def get_cross_references(
    verse_id: int,
    user_id: int = Depends(get_current_user_id),
    db: DatabaseConnection = Depends(get_db),
):
    """Get cross-references for a specific verse"""
    logger.info(f"Getting cross-references for verse_id: {verse_id}")
    
    # Get both "from" and "to" references
    query = """
        WITH cross_refs AS (
            -- References FROM this verse (this verse references others)
            SELECT 
                bv.id as verse_id,
                bv.verse_code,
                bb.book_name,
                bv.chapter_number as chapter,
                bv.verse_number,
                cr.confidence_score as cross_ref_confidence,
                'to' as direction
            FROM cross_references cr
            JOIN bible_verses bv ON cr.to_verse_id = bv.id
            JOIN bible_books bb ON bv.book_id = bb.book_id
            WHERE cr.from_verse_id = %s
            
            UNION ALL
            
            -- References TO this verse (other verses reference this one)
            SELECT 
                bv.id as verse_id,
                bv.verse_code,
                bb.book_name,
                bv.chapter_number as chapter,
                bv.verse_number,
                cr.confidence_score as cross_ref_confidence,
                'from' as direction
            FROM cross_references cr
            JOIN bible_verses bv ON cr.from_verse_id = bv.id
            JOIN bible_books bb ON bv.book_id = bb.book_id
            WHERE cr.to_verse_id = %s
        )
        SELECT DISTINCT
            cr.*,
            COALESCE(uv.practice_count, 0) as practice_count,
            COALESCE(uv.practice_count > 0, false) as is_memorized,
            COALESCE(uvc.confidence_score, 0.0) as confidence_score
        FROM cross_refs cr
        LEFT JOIN user_verses uv ON cr.verse_id = uv.verse_id AND uv.user_id = %s
        LEFT JOIN user_verse_confidence uvc ON cr.verse_id = uvc.verse_id AND uvc.user_id = %s
        ORDER BY cr.cross_ref_confidence DESC, cr.book_name, cr.chapter, cr.verse_number
    """
    
    results = db.fetch_all(query, (verse_id, verse_id, user_id, user_id))
    
    logger.info(f"Found {len(results)} cross-references for verse_id {verse_id}")
    
    # Convert to response format
    cross_refs = []
    for row in results:
        cross_refs.append(CrossReferenceResponse(
            verse_id=row["verse_id"],
            verse_code=row["verse_code"],
            book_name=row["book_name"],
            chapter=row["chapter"],
            verse_number=row["verse_number"],
            is_memorized=row["is_memorized"],
            practice_count=row["practice_count"],
            confidence_score=row["confidence_score"],
            cross_ref_confidence=row["cross_ref_confidence"],
            direction=row["direction"]
        ))
    
    return cross_refs


@router.get("/cross-references/by-reference", response_model=List[CrossReferenceResponse])
def get_cross_references_by_reference(
    book_id: int = Query(...),
    chapter: int = Query(...),
    verse: int = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: DatabaseConnection = Depends(get_db),
):
    """Get cross-references by book, chapter, and verse"""
    # First look up the verse
    verse_query = """
        SELECT id FROM bible_verses
        WHERE book_id = %s AND chapter_number = %s AND verse_number = %s
    """
    verse_result = db.fetch_one(verse_query, (book_id, chapter, verse))
    
    if not verse_result:
        logger.warning(f"Verse not found: book_id={book_id}, chapter={chapter}, verse={verse}")
        return []
    
    # Get cross-references for this verse
    return get_cross_references(verse_result["id"], user_id, db)