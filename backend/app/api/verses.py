from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from app.database import get_db
from app.utils import get_apocryphal_book_ids
from sqlalchemy import not_

router = APIRouter()

@router.get("/{user_id}", response_model=List[schemas.UserVerseDetail])
def get_user_verses(
    user_id: int, 
    include_apocrypha: bool = False, 
    db: Session = Depends(get_db)
):
    """Get all verses memorized by a user, with option to exclude apocryphal books and verses"""
    # Check if user exists
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all user verses with verse details
    user_verses_query = db.query(models.UserVerse, models.Verse).join(
        models.Verse, models.UserVerse.verse_id == models.Verse.verse_id
    ).filter(models.UserVerse.user_id == user_id)
    
    # Filter out apocryphal content if include_apocrypha is False
    if not include_apocrypha:
        # Get list of apocryphal book IDs
        apocryphal_book_ids = get_apocryphal_book_ids()
        
        # Filter out verses from apocryphal books
        conditions = []
        for book_id in apocryphal_book_ids:
            conditions.append(not_(models.Verse.verse_id.startswith(f"{book_id}-")))
        
        # Apply all book conditions (AND them together)
        for condition in conditions:
            user_verses_query = user_verses_query.filter(condition)
        
        # Also filter out individual apocryphal verses from canonical books
        user_verses_query = user_verses_query.filter(not_(models.Verse.is_apocryphal))
    
    # Execute the query
    user_verses = user_verses_query.all()
    
    # If no verses found, return empty list
    if not user_verses:
        return []
    
    # Format the results
    result = []
    for user_verse, verse in user_verses:
        # Parse verse_id (format: BOOK-CHAPTER-VERSE)
        parts = verse.verse_id.split('-')
        if len(parts) >= 3:
            book_id = parts[0]
            chapter_number = int(parts[1])
            verse_number = int(parts[2])
        else:
            # Default values if parsing fails
            book_id = verse.verse_id
            chapter_number = 1
            verse_number = verse.verse_number
        
        result.append({
            "verse": {
                "verse_id": verse.verse_id,
                "book_id": book_id,
                "chapter_number": chapter_number,
                "verse_number": verse_number,
                "is_apocryphal": verse.is_apocryphal
            },
            "practice_count": user_verse.practice_count,
            "last_practiced": user_verse.last_practiced,
            "created_at": user_verse.created_at,
            "updated_at": user_verse.updated_at
        })
    
    return result

