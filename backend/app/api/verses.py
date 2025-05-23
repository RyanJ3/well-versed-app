from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List
from app import models, schemas
from app.database import get_db
from datetime import datetime

router = APIRouter()

def get_book_by_code(db: Session, book_code: str) -> models.Book:
    """Get book by code with alias support"""
    # Book code aliases mapping
    aliases = {
        '1SAM': '1SA', '2SAM': '2SA', '1KIN': '1KI', '2KIN': '2KI',
        '1CHR': '1CH', '2CHR': '2CH', '1COR': '1CO', '2COR': '2CO',
        '1THE': '1TH', '2THE': '2TH', '1TIM': '1TI', '2TIM': '2TI',
        '1PET': '1PE', '2PET': '2PE', '1JOH': '1JN', '2JOH': '2JN',
        '3JOH': '3JN', '1MAC': '1MA', '2MAC': '2MA', '3MAC': '3MA',
        '1ESD': '1ES', 'JOEL': 'JOL', 'JUDG': 'JDG', 'PHIL': 'PHP',
        'PROV': 'PRO', 'SONG': 'SOS', 'JUDE': 'JDE'
    }
    
    # Try direct lookup first
    book = db.query(models.Book).filter(models.Book.book_code == book_code).first()
    
    # If not found, try alias
    if not book and book_code in aliases:
        book = db.query(models.Book).filter(models.Book.book_code == aliases[book_code]).first()
    
    if not book:
        raise HTTPException(status_code=404, detail=f"Book {book_code} not found")
    return book

def expand_ranges_to_verses(ranges: List[models.UserVerseRange], include_apocrypha: bool, db: Session) -> List[dict]:
    """Convert verse ranges to individual verses for API compatibility"""
    result = []
    
    for range_obj in ranges:
        # Get apocryphal content for this book/chapters
        apocryphal_content = db.query(models.ApocryphalContent).filter(
            and_(
                models.ApocryphalContent.book_id == range_obj.book_id,
                models.ApocryphalContent.chapter_number >= range_obj.chapter_start,
                models.ApocryphalContent.chapter_number <= range_obj.chapter_end
            )
        ).all()
        
        # Expand range to individual verses
        for chapter_num in range(range_obj.chapter_start, range_obj.chapter_end + 1):
            # Get verse bounds for this chapter
            if chapter_num == range_obj.chapter_start:
                start_verse = range_obj.verse_start
            else:
                start_verse = 1
                
            if chapter_num == range_obj.chapter_end:
                end_verse = range_obj.verse_end
            else:
                # Get total verses in chapter
                chapter_info = db.query(models.ChapterVerseCount).filter(
                    models.ChapterVerseCount.book_id == range_obj.book_id,
                    models.ChapterVerseCount.chapter_number == chapter_num
                ).first()
                end_verse = chapter_info.verse_count if chapter_info else 176  # fallback
            
            # Check for apocryphal content in this chapter
            chapter_apocrypha = [ac for ac in apocryphal_content if ac.chapter_number == chapter_num]
            
            # Generate verses
            for verse_num in range(start_verse, end_verse + 1):
                # Check if verse is apocryphal
                is_apocryphal = any(
                    (ac.verse_start is None) or  # Entire chapter
                    (ac.verse_start <= verse_num <= ac.verse_end)
                    for ac in chapter_apocrypha
                )
                
                # Skip if apocryphal and not included
                if is_apocryphal and not include_apocrypha:
                    continue
                
                verse_id = f"{range_obj.book.book_code}-{chapter_num}-{verse_num}"
                
                result.append({
                    "verse": {
                        "verse_id": verse_id,
                        "book_id": range_obj.book.book_code,
                        "chapter_number": chapter_num,
                        "verse_number": verse_num,
                        "isApocryphal": is_apocryphal
                    },
                    "practice_count": 1,
                    "last_practiced": range_obj.updated_at,
                    "created_at": range_obj.created_at,
                    "updated_at": range_obj.updated_at
                })
    
    return result

@router.get("/{user_id}")
def get_user_verses(user_id: int, include_apocrypha: bool = False, db: Session = Depends(get_db)):
    """Get all verses memorized by a user"""
    # Check user exists
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get verse ranges
    verse_ranges = db.query(models.UserVerseRange).filter(
        models.UserVerseRange.user_id == user_id
    ).all()
    
    # Convert to individual verses
    return expand_ranges_to_verses(verse_ranges, include_apocrypha, db)

