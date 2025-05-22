from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from app.database import get_db
from app.utils import get_apocryphal_book_ids
from sqlalchemy import not_
from datetime import datetime

router = APIRouter()

@router.get("/{user_id}", response_model=List[schemas.UserVerseDetail])
def get_user_verses(
    user_id: int, 
    include_apocrypha: bool = False, 
    db: Session = Depends(get_db)
):
    """Get all verses memorized by a user"""
    # Check if user exists
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all user verses with verse details
    user_verses_query = db.query(models.UserVerse, models.Verse).join(
        models.Verse, models.UserVerse.verse_id == models.Verse.verse_id
    ).filter(models.UserVerse.user_id == user_id)
    
    # Filter out apocryphal content if needed
    if not include_apocrypha:
        user_verses_query = user_verses_query.filter(not_(models.Verse.is_apocryphal))
    
    user_verses = user_verses_query.all()
    
    # Format the results
    result = []
    for user_verse, verse in user_verses:
        # Parse verse_id to get components
        parts = verse.verse_id.split('-')
        if len(parts) >= 3:
            book_id = parts[0]
            chapter_number = int(parts[1])
            verse_number = int(parts[2])
        else:
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
    """Update or create a user's verse"""
    print(f"Updating verse: user_id={user_id}, verse_id={verse_id}, data={verse_data.dict()}")
    
    # Check if user exists
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if verse exists in verses table
    verse = db.query(models.Verse).filter(models.Verse.verse_id == verse_id).first()
    if not verse:
        # Create the verse
        print(f"Creating new verse: {verse_id}")
        try:
            parts = verse_id.split('-')
            if len(parts) != 3:
                raise ValueError("Invalid verse_id format")
            
            book_id, chapter_num, verse_num = parts
            
            # Determine if verse is apocryphal (simplified logic)
            is_apocryphal = False
            apocryphal_books = get_apocryphal_book_ids()
            if book_id in apocryphal_books:
                is_apocryphal = True
            elif book_id == 'PSA' and chapter_num == '151':
                is_apocryphal = True
            elif book_id == 'DAN' and chapter_num in ['13', '14']:
                is_apocryphal = True
            
            verse = models.Verse(
                verse_id=verse_id,
                verse_number=int(verse_num),
                is_apocryphal=is_apocryphal
            )
            db.add(verse)
            db.flush()  # Flush to get the verse in the same transaction
        except Exception as e:
            print(f"Error creating verse: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid verse_id format: {verse_id}")
    
    # Check if user_verse exists
    user_verse = db.query(models.UserVerse).filter(
        models.UserVerse.user_id == user_id,
        models.UserVerse.verse_id == verse_id
    ).first()
    
    # Set the practice count
    practice_count = verse_data.practice_count if verse_data.practice_count is not None else 1
    last_practiced = verse_data.last_practiced or datetime.utcnow()
    
    if not user_verse:
        # Create new user_verse
        print(f"Creating new user_verse: user_id={user_id}, verse_id={verse_id}, practice_count={practice_count}")
        user_verse = models.UserVerse(
            user_id=user_id,
            verse_id=verse_id,
            practice_count=practice_count,
            last_practiced=last_practiced
        )
        db.add(user_verse)
    else:
        # Update existing user_verse
        print(f"Updating existing user_verse: practice_count={practice_count}")
        user_verse.practice_count = practice_count
        user_verse.last_practiced = last_practiced
        user_verse.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"status": "success", "message": f"Verse {verse_id} updated successfully"}

@router.delete("/{user_id}/{verse_id}", status_code=status.HTTP_200_OK)
def delete_user_verse(
    user_id: int,
    verse_id: str,
    db: Session = Depends(get_db)
):
    """Delete a user's verse (unmemorize)"""
    print(f"Deleting verse: user_id={user_id}, verse_id={verse_id}")
    
    # Find and delete the user_verse
    result = db.query(models.UserVerse).filter(
        models.UserVerse.user_id == user_id,
        models.UserVerse.verse_id == verse_id
    ).delete()
    
    db.commit()
    
    if result == 0:
        raise HTTPException(status_code=404, detail="User verse not found")
    
    return {"status": "success", "message": f"Verse {verse_id} deleted successfully"}