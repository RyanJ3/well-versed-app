# backend/routers/decks.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime
from database import DatabaseConnection
import db_pool

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class DeckCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    verse_codes: Optional[List[str]] = []
    tags: Optional[List[str]] = []

class DeckUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class DeckResponse(BaseModel):
    deck_id: int
    creator_id: int
    creator_name: str
    name: str
    description: Optional[str] = None
    is_public: bool
    save_count: int = 0
    created_at: str
    updated_at: str
    verse_count: int
    tags: List[str] = []
    is_saved: bool = False

class DeckListResponse(BaseModel):
    total: int
    decks: List[DeckResponse]

# Verse-related models
class VerseWithText(BaseModel):
    verse_id: int
    verse_code: str
    book_id: int
    book_name: str
    chapter_number: int
    verse_number: int
    reference: str
    text: str
    confidence_score: Optional[int] = None
    last_reviewed: Optional[str] = None
    
class DeckVersesResponse(BaseModel):
    deck_id: int
    deck_name: str
    total_verses: int
    verses: List[VerseWithText]

def get_db():
    """Dependency to get database connection"""
    return DatabaseConnection(db_pool.db_pool)

@router.post("", response_model=DeckResponse)
async def create_deck(deck: DeckCreate, db: DatabaseConnection = Depends(get_db)):
    """Create a new deck"""
    logger.info(f"Creating deck: {deck.name}")
    
    # For now, use user_id = 1 (test user)
    user_id = 1
    
    with db.get_db() as conn:
        with conn.cursor() as cur:
            # Insert the deck
            cur.execute("""
                INSERT INTO decks (user_id, name, description, is_public)
                VALUES (%s, %s, %s, %s)
                RETURNING deck_id, created_at, updated_at
            """, (user_id, deck.name, deck.description, deck.is_public))
            
            result = cur.fetchone()
            deck_id = result[0]
            created_at = result[1]
            updated_at = result[2]
            
            # Add verses if provided
            verse_count = 0
            if deck.verse_codes:
                # Get verse IDs from verse codes
                verse_placeholders = ','.join(['%s'] * len(deck.verse_codes))
                cur.execute(f"SELECT id FROM bible_verses WHERE verse_code IN ({verse_placeholders})", deck.verse_codes)
                verses = cur.fetchall()
                verse_count = len(verses)
                
                # Insert verses into deck_verses
                for verse in verses:
                    cur.execute("""
                        INSERT INTO deck_verses (deck_id, verse_id)
                        VALUES (%s, %s)
                        ON CONFLICT (deck_id, verse_id) DO NOTHING
                    """, (deck_id, verse[0]))
            
            # Get user name
            cur.execute("SELECT name FROM users WHERE user_id = %s", (user_id,))
            user_result = cur.fetchone()
            creator_name = user_result[0] if user_result else "Unknown"
            
            conn.commit()
    
    return DeckResponse(
        deck_id=deck_id,
        creator_id=user_id,
        creator_name=creator_name,
        name=deck.name,
        description=deck.description,
        is_public=deck.is_public,
        save_count=0,
        created_at=created_at.isoformat(),
        updated_at=updated_at.isoformat(),
        verse_count=verse_count,
        tags=deck.tags or [],
        is_saved=False
    )

@router.get("/user/{user_id}", response_model=DeckListResponse)
async def get_user_decks(user_id: int, db: DatabaseConnection = Depends(get_db)):
    """Get all decks for a user"""
    logger.info(f"Getting decks for user {user_id}")
    
    query = """
        SELECT 
            d.deck_id,
            d.user_id as creator_id,
            u.name as creator_name,
            d.name,
            d.description,
            d.is_public,
            d.created_at,
            d.updated_at,
            COUNT(dv.verse_id) as verse_count
        FROM decks d
        JOIN users u ON d.user_id = u.user_id
        LEFT JOIN deck_verses dv ON d.deck_id = dv.deck_id
        WHERE d.user_id = %s
        GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
        ORDER BY d.updated_at DESC
    """
    
    decks = db.fetch_all(query, (user_id,))
    
    deck_responses = []
    for deck in decks:
        deck_responses.append(DeckResponse(
            deck_id=deck['deck_id'],
            creator_id=deck['creator_id'],
            creator_name=deck['creator_name'],
            name=deck['name'],
            description=deck['description'],
            is_public=deck['is_public'],
            save_count=0,  # TODO: implement save count
            created_at=deck['created_at'].isoformat(),
            updated_at=deck['updated_at'].isoformat(),
            verse_count=deck['verse_count'],
            tags=[],  # TODO: implement tags
            is_saved=False
        ))
    
    return DeckListResponse(total=len(deck_responses), decks=deck_responses)