@router.put("/{user_id}/{verse_id}")
def update_user_verse(user_id: int, verse_id: str, verse_data: schemas.UserVerseUpdate, db: Session = Depends(get_db)):
    """Add or update a single verse"""
    # Parse verse_id
    parts = verse_id.split('-')
    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="Invalid verse_id format")
    
    book_code, chapter_str, verse_str = parts
    book = get_book_by_code(db, book_code)
    chapter = int(chapter_str)
    verse = int(verse_str)
    
    # Check if verse already exists in a range
    existing = db.query(models.UserVerseRange).filter(
        and_(
            models.UserVerseRange.user_id == user_id,
            models.UserVerseRange.book_id == book.book_id,
            models.UserVerseRange.chapter_start <= chapter,
            models.UserVerseRange.chapter_end >= chapter
        )
    ).all()
    
    # Filter to ranges that contain this verse
    containing_ranges = []
    for r in existing:
        if r.chapter_start == r.chapter_end == chapter:
            if r.verse_start <= verse <= r.verse_end:
                containing_ranges.append(r)
        elif r.chapter_start == chapter and verse >= r.verse_start:
            containing_ranges.append(r)
        elif r.chapter_end == chapter and verse <= r.verse_end:
            containing_ranges.append(r)
        elif r.chapter_start < chapter < r.chapter_end:
            containing_ranges.append(r)
    
    if not containing_ranges:
        # Create new single-verse range
        new_range = models.UserVerseRange(
            user_id=user_id,
            book_id=book.book_id,
            chapter_start=chapter,
            verse_start=verse,
            chapter_end=chapter,
            verse_end=verse
        )
        db.add(new_range)
        db.commit()
    
    return {"status": "success", "message": f"Verse {verse_id} updated successfully"}

@router.delete("/{user_id}/{verse_id}")
def delete_user_verse(user_id: int, verse_id: str, db: Session = Depends(get_db)):
    """Remove a single verse"""
    parts = verse_id.split('-')
    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="Invalid verse_id format")
    
    book_code, chapter_str, verse_str = parts
    book = get_book_by_code(db, book_code)
    chapter = int(chapter_str)
    verse = int(verse_str)
    
    # Find containing range
    ranges = db.query(models.UserVerseRange).filter(
        and_(
            models.UserVerseRange.user_id == user_id,
            models.UserVerseRange.book_id == book.book_id
        )
    ).all()
    
    for r in ranges:
        # Check if this range contains the verse
        contains_verse = False
        if r.chapter_start == r.chapter_end == chapter:
            contains_verse = r.verse_start <= verse <= r.verse_end
        elif r.chapter_start == chapter:
            contains_verse = verse >= r.verse_start
        elif r.chapter_end == chapter:
            contains_verse = verse <= r.verse_end
        elif r.chapter_start < chapter < r.chapter_end:
            contains_verse = True
            
        if contains_verse:
            # Handle different split scenarios
            if r.chapter_start == r.chapter_end == chapter:
                if r.verse_start == verse and r.verse_end == verse:
                    # Single verse, delete range
                    db.delete(r)
                elif r.verse_start == verse:
                    # First verse, adjust start
                    r.verse_start = verse + 1
                elif r.verse_end == verse:
                    # Last verse, adjust end
                    r.verse_end = verse - 1
                else:
                    # Middle verse, split range
                    new_range = models.UserVerseRange(
                        user_id=user_id,
                        book_id=book.book_id,
                        chapter_start=chapter,
                        verse_start=verse + 1,
                        chapter_end=chapter,
                        verse_end=r.verse_end
                    )
                    r.verse_end = verse - 1
                    db.add(new_range)
            # Handle cross-chapter ranges (simplified)
            else:
                # Complex split logic would go here
                pass
                
    db.commit()
    return {"status": "success", "message": f"Verse {verse_id} deleted successfully"}

@router.post("/{user_id}/chapters/{book_id}/{chapter_number}")
def save_chapter_verses(user_id: int, book_id: str, chapter_number: int, db: Session = Depends(get_db)):
    """Save entire chapter as memorized"""
    book = get_book_by_code(db, book_id)
    
    # Get verse count for chapter
    chapter_info = db.query(models.ChapterVerseCount).filter(
        models.ChapterVerseCount.book_id == book.book_id,
        models.ChapterVerseCount.chapter_number == chapter_number
    ).first()
    
    if not chapter_info:
        raise HTTPException(status_code=404, detail=f"Chapter {chapter_number} not found in {book_id}")
    
    # Check for existing range
    existing = db.query(models.UserVerseRange).filter(
        and_(
            models.UserVerseRange.user_id == user_id,
            models.UserVerseRange.book_id == book.book_id,
            models.UserVerseRange.chapter_start == chapter_number,
            models.UserVerseRange.chapter_end == chapter_number,
            models.UserVerseRange.verse_start == 1,
            models.UserVerseRange.verse_end == chapter_info.verse_count
        )
    ).first()
    
    if not existing:
        new_range = models.UserVerseRange(
            user_id=user_id,
            book_id=book.book_id,
            chapter_start=chapter_number,
            verse_start=1,
            chapter_end=chapter_number,
            verse_end=chapter_info.verse_count
        )
        db.add(new_range)
        db.commit()
    
    return {"status": "success", "message": f"Saved {chapter_info.verse_count} verses in {book_id} chapter {chapter_number}"}