@router.put("/{user_id}/{verse_id}", status_code=status.HTTP_200_OK)
def update_user_verse(
    user_id: int, 
    verse_id: str, 
    verse_data: schemas.UserVerseUpdate,
    db: Session = Depends(get_db)
):
    """Update a user's progress on a specific verse"""
    # Check if user verse exists
    user_verse = db.query(models.UserVerse).filter(
        models.UserVerse.user_id == user_id,
        models.UserVerse.verse_id == verse_id
    ).first()
    
    if not user_verse:
        # Try to create new user verse entry
        # First check if verse exists
        verse = db.query(models.Verse).filter(models.Verse.verse_id == verse_id).first()
        if not verse:
            # Auto-create the verse if it doesn't exist
            book_id, chapter_num, verse_num = verse_id.split('-')
            
            # Determine if this verse is apocryphal
            is_apocryphal = False
            
            # Apocryphal chapters logic
            if (book_id == 'PSA' and chapter_num == '151') or \
               (book_id == 'EST' and int(chapter_num) >= 10) or \
               (book_id == 'DAN' and chapter_num in ['13', '14']) or \
               (book_id == 'DAN' and chapter_num == '3' and 24 <= int(verse_num) <= 50):
                is_apocryphal = True
                
            # Create the verse
            new_verse = models.Verse(
                verse_id=verse_id,
                verse_number=int(verse_num),
                is_apocryphal=is_apocryphal
            )
            db.add(new_verse)
            db.flush()
            verse = new_verse
        
        # Create new user verse
        user_verse = models.UserVerse(
            user_id=user_id,
            verse_id=verse_id,
            practice_count=verse_data.practice_count or 0,
            last_practiced=verse_data.last_practiced
        )
        db.add(user_verse)
    else:
        # Update existing user verse
        if verse_data.practice_count is not None:
            user_verse.practice_count = verse_data.practice_count
        if verse_data.last_practiced is not None:
            user_verse.last_practiced = verse_data.last_practiced
    
    db.commit()
    db.refresh(user_verse)
    
    return {"status": "success"}

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user_verse(verse_data: schemas.UserVerseCreate, db: Session = Depends(get_db)):
    """Create a new user verse entry"""
    # Check if verse exists
    verse = db.query(models.Verse).filter(models.Verse.verse_id == verse_data.verse_id).first()
    if not verse:
        # Auto-create the verse if it doesn't exist
        try:
            book_id, chapter_num, verse_num = verse_data.verse_id.split('-')
            
            # Determine if this verse is apocryphal
            is_apocryphal = False
            
            # Check for known apocryphal content
            if (book_id == 'PSA' and chapter_num == '151') or \
               (book_id == 'EST' and int(chapter_num) >= 10) or \
               (book_id == 'DAN' and chapter_num in ['13', '14']) or \
               (book_id == 'DAN' and chapter_num == '3' and 24 <= int(verse_num) <= 50):
                is_apocryphal = True
            
            verse = models.Verse(
                verse_id=verse_data.verse_id,
                verse_number=int(verse_num),
                is_apocryphal=is_apocryphal
            )
            db.add(verse)
            db.flush()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid verse_id format. Expected: BOOK-CHAPTER-VERSE")
    
    # Check if user verse already exists
    existing = db.query(models.UserVerse).filter(
        models.UserVerse.user_id == verse_data.user_id,
        models.UserVerse.verse_id == verse_data.verse_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User verse entry already exists")
    
    # Create new user verse
    user_verse = models.UserVerse(
        user_id=verse_data.user_id,
        verse_id=verse_data.verse_id,
        practice_count=verse_data.practice_count,
        last_practiced=verse_data.last_practiced
    )
    
    db.add(user_verse)
    db.commit()
    db.refresh(user_verse)
    
    return {"status": "success"}

# Add the new bulk endpoint
@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def create_user_verses_bulk(bulk_data: schemas.UserVerseBulkCreate, db: Session = Depends(get_db)):
    """Create or update multiple verse entries at once"""
    # Check if user exists
    user = db.query(models.User).filter(models.User.user_id == bulk_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Process verse numbers
    results = []
    for verse_num in bulk_data.verse_numbers:
        # Create verse_id
        verse_id = f"{bulk_data.book_id}-{bulk_data.chapter_number}-{verse_num}"
        
        # Check if verse exists
        verse = db.query(models.Verse).filter(models.Verse.verse_id == verse_id).first()
        if not verse:
            # Determine if this verse is apocryphal
            is_apocryphal = False
            
            # Check for known apocryphal content
            if (bulk_data.book_id == 'PSA' and bulk_data.chapter_number == 151) or \
               (bulk_data.book_id == 'EST' and bulk_data.chapter_number >= 10) or \
               (bulk_data.book_id == 'DAN' and bulk_data.chapter_number in [13, 14]) or \
               (bulk_data.book_id == 'DAN' and bulk_data.chapter_number == 3 and 24 <= verse_num <= 50):
                is_apocryphal = True
            
            # Auto-create the verse
            verse = models.Verse(
                verse_id=verse_id,
                verse_number=verse_num,
                is_apocryphal=is_apocryphal
            )
            db.add(verse)
            db.flush()
        
        # Find or create user verse
        user_verse = db.query(models.UserVerse).filter(
            models.UserVerse.user_id == bulk_data.user_id,
            models.UserVerse.verse_id == verse_id
        ).first()
        
        if not user_verse:
            # Create new entry
            user_verse = models.UserVerse(
                user_id=bulk_data.user_id,
                verse_id=verse_id,
                practice_count=bulk_data.practice_count,
                last_practiced=bulk_data.last_practiced
            )
            db.add(user_verse)
        else:
            # Update existing entry
            user_verse.practice_count = bulk_data.practice_count
            user_verse.last_practiced = bulk_data.last_practiced
        
        results.append(verse_id)
    
    db.commit()
    
    return {
        "status": "success", 
        "count": len(results),
        "verses": results
    }

# todo determine where psalm 1:7 and philemon 1:30 come from
@router.get("/debug/{user_id}", response_model=List[str])
def debug_user_verses(user_id: int, db: Session = Depends(get_db)):
    """Debug endpoint to return just verse_ids for a user"""
    user_verses = db.query(models.UserVerse).filter(models.UserVerse.user_id == user_id).all()
    return [uv.verse_id for uv in user_verses]