@router.get("/public", response_model=DeckListResponse)
async def get_public_decks(skip: int = 0, limit: int = 20, tag: Optional[str] = None, db: DatabaseConnection = Depends(get_db)):
    """Get public decks"""
    logger.info(f"Getting public decks, skip={skip}, limit={limit}")
    
    query = """
        SELECT 
            d.deck_id,
            d.user_id as creator_id,
            u.name as creator_name,
            d.name,
            d.description,
            d.is_public,
            d.created_at,
            d.updated_at,
            COUNT(dv.verse_id) as verse_count
        FROM decks d
        JOIN users u ON d.user_id = u.user_id
        LEFT JOIN deck_verses dv ON d.deck_id = dv.deck_id
        WHERE d.is_public = TRUE
        GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
        ORDER BY d.created_at DESC
        LIMIT %s OFFSET %s
    """
    
    decks = db.fetch_all(query, (limit, skip))
    
    deck_responses = []
    for deck in decks:
        deck_responses.append(DeckResponse(
            deck_id=deck['deck_id'],
            creator_id=deck['creator_id'],
            creator_name=deck['creator_name'],
            name=deck['name'],
            description=deck['description'],
            is_public=deck['is_public'],
            save_count=0,
            created_at=deck['created_at'].isoformat(),
            updated_at=deck['updated_at'].isoformat(),
            verse_count=deck['verse_count'],
            tags=[],
            is_saved=False
        ))
    
    return DeckListResponse(total=len(deck_responses), decks=deck_responses)

@router.delete("/{deck_id}")
async def delete_deck(deck_id: int, db: DatabaseConnection = Depends(get_db)):
    """Delete a deck"""
    logger.info(f"Deleting deck {deck_id}")
    
    # TODO: Add user ownership check
    
    query = "DELETE FROM decks WHERE deck_id = %s"
    db.execute(query, (deck_id,))
    
    return {"message": "Deck deleted successfully"}

@router.post("/{deck_id}/verses")
async def add_verses_to_deck(deck_id: int, verse_codes: List[str], db: DatabaseConnection = Depends(get_db)):
    """Add verses to a deck"""
    logger.info(f"Adding {len(verse_codes)} verses to deck {deck_id}")
    
    # Get verse IDs from verse codes
    verse_placeholders = ','.join(['%s'] * len(verse_codes))
    verse_query = f"SELECT id, verse_code FROM bible_verses WHERE verse_code IN ({verse_placeholders})"
    verses = db.fetch_all(verse_query, verse_codes)
    
    if not verses:
        raise HTTPException(status_code=404, detail="No valid verses found")
    
    # Insert into deck_verses
    verse_inserts = [(deck_id, verse['id']) for verse in verses]
    insert_query = """
        INSERT INTO deck_verses (deck_id, verse_id)
        VALUES (%s, %s)
        ON CONFLICT (deck_id, verse_id) DO NOTHING
    """
    
    for verse_insert in verse_inserts:
        db.execute(insert_query, verse_insert)
    
    return {"message": f"Added {len(verses)} verses to deck"}

# Helper function that's used in create_deck
async def add_verses_to_deck(deck_id: int, verse_codes: List[str], db: DatabaseConnection):
    """Helper function to add verses to deck during creation"""
    if not verse_codes:
        return
        
    # Get verse IDs from verse codes
    verse_placeholders = ','.join(['%s'] * len(verse_codes))
    verse_query = f"SELECT id, verse_code FROM bible_verses WHERE verse_code IN ({verse_placeholders})"
    verses = db.fetch_all(verse_query, verse_codes)
    
    # Insert into deck_verses
    verse_inserts = [(deck_id, verse['id']) for verse in verses]
    insert_query = """
        INSERT INTO deck_verses (deck_id, verse_id)
        VALUES (%s, %s)
        ON CONFLICT (deck_id, verse_id) DO NOTHING
    """
    
    for verse_insert in verse_inserts:
        db.execute(insert_query, verse_insert)

