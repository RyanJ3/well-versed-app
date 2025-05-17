from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db

router = APIRouter()

@router.get("/{user_id}", response_model=List[schemas.UserVerseDetail])
def get_user_verses(user_id: int, db: Session = Depends(get_db)):
    """Get all verses memorized by a user"""
    # Check if user exists
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all user verses with verse details
    user_verses = db.query(models.UserVerse, models.Verse).join(
        models.Verse, models.UserVerse.verse_id == models.Verse.verse_id
    ).filter(models.UserVerse.user_id == user_id).all()
    
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
                "verse_number": verse_number
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
            new_verse = models.Verse(
                verse_id=verse_id,
                verse_number=int(verse_num)
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
            verse = models.Verse(
                verse_id=verse_data.verse_id,
                verse_number=int(verse_num)
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
            # Auto-create the verse
            verse = models.Verse(
                verse_id=verse_id,
                verse_number=verse_num
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