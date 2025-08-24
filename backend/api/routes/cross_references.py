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
    # For verse ranges
    end_verse_id: Optional[int] = None
    end_chapter: Optional[int] = None
    end_verse_number: Optional[int] = None
    is_range: bool = False
    display_reference: Optional[str] = None


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
                bb.book_id,
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
                bb.book_id,
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
        ORDER BY cr.direction, cr.book_id, cr.chapter, cr.verse_number
    """
    
    results = db.fetch_all(query, (verse_id, verse_id, user_id, user_id))
    
    logger.info(f"Found {len(results)} cross-references for verse_id {verse_id}")
    
    # Group consecutive verses into ranges
    grouped_refs = _group_into_ranges(results)
    logger.info(f"Grouped into {len(grouped_refs)} ranges from {len(results)} individual verses")
    
    # Convert to response format
    cross_refs = []
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
            logger.debug(f"Created range: {display_ref} from {len(group)} verses")
        else:
            display_ref = f"{first_verse['book_name']} {first_verse['chapter']}:{first_verse['verse_number']}"
        
        # Check if all verses in range are memorized
        all_memorized = all(v["is_memorized"] for v in group)
        
        # Use highest confidence and sum practice counts
        max_confidence = max(v["cross_ref_confidence"] for v in group)
        total_practice = sum(v["practice_count"] for v in group)
        avg_score = sum(v["confidence_score"] for v in group) / len(group)
        
        cross_refs.append(CrossReferenceResponse(
            verse_id=first_verse["verse_id"],
            verse_code=first_verse["verse_code"],
            book_name=first_verse["book_name"],
            chapter=first_verse["chapter"],
            verse_number=first_verse["verse_number"],
            verse_text=None,  # Will be fetched separately by frontend
            is_memorized=all_memorized,
            practice_count=total_practice,
            confidence_score=avg_score,
            cross_ref_confidence=max_confidence,
            direction=first_verse["direction"],
            # Range fields
            end_verse_id=last_verse["verse_id"] if is_range else None,
            end_chapter=last_verse["chapter"] if is_range else None,
            end_verse_number=last_verse["verse_number"] if is_range else None,
            is_range=is_range,
            display_reference=display_ref
        ))
    
    return cross_refs


def _group_into_ranges(verses: List[dict]) -> List[List[dict]]:
    """Group consecutive verses into ranges"""
    if not verses:
        return []
    
    # Log input for debugging
    logger.info(f"Grouping {len(verses)} verses into ranges")
    if len(verses) > 0:
        first_verses = [f"{v['book_name']} {v['chapter']}:{v['verse_number']}" for v in verses[:5]]
        logger.info(f"First few verses: {first_verses}")
    
    grouped = []
    current_group = [verses[0]]
    
    for i in range(1, len(verses)):
        prev = verses[i - 1]
        curr = verses[i]
        
        # Log each comparison for debugging
        prev_ref = f"{prev['book_name']} {prev['chapter']}:{prev['verse_number']}"
        curr_ref = f"{curr['book_name']} {curr['chapter']}:{curr['verse_number']}"
        logger.debug(f"Comparing {prev_ref} with {curr_ref}")
        
        # Check if verses are consecutive (same book and direction)
        same_book = prev["book_id"] == curr["book_id"]
        same_direction = prev["direction"] == curr["direction"]
        
        # Check if consecutive within chapter
        same_chapter = prev["chapter"] == curr["chapter"]
        consecutive_in_chapter = same_chapter and curr["verse_number"] == prev["verse_number"] + 1
        
        logger.debug(f"  same_book={same_book}, same_direction={same_direction}, same_chapter={same_chapter}, consecutive={consecutive_in_chapter}")
        
        if same_book and same_direction and consecutive_in_chapter:
            # Add to current group for consecutive verses in same chapter
            logger.debug(f"  -> Adding to current group")
            current_group.append(curr)
        else:
            # Start new group
            logger.debug(f"  -> Starting new group")
            grouped.append(current_group)
            current_group = [curr]
    
    # Add the last group
    if current_group:
        grouped.append(current_group)
    
    # Log grouping results
    logger.info(f"Created {len(grouped)} groups")
    for i, group in enumerate(grouped[:5]):  # Log first 5 groups
        if len(group) > 1:
            range_ref = f"{group[0]['book_name']} {group[0]['chapter']}:{group[0]['verse_number']}-{group[-1]['verse_number']}"
            logger.info(f"  Group {i}: {range_ref} ({len(group)} verses)")
        else:
            single_ref = f"{group[0]['book_name']} {group[0]['chapter']}:{group[0]['verse_number']}"
            logger.info(f"  Group {i}: {single_ref} (single verse)")
    
    # Sort groups by the highest confidence score in each group (highest first)
    grouped.sort(key=lambda g: max(v["cross_ref_confidence"] for v in g), reverse=True)
    
    return grouped


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