@router.get("/{deck_id}", response_model=DeckResponse)
async def get_deck(deck_id: int, db: DatabaseConnection = Depends(get_db)):
    """Get a single deck with its details"""
    logger.info(f"Getting deck {deck_id}")
    
    # Get deck details
    deck_query = """
        SELECT 
            d.deck_id,
            d.user_id as creator_id,
            u.name as creator_name,
            d.name,
            d.description,
            d.is_public,
            d.created_at,
            d.updated_at
        FROM decks d
        JOIN users u ON d.user_id = u.user_id
        WHERE d.deck_id = %s
    """
    
    deck = db.fetch_one(deck_query, (deck_id,))
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Get verse count
    verse_count_query = """
        SELECT COUNT(*) as count
        FROM deck_verses
        WHERE deck_id = %s
    """
    verse_count_result = db.fetch_one(verse_count_query, (deck_id,))
    verse_count = verse_count_result['count'] if verse_count_result else 0
    
    # TODO: Get tags when implemented
    
    return DeckResponse(
        deck_id=deck['deck_id'],
        creator_id=deck['creator_id'],
        creator_name=deck['creator_name'],
        name=deck['name'],
        description=deck['description'],
        is_public=deck['is_public'],
        save_count=0,  # TODO: implement save count
        created_at=deck['created_at'].isoformat(),
        updated_at=deck['updated_at'].isoformat(),
        verse_count=verse_count,
        tags=[],  # TODO: implement tags
        is_saved=False  # TODO: check if current user saved this deck
    )

@router.get("/{deck_id}/verses", response_model=DeckVersesResponse)
async def get_deck_verses(deck_id: int, user_id: int = 1, db: DatabaseConnection = Depends(get_db)):
    """Get all verses in a deck with their text content and user's confidence scores"""
    logger.info(f"Getting verses for deck {deck_id} for user {user_id}")
    
    # First check if deck exists
    deck_query = "SELECT name FROM decks WHERE deck_id = %s"
    deck = db.fetch_one(deck_query, (deck_id,))
    
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    # Get verses with text - for now using placeholder text
    # In a real implementation, you'd join with a verse_text table
    verses_query = """
        SELECT 
            bv.id as verse_id,
            bv.verse_code,
            bv.book_id,
            bb.book_name,
            bv.chapter_number,
            bv.verse_number,
            uv.confidence_score,
            uv.last_reviewed::text
        FROM deck_verses dv
        JOIN bible_verses bv ON dv.verse_id = bv.id
        JOIN bible_books bb ON bv.book_id = bb.book_id
        LEFT JOIN user_verse_confidence uv ON uv.verse_id = bv.id AND uv.user_id = %s
        WHERE dv.deck_id = %s
        ORDER BY dv.position, bb.book_id, bv.chapter_number, bv.verse_number
    """
    
    verses = db.fetch_all(verses_query, (user_id, deck_id))
    
    verse_responses = []
    for verse in verses:
        reference = f"{verse['book_name']} {verse['chapter_number']}:{verse['verse_number']}"
        # Placeholder text - in production, you'd fetch actual verse text
        text = f"This is the text of {reference}. In a real implementation, this would contain the actual scripture text."
        
        verse_responses.append(VerseWithText(
            verse_id=verse['verse_id'],
            verse_code=verse['verse_code'],
            book_id=verse['book_id'],
            book_name=verse['book_name'],
            chapter_number=verse['chapter_number'],
            verse_number=verse['verse_number'],
            reference=reference,
            text=text,
            confidence_score=verse['confidence_score'],
            last_reviewed=verse['last_reviewed']
        ))
    
    return DeckVersesResponse(
        deck_id=deck_id,
        deck_name=deck['name'],
        total_verses=len(verse_responses),
        verses=verse_responses
    )

@router.post("/{deck_id}/verses")
async def add_verses_to_deck(deck_id: int, verse_codes: List[str], db: DatabaseConnection = Depends(get_db)):
    """Add verses to a deck"""
    logger.info(f"Adding {len(verse_codes)} verses to deck {deck_id}")
    
    # Get verse IDs from verse codes
    verse_placeholders = ','.join(['%s'] * len(verse_codes))
    verse_query = f"SELECT id, verse_code FROM bible_verses WHERE verse_code IN ({verse_placeholders})"
    verses = db.fetch_all(verse_query, verse_codes)
    
    if not verses:
        raise HTTPException(status_code=404, detail="No valid verses found")
    
    # Insert into deck_verses
    verse_inserts = [(deck_id, verse['id']) for verse in verses]
    insert_query = """
        INSERT INTO deck_verses (deck_id, verse_id)
        VALUES (%s, %s)
        ON CONFLICT (deck_id, verse_id) DO NOTHING
    """
    
    for verse_insert in verse_inserts:
        db.execute(insert_query, verse_insert)
    
    return {"message": f"Added {len(verses)} verses to deck"}