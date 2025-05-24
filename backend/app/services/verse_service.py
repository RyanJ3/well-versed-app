# backend/app/services/verse_service_normalized.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional, Dict, Tuple
from app.models import UserVerse, BibleVerse, Book
from app.schemas.verse_schemas import VerseCreate, VerseUpdate, BatchVerseUpdate


class VerseService:
    """Service for managing user verse memorization tracking with normalized DB"""
    
    @staticmethod
    def parse_verse_code(verse_code: str) -> Tuple[str, int, int]:
        """Parse verse code format 'BOOK-CHAPTER-VERSE' into components"""
        parts = verse_code.split('-')
        if len(parts) != 3:
            raise ValueError(f"Invalid verse_code format: {verse_code}")
        return parts[0], int(parts[1]), int(parts[2])
    
    @staticmethod
    def get_user_verses(db: Session, user_id: int) -> Dict:
        """Get all verses for a user with confidence breakdown"""
        verses = db.query(UserVerse).options(
            joinedload(UserVerse.verse).joinedload(BibleVerse.book)
        ).filter(UserVerse.user_id == user_id).all()
        
        # Calculate confidence breakdown
        confidence_breakdown = {i: 0 for i in range(6)}
        for verse in verses:
            confidence_breakdown[verse.confidence_level] += 1
        
        return {
            "user_id": user_id,
            "total_verses": len(verses),
            "confidence_breakdown": confidence_breakdown,
            "verses": verses
        }
    
    @staticmethod
    def get_bible_verse(db: Session, verse_code: str) -> Optional[BibleVerse]:
        """Get BibleVerse by verse code"""
        book_code, chapter, verse_num = VerseService.parse_verse_code(verse_code)
        
        return db.query(BibleVerse).join(Book).filter(
            and_(
                Book.book_code == book_code,
                BibleVerse.chapter_number == chapter,
                BibleVerse.verse_number == verse_num
            )
        ).first()
    
    @staticmethod
    def get_or_create_user_verse(
        db: Session,
        user_id: int,
        verse_id: int,
        confidence_level: int = 0
    ) -> UserVerse:
        """Get existing user verse or create new one"""
        user_verse = db.query(UserVerse).filter(
            and_(
                UserVerse.user_id == user_id,
                UserVerse.verse_id == verse_id
            )
        ).first()
        
        if not user_verse:
            user_verse = UserVerse(
                user_id=user_id,
                verse_id=verse_id,
                confidence_level=confidence_level
            )
            db.add(user_verse)
            db.commit()
            db.refresh(user_verse)
        
        return user_verse
    
    @staticmethod
    def update_verse_confidence(
        db: Session,
        user_id: int,
        verse_code: str,
        confidence_level: int
    ) -> Optional[UserVerse]:
        """Update confidence level for a specific verse"""
        bible_verse = VerseService.get_bible_verse(db, verse_code)
        if not bible_verse:
            return None
        
        user_verse = db.query(UserVerse).filter(
            and_(
                UserVerse.user_id == user_id,
                UserVerse.verse_id == bible_verse.verse_id
            )
        ).first()
        
        if user_verse:
            user_verse.confidence_level = confidence_level
            user_verse.review_count += 1
            db.commit()
            db.refresh(user_verse)
        else:
            # Create new user verse if it doesn't exist
            user_verse = VerseService.get_or_create_user_verse(
                db, user_id, bible_verse.verse_id, confidence_level
            )
        
        return user_verse
    
    @staticmethod
    def batch_update_confidence(
        db: Session,
        user_id: int,
        verse_codes: List[str],
        confidence_level: int
    ) -> List[UserVerse]:
        """Update confidence for multiple verses"""
        updated_verses = []
        
        for verse_code in verse_codes:
            verse = VerseService.update_verse_confidence(
                db, user_id, verse_code, confidence_level
            )
            if verse:
                updated_verses.append(verse)
        
        return updated_verses
    
    @staticmethod
    def get_verses_for_review(
        db: Session,
        user_id: int,
        limit: int = 50
    ) -> List[UserVerse]:
        """
        Get verses prioritized for review based on confidence level.
        Lower confidence = higher priority.
        """
        return db.query(UserVerse).options(
            joinedload(UserVerse.verse).joinedload(BibleVerse.book)
        ).filter(
            UserVerse.user_id == user_id
        ).order_by(
            UserVerse.confidence_level.asc(),  # Lowest confidence first
            UserVerse.review_count.asc()       # Then least reviewed
        ).limit(limit).all()
    
    @staticmethod
    def delete_verse(
        db: Session,
        user_id: int,
        verse_code: str
    ) -> bool:
        """Delete a verse from user's tracking"""
        bible_verse = VerseService.get_bible_verse(db, verse_code)
        if not bible_verse:
            return False
        
        result = db.query(UserVerse).filter(
            and_(
                UserVerse.user_id == user_id,
                UserVerse.verse_id == bible_verse.verse_id
            )
        ).delete()
        
        db.commit()
        return result > 0