@router.delete("/{user_id}/chapters/{book_id}/{chapter_number}")
def clear_chapter_verses(user_id: int, book_id: str, chapter_number: int, db: Session = Depends(get_db)):
    """Clear all verses in a chapter"""
    book = get_book_by_code(db, book_id)
    
    # FIXED: Only delete ranges that overlap with this specific chapter
    deleted = db.query(models.UserVerseRange).filter(
        and_(
            models.UserVerseRange.user_id == user_id,
            models.UserVerseRange.book_id == book.book_id,
            # Chapter range overlaps with target chapter
            models.UserVerseRange.chapter_start <= chapter_number,
            models.UserVerseRange.chapter_end >= chapter_number
        )
    ).all()
    
    # Handle partial range deletions
    for range_obj in deleted:
        if range_obj.chapter_start == range_obj.chapter_end == chapter_number:
            # Single chapter range - delete completely
            db.delete(range_obj)
        elif range_obj.chapter_start < chapter_number < range_obj.chapter_end:
            # Split multi-chapter range
            # Keep first part, create second part
            new_range = models.UserVerseRange(
                user_id=user_id,
                book_id=book.book_id,
                chapter_start=chapter_number + 1,
                verse_start=1,
                chapter_end=range_obj.chapter_end,
                verse_end=range_obj.verse_end
            )
            range_obj.chapter_end = chapter_number - 1
            db.add(new_range)
        elif range_obj.chapter_start == chapter_number:
            # Starts at target chapter
            range_obj.chapter_start = chapter_number + 1
            range_obj.verse_start = 1
        elif range_obj.chapter_end == chapter_number:
            # Ends at target chapter
            range_obj.chapter_end = chapter_number - 1
    
    db.commit()
    return {"status": "success", "message": f"Cleared verses from {book_id} chapter {chapter_number}"}

@router.post("/{user_id}/books/{book_id}")
def save_book_verses(user_id: int, book_id: str, db: Session = Depends(get_db)):
    """Save all verses in a book as memorized"""
    print(f"Saving book: {book_id} for user: {user_id}")  # Debug log
    
    book = get_book_by_code(db, book_id)
    print(f"Found book: {book.book_name} (ID: {book.book_id})")  # Debug log
    
    # Get all chapters for book
    chapters = db.query(models.ChapterVerseCount).filter(
        models.ChapterVerseCount.book_id == book.book_id
    ).order_by(models.ChapterVerseCount.chapter_number).all()
    
    print(f"Found {len(chapters)} chapters for {book.book_name}")  # Debug log
    
    if not chapters:
        print(f"ERROR: No chapters found for book {book_id}")  # Debug log
        raise HTTPException(status_code=404, detail=f"No chapters found for book {book_id}")
    
    # Log chapter info
    for ch in chapters[:3]:  # Log first 3 chapters
        print(f"Chapter {ch.chapter_number}: {ch.verse_count} verses")
    
    # Delete existing ranges for this book
    deleted_count = db.query(models.UserVerseRange).filter(
        and_(
            models.UserVerseRange.user_id == user_id,
            models.UserVerseRange.book_id == book.book_id
        )
    ).delete()
    
    print(f"Deleted {deleted_count} existing ranges")  # Debug log
    
    # Create new range for entire book
    first_chapter = chapters[0]
    last_chapter = chapters[-1]
    
    print(f"Creating range: Ch{first_chapter.chapter_number}:1 to Ch{last_chapter.chapter_number}:{last_chapter.verse_count}")
    
    new_range = models.UserVerseRange(
        user_id=user_id,
        book_id=book.book_id,
        chapter_start=first_chapter.chapter_number,
        verse_start=1,
        chapter_end=last_chapter.chapter_number,
        verse_end=last_chapter.verse_count
    )
    
    try:
        db.add(new_range)
        db.commit()
        db.refresh(new_range)
        print(f"Successfully created range ID: {new_range.range_id}")  # Debug log
    except Exception as e:
        print(f"ERROR creating range: {e}")  # Debug log
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save book: {str(e)}")
    
    # Verify the range was saved
    verify_range = db.query(models.UserVerseRange).filter(
        models.UserVerseRange.range_id == new_range.range_id
    ).first()
    
    if verify_range:
        print(f"Verification successful: Range {verify_range.range_id} exists")
    else:
        print("ERROR: Range not found after commit!")
    
    return {
        "status": "success", 
        "message": f"Saved all verses in book {book_id}",
        "range_id": new_range.range_id,
        "chapters": len(chapters),
        "total_verses": sum(ch.verse_count for ch in chapters)
    }

@router.delete("/{user_id}/books/{book_id}")
def clear_book_verses(user_id: int, book_id: str, db: Session = Depends(get_db)):
    """Clear all verses in a book"""
    book = get_book_by_code(db, book_id)
    
    result = db.query(models.UserVerseRange).filter(
        and_(
            models.UserVerseRange.user_id == user_id,
            models.UserVerseRange.book_id == book.book_id
        )
    ).delete()
    
    db.commit()
    return {"status": "success", "message": f"Cleared {result} verse ranges from book {book_id}"}