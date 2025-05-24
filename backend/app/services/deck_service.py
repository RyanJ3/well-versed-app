# backend/app/services/deck_service.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict
from app.models import Deck, DeckVerse, SavedDeck, DeckTag, Book, BibleVerse, UserVerse
from app.schemas.deck_schemas import DeckCreate, DeckUpdate, DeckVerseReorder
from app.services.verse_service import VerseService


class DeckService:
    """Service for managing flashcard decks"""
    
    @staticmethod
    def create_deck(
        db: Session,
        creator_id: int,
        deck_data: DeckCreate
    ) -> Deck:
        """Create a new deck with optional initial verses and tags"""
        # Create deck
        deck = Deck(
            creator_id=creator_id,
            name=deck_data.name,
            description=deck_data.description,
            is_public=deck_data.is_public
        )
        db.add(deck)
        db.flush()  # Get deck_id without committing
        
        # Add initial verses if provided
        if deck_data.verse_codes:
            DeckService._add_verses_to_deck(db, deck.deck_id, deck_data.verse_codes)
        
        # Add tags if provided
        if deck_data.tags:
            for tag in deck_data.tags:
                deck_tag = DeckTag(deck_id=deck.deck_id, tag=tag.lower())
                db.add(deck_tag)
        
        db.commit()
        db.refresh(deck)
        return deck
    
    @staticmethod
    def get_deck(db: Session, deck_id: int, user_id: Optional[int] = None) -> Optional[Deck]:
        """Get deck by ID with creator info and save status"""
        query = db.query(Deck).options(
            joinedload(Deck.creator),
            joinedload(Deck.verses).joinedload(DeckVerse.book),
            joinedload(Deck.tags)
        )
        
        deck = query.filter(Deck.deck_id == deck_id).first()
        
        if not deck:
            return None
        
        # Check if deck is public or owned by user
        if not deck.is_public and deck.creator_id != user_id:
            return None
        
        return deck
    
    @staticmethod
    def update_deck(
        db: Session,
        deck_id: int,
        user_id: int,
        deck_update: DeckUpdate
    ) -> Optional[Deck]:
        """Update deck details (only by creator)"""
        deck = db.query(Deck).filter(
            and_(Deck.deck_id == deck_id, Deck.creator_id == user_id)
        ).first()
        
        if not deck:
            return None
        
        if deck_update.name is not None:
            deck.name = deck_update.name
        if deck_update.description is not None:
            deck.description = deck_update.description
        if deck_update.is_public is not None:
            deck.is_public = deck_update.is_public
        
        db.commit()
        db.refresh(deck)
        return deck
    
    @staticmethod
    def delete_deck(db: Session, deck_id: int, user_id: int) -> bool:
        """Delete deck (only by creator)"""
        result = db.query(Deck).filter(
            and_(Deck.deck_id == deck_id, Deck.creator_id == user_id)
        ).delete()
        db.commit()
        return result > 0
    
    @staticmethod
    def get_user_decks(db: Session, user_id: int) -> List[Deck]:
        """Get all decks created by a user"""
        return db.query(Deck).options(
            joinedload(Deck.tags),
            joinedload(Deck.verses)
        ).filter(Deck.creator_id == user_id).all()
    
    @staticmethod
    def get_public_decks(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        tag: Optional[str] = None
    ) -> tuple[List[Deck], int]:
        """Get public decks with optional tag filter"""
        query = db.query(Deck).options(
            joinedload(Deck.creator),
            joinedload(Deck.tags),
            joinedload(Deck.verses)
        ).filter(Deck.is_public == True)
        
        if tag:
            query = query.join(DeckTag).filter(DeckTag.tag == tag.lower())
        
        total = query.count()
        decks = query.order_by(Deck.save_count.desc()).offset(skip).limit(limit).all()
        
        return decks, total
    
    @staticmethod
    def save_deck(db: Session, user_id: int, deck_id: int) -> bool:
        """Save a deck to user's collection"""
        # Check if deck exists and is public
        deck = db.query(Deck).filter(
            and_(Deck.deck_id == deck_id, Deck.is_public == True)
        ).first()
        
        if not deck:
            return False
        
        # Check if already saved
        existing = db.query(SavedDeck).filter(
            and_(SavedDeck.user_id == user_id, SavedDeck.deck_id == deck_id)
        ).first()
        
        if existing:
            return True
        
        # Save deck
        saved_deck = SavedDeck(user_id=user_id, deck_id=deck_id)
        db.add(saved_deck)
        db.commit()
        return True
    
    @staticmethod
    def unsave_deck(db: Session, user_id: int, deck_id: int) -> bool:
        """Remove deck from user's collection"""
        result = db.query(SavedDeck).filter(
            and_(SavedDeck.user_id == user_id, SavedDeck.deck_id == deck_id)
        ).delete()
        db.commit()
        return result > 0
    
    @staticmethod
    def get_saved_decks(db: Session, user_id: int) -> List[Deck]:
        """Get user's saved decks"""
        return db.query(Deck).join(SavedDeck).options(
            joinedload(Deck.creator),
            joinedload(Deck.tags),
            joinedload(Deck.verses)
        ).filter(SavedDeck.user_id == user_id).all()
    
    @staticmethod
    def add_verses_to_deck(
        db: Session,
        deck_id: int,
        user_id: int,
        verse_codes: List[str]
    ) -> bool:
        """Add verses to deck (only by creator)"""
        deck = db.query(Deck).filter(
            and_(Deck.deck_id == deck_id, Deck.creator_id == user_id)
        ).first()
        
        if not deck:
            return False
        
        DeckService._add_verses_to_deck(db, deck_id, verse_codes)
        db.commit()
        return True
    
    @staticmethod
    def _add_verses_to_deck(db: Session, deck_id: int, verse_codes: List[str]):
        """Internal method to add verses to deck"""
        # Get current max position
        max_pos = db.query(func.max(DeckVerse.order_position)).filter(
            DeckVerse.deck_id == deck_id
        ).scalar() or -1
        
        position = max_pos + 1
        
        for verse_code in verse_codes:
            bible_verse = VerseService.get_bible_verse(db, verse_code)
            if bible_verse:
                # Check if verse already in deck
                existing = db.query(DeckVerse).filter(
                    and_(
                        DeckVerse.deck_id == deck_id,
                        DeckVerse.verse_id == bible_verse.verse_id
                    )
                ).first()
                
                if not existing:
                    deck_verse = DeckVerse(
                        deck_id=deck_id,
                        verse_id=bible_verse.verse_id,
                        order_position=position
                    )
                    db.add(deck_verse)
                    position += 1
    
    @staticmethod
    def remove_verses_from_deck(
        db: Session,
        deck_id: int,
        user_id: int,
        verse_codes: List[str]
    ) -> bool:
        """Remove verses from deck (only by creator)"""
        deck = db.query(Deck).filter(
            and_(Deck.deck_id == deck_id, Deck.creator_id == user_id)
        ).first()
        
        if not deck:
            return False
        
        for verse_code in verse_codes:
            bible_verse = VerseService.get_bible_verse(db, verse_code)
            if bible_verse:
                db.query(DeckVerse).filter(
                    and_(
                        DeckVerse.deck_id == deck_id,
                        DeckVerse.verse_id == bible_verse.verse_id
                    )
                ).delete()
        
        db.commit()
        return True
    
    @staticmethod
    def reorder_deck_verses(
        db: Session,
        deck_id: int,
        user_id: int,
        verse_orders: List[dict]
    ) -> bool:
        """Reorder verses in deck (only by creator)"""
        deck = db.query(Deck).filter(
            and_(Deck.deck_id == deck_id, Deck.creator_id == user_id)
        ).first()
        
        if not deck:
            return False
        
        for order_info in verse_orders:
            verse_code = order_info.get("verse_code")
            position = order_info.get("position")
            
            if verse_code and position is not None:
                bible_verse = VerseService.get_bible_verse(db, verse_code)
                if bible_verse:
                    db.query(DeckVerse).filter(
                        and_(
                            DeckVerse.deck_id == deck_id,
                            DeckVerse.verse_id == bible_verse.verse_id
                        )
                    ).update({"order_position": position})
        
        db.commit()
        return True
    
    @staticmethod
    def get_deck_progress(
        db: Session,
        deck_id: int,
        user_id: int
    ) -> Optional[Dict]:
        """Get user's progress on a specific deck"""
        deck = db.query(Deck).options(
            joinedload(Deck.verses)
        ).filter(Deck.deck_id == deck_id).first()
        
        if not deck:
            return None
        
        # Get verse IDs in deck
        verse_ids = [dv.verse_id for dv in deck.verses]
        
        if not verse_ids:
            return {
                "deck_id": deck_id,
                "deck_name": deck.name,
                "total_verses": 0,
                "memorized_verses": 0,
                "progress_percentage": 0.0,
                "confidence_breakdown": {i: 0 for i in range(6)}
            }
        
        # Get user's progress on these verses
        user_verses = db.query(UserVerse).filter(
            and_(
                UserVerse.user_id == user_id,
                UserVerse.verse_id.in_(verse_ids)
            )
        ).all()
        
        # Calculate stats
        confidence_breakdown = {i: 0 for i in range(6)}
        for uv in user_verses:
            confidence_breakdown[uv.confidence_level] += 1
        
        # Fill in missing verses with confidence 0
        tracked_verse_ids = {uv.verse_id for uv in user_verses}
        for verse_id in verse_ids:
            if verse_id not in tracked_verse_ids:
                confidence_breakdown[0] += 1
        
        memorized_count = sum(count for level, count in confidence_breakdown.items() if level >= 3)
        
        return {
            "deck_id": deck_id,
            "deck_name": deck.name,
            "total_verses": len(verse_ids),
            "memorized_verses": memorized_count,
            "progress_percentage": (memorized_count / len(verse_ids) * 100) if verse_ids else 0,
            "confidence_breakdown": confidence_breakdown
        }