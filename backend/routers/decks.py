# backend/routers/decks.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging
from datetime import datetime
from database import DatabaseConnection
import db_pool
from services.api_bible import APIBibleService  # Add this import
from config import Config  # Add this import

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
    card_count: int  # Changed from verse_count
    tags: List[str] = []
    is_saved: bool = False


class DeckListResponse(BaseModel):
    total: int
    decks: List[DeckResponse]


# Card-related models
class CardWithVerses(BaseModel):
    card_id: int
    card_type: str
    reference: str
    verses: List[dict]  # List of verse data
    position: int
    added_at: str
    confidence_score: Optional[int] = None
    last_reviewed: Optional[str] = None


class DeckCardsResponse(BaseModel):
    deck_id: int
    deck_name: str
    total_cards: int
    cards: List[CardWithVerses]


class AddVersesRequest(BaseModel):
    verse_codes: List[str]
    reference: Optional[str] = None  # For display purposes


def add_tags_to_deck(deck_id: int, tags: List[str], db: DatabaseConnection) -> None:
    """Insert tags and mapping for a deck"""
    if not tags:
        return

    with db.get_db() as conn:
        with conn.cursor() as cur:
            for tag in tags:
                cur.execute(
                    "INSERT INTO deck_tags (tag_name) VALUES (%s) ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name RETURNING tag_id",
                    (tag,),
                )
                tag_id = cur.fetchone()[0]
                cur.execute(
                    "INSERT INTO deck_tag_map (deck_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (deck_id, tag_id),
                )
        conn.commit()


def get_deck_tags(deck_id: int, db: DatabaseConnection) -> List[str]:
    """Retrieve tag names for a deck"""
    query = (
        "SELECT dt.tag_name FROM deck_tag_map dm JOIN deck_tags dt ON dm.tag_id = dt.tag_id "
        "WHERE dm.deck_id = %s ORDER BY dt.tag_name"
    )
    rows = db.fetch_all(query, (deck_id,))
    return [row["tag_name"] for row in rows]


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
            cur.execute(
                """
                INSERT INTO decks (user_id, name, description, is_public)
                VALUES (%s, %s, %s, %s)
                RETURNING deck_id, created_at, updated_at
            """,
                (user_id, deck.name, deck.description, deck.is_public),
            )

            result = cur.fetchone()
            deck_id = result[0]
            created_at = result[1]
            updated_at = result[2]

            # Add verse cards if provided
            card_count = 0
            if deck.verse_codes:
                card_count = await add_verses_to_deck_helper(
                    deck_id, deck.verse_codes, db
                )

            # Get user name
            cur.execute("SELECT name FROM users WHERE user_id = %s", (user_id,))
            user_result = cur.fetchone()
            creator_name = user_result[0] if user_result else "Unknown"

            conn.commit()

    # Insert tags outside the transaction block
    if deck.tags:
        add_tags_to_deck(deck_id, deck.tags, db)

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
        card_count=card_count,
        tags=deck.tags or [],
        is_saved=False,
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
            COUNT(dc.card_id) as card_count
        FROM decks d
        JOIN users u ON d.user_id = u.user_id
        LEFT JOIN deck_cards dc ON d.deck_id = dc.deck_id
        WHERE d.user_id = %s
        GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
        ORDER BY d.updated_at DESC
    """

    decks = db.fetch_all(query, (user_id,))

    deck_responses = []
    for deck in decks:
        deck_responses.append(
            DeckResponse(
                deck_id=deck["deck_id"],
                creator_id=deck["creator_id"],
                creator_name=deck["creator_name"],
                name=deck["name"],
                description=deck["description"],
                is_public=deck["is_public"],
                save_count=0,  # TODO: implement save count
                created_at=deck["created_at"].isoformat(),
                updated_at=deck["updated_at"].isoformat(),
                card_count=deck["card_count"],
                tags=get_deck_tags(deck["deck_id"], db),
                is_saved=False,
            )
        )

    return DeckListResponse(total=len(deck_responses), decks=deck_responses)


@router.get("/public", response_model=DeckListResponse)
async def get_public_decks(
    skip: int = 0,
    limit: int = 20,
    tag: Optional[str] = None,
    db: DatabaseConnection = Depends(get_db),
):
    """Get public decks"""
    logger.info(f"Getting public decks, skip={skip}, limit={limit}")

    join_tag = ""
    tag_filter = ""
    params = []
    if tag:
        join_tag = "JOIN deck_tag_map dtm ON d.deck_id = dtm.deck_id JOIN deck_tags dt ON dtm.tag_id = dt.tag_id"
        tag_filter = "AND dt.tag_name = %s"
        params.append(tag)

    query = f"""
        SELECT
            d.deck_id,
            d.user_id as creator_id,
            u.name as creator_name,
            d.name,
            d.description,
            d.is_public,
            d.created_at,
            d.updated_at,
            COUNT(dc.card_id) as card_count
        FROM decks d
        JOIN users u ON d.user_id = u.user_id
        LEFT JOIN deck_cards dc ON d.deck_id = dc.deck_id
        {join_tag}
        WHERE d.is_public = TRUE {tag_filter}
        GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
        ORDER BY d.created_at DESC
        LIMIT %s OFFSET %s
    """.format(
        join_tag=join_tag, tag_filter=tag_filter
    )

    params.extend([limit, skip])
    decks = db.fetch_all(query, tuple(params))

    deck_responses = []
    for deck in decks:
        deck_responses.append(
            DeckResponse(
                deck_id=deck["deck_id"],
                creator_id=deck["creator_id"],
                creator_name=deck["creator_name"],
                name=deck["name"],
                description=deck["description"],
                is_public=deck["is_public"],
                save_count=0,
                created_at=deck["created_at"].isoformat(),
                updated_at=deck["updated_at"].isoformat(),
                card_count=deck["card_count"],
                tags=get_deck_tags(deck["deck_id"], db),
                is_saved=False,
            )
        )

    return DeckListResponse(total=len(deck_responses), decks=deck_responses)


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

    # Get card count
    card_count_query = """
        SELECT COUNT(*) as count
        FROM deck_cards
        WHERE deck_id = %s
    """
    card_count_result = db.fetch_one(card_count_query, (deck_id,))
    card_count = card_count_result["count"] if card_count_result else 0

    return DeckResponse(
        deck_id=deck["deck_id"],
        creator_id=deck["creator_id"],
        creator_name=deck["creator_name"],
        name=deck["name"],
        description=deck["description"],
        is_public=deck["is_public"],
        save_count=0,  # TODO: implement save count
        created_at=deck["created_at"].isoformat(),
        updated_at=deck["updated_at"].isoformat(),
        card_count=card_count,
        tags=get_deck_tags(deck_id, db),
        is_saved=False,  # TODO: check if current user saved this deck
    )


@router.get("/{deck_id}/verses", response_model=DeckCardsResponse)
async def get_deck_verses(
    deck_id: int,
    user_id: int = 1,
    bible_id: Optional[str] = None,
    db: DatabaseConnection = Depends(get_db),
):
    """Get all cards in a deck with their verse content and user's confidence scores"""
    logger.info(f"Getting cards for deck {deck_id} for user {user_id}")

    # First check if deck exists
    deck_query = "SELECT name FROM decks WHERE deck_id = %s"
    deck = db.fetch_one(deck_query, (deck_id,))

    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    # Get cards with their verses
    cards_query = """
        SELECT
            dc.card_id,
            dc.card_type,
            dc.reference,
            dc.position,
            dc.added_at,
            cv.verse_id,
            cv.verse_order,
            bv.verse_code,
            bv.book_id,
            bb.book_name,
            bv.chapter_number,
            bv.verse_number
        FROM deck_cards dc
        LEFT JOIN card_verses cv ON dc.card_id = cv.card_id
        LEFT JOIN bible_verses bv ON cv.verse_id = bv.id
        LEFT JOIN bible_books bb ON bv.book_id = bb.book_id
        WHERE dc.deck_id = %s
        ORDER BY dc.position, dc.card_id, cv.verse_order
    """

    results = db.fetch_all(cards_query, (deck_id,))

    # Group results by card and collect verse codes
    cards_dict = {}
    all_verse_codes = []

    for row in results:
        card_id = row["card_id"]
        if card_id not in cards_dict:
            cards_dict[card_id] = {
                "card_id": card_id,
                "card_type": row["card_type"],
                "reference": row["reference"],
                "position": row["position"],
                "added_at": row["added_at"],
                "verses": [],
            }

        if row["verse_id"]:  # If there are verses for this card
            verse_code = row["verse_code"]
            all_verse_codes.append(verse_code)

            verse_reference = (
                f"{row['book_name']} {row['chapter_number']}:{row['verse_number']}"
            )

            cards_dict[card_id]["verses"].append(
                {
                    "verse_id": row["verse_id"],
                    "verse_code": verse_code,
                    "book_id": row["book_id"],
                    "book_name": row["book_name"],
                    "chapter_number": row["chapter_number"],
                    "verse_number": row["verse_number"],
                    "reference": verse_reference,
                    "text": "",  # Will be filled in later
                    "verse_order": row["verse_order"],
                }
            )

    # Fetch actual verse texts from preferred provider
    verse_texts = {}
    if all_verse_codes:
        try:
            user_pref = db.fetch_one(
                "SELECT use_esv_api, esv_api_token FROM users WHERE user_id = %s",
                (user_id,),
            )
            use_esv = user_pref.get("use_esv_api") if user_pref else False
            esv_token = user_pref.get("esv_api_token") if user_pref else None

            if use_esv and esv_token:
                from services.esv_api import ESVService

                logger.info("Using ESV API for deck verses")
                ref_map = {}
                for card_data in cards_dict.values():
                    for verse in card_data["verses"]:
                        ref_map[verse["verse_code"]] = verse["reference"]

                esv = ESVService(esv_token)
                verse_texts = esv.get_verses_batch(ref_map)
            else:
                logger.info("Using API.Bible for deck verses")
                api_bible = APIBibleService(
                    Config.API_BIBLE_KEY, bible_id or Config.DEFAULT_BIBLE_ID
                )
                verse_texts = api_bible.get_verses_batch(
                    all_verse_codes, bible_id or Config.DEFAULT_BIBLE_ID
                )
            logger.info(
                f"Fetched texts for {len(verse_texts)} verses from preferred provider"
            )
        except Exception as e:
            logger.error(f"Error fetching verse texts: {e}")
            # Continue without verse texts rather than failing completely

    # Update verse texts in the cards
    for card_data in cards_dict.values():
        for verse in card_data["verses"]:
            verse_code = verse["verse_code"]
            if verse_code in verse_texts:
                verse["text"] = verse_texts[verse_code]
            else:
                # Fallback text if API.Bible fetch failed
                verse["text"] = f"Unable to load verse text for {verse['reference']}"

    # Convert to list and add confidence scores
    card_responses = []
    for card_data in cards_dict.values():
        # Get confidence score for this card (average of all verses, or first verse)
        confidence_score = None
        last_reviewed = None

        if card_data["verses"]:
            # For now, use confidence of first verse
            first_verse_id = card_data["verses"][0]["verse_id"]
            confidence_query = """
                SELECT confidence_score, last_reviewed::text
                FROM user_verse_confidence
                WHERE user_id = %s AND verse_id = %s
            """
            confidence_result = db.fetch_one(
                confidence_query, (user_id, first_verse_id)
            )
            if confidence_result:
                confidence_score = confidence_result["confidence_score"]
                last_reviewed = confidence_result["last_reviewed"]

        card_responses.append(
            CardWithVerses(
                card_id=card_data["card_id"],
                card_type=card_data["card_type"],
                reference=card_data["reference"],
                verses=card_data["verses"],
                position=card_data["position"],
                added_at=(
                    card_data["added_at"].isoformat() if card_data["added_at"] else None
                ),
                confidence_score=confidence_score,
                last_reviewed=last_reviewed,
            )
        )

    return DeckCardsResponse(
        deck_id=deck_id,
        deck_name=deck["name"],
        total_cards=len(card_responses),
        cards=card_responses,
    )


async def add_verses_to_deck_helper(
    deck_id: int, verse_codes: List[str], db: DatabaseConnection
) -> int:
    """Helper function to add verses as a single card"""
    if not verse_codes:
        return 0

    with db.get_db() as conn:
        with conn.cursor() as cur:
            # Get verse details
            verse_placeholders = ",".join(["%s"] * len(verse_codes))
            verse_query = f"""
                SELECT bv.id, bv.verse_code, bv.book_id, bv.chapter_number, bv.verse_number, bb.book_name
                FROM bible_verses bv
                JOIN bible_books bb ON bv.book_id = bb.book_id
                WHERE bv.verse_code IN ({verse_placeholders})
                ORDER BY bv.book_id, bv.chapter_number, bv.verse_number
            """
            cur.execute(verse_query, verse_codes)
            verses = cur.fetchall()

            if not verses:
                return 0

            # Convert tuples to dicts for easier access
            verse_list = []
            for verse in verses:
                verse_list.append(
                    {
                        "id": verse[0],
                        "verse_code": verse[1],
                        "book_id": verse[2],
                        "chapter_number": verse[3],
                        "verse_number": verse[4],
                        "book_name": verse[5],
                    }
                )

            # Determine card type and reference
            if len(verse_list) == 1:
                card_type = "single_verse"
                verse = verse_list[0]
                reference = f"{verse['book_name']} {verse['chapter_number']}:{verse['verse_number']}"
            else:
                card_type = "verse_range"
                first_verse = verse_list[0]
                last_verse = verse_list[-1]

                if first_verse["book_id"] == last_verse["book_id"]:
                    if first_verse["chapter_number"] == last_verse["chapter_number"]:
                        # Same chapter range
                        reference = f"{first_verse['book_name']} {first_verse['chapter_number']}:{first_verse['verse_number']}-{last_verse['verse_number']}"
                    else:
                        # Multi-chapter range
                        reference = f"{first_verse['book_name']} {first_verse['chapter_number']}:{first_verse['verse_number']}-{last_verse['chapter_number']}:{last_verse['verse_number']}"
                else:
                    # Multi-book range (unlikely but handle it)
                    reference = f"{first_verse['book_name']} {first_verse['chapter_number']}:{first_verse['verse_number']}-{last_verse['book_name']} {last_verse['chapter_number']}:{last_verse['verse_number']}"

            # Insert card
            insert_card_query = """
                INSERT INTO deck_cards (deck_id, card_type, reference, start_verse_id, end_verse_id, position)
                VALUES (%s, %s, %s, %s, %s, (SELECT COALESCE(MAX(position), 0) + 1 FROM deck_cards WHERE deck_id = %s))
                RETURNING card_id
            """

            start_verse_id = verse_list[0]["id"]
            end_verse_id = verse_list[-1]["id"] if len(verse_list) > 1 else None

            cur.execute(
                insert_card_query,
                (deck_id, card_type, reference, start_verse_id, end_verse_id, deck_id),
            )
            card_result = cur.fetchone()
            card_id = card_result[0]

            # Insert card verses
            insert_card_verses_query = """
                INSERT INTO card_verses (card_id, verse_id, verse_order)
                VALUES (%s, %s, %s)
            """

            for order, verse in enumerate(verse_list, 1):
                cur.execute(insert_card_verses_query, (card_id, verse["id"], order))

            conn.commit()
            return 1


@router.post("/{deck_id}/verses")
async def add_verses_to_deck(
    deck_id: int, request: AddVersesRequest, db: DatabaseConnection = Depends(get_db)
):
    """Add verses to a deck as a single card"""
    logger.info(f"Adding {len(request.verse_codes)} verses to deck {deck_id}")

    card_count = await add_verses_to_deck_helper(deck_id, request.verse_codes, db)

    return {"message": f"Added card with {len(request.verse_codes)} verses to deck"}


@router.put("/{deck_id}", response_model=DeckResponse)
async def update_deck(
    deck_id: int, deck_update: DeckUpdate, db: DatabaseConnection = Depends(get_db)
):
    """Update deck information"""
    logger.info(f"Updating deck {deck_id}")

    # Build update query dynamically
    update_fields = []
    params = []

    if deck_update.name is not None:
        update_fields.append("name = %s")
        params.append(deck_update.name)

    if deck_update.description is not None:
        update_fields.append("description = %s")
        params.append(deck_update.description)

    if deck_update.is_public is not None:
        update_fields.append("is_public = %s")
        params.append(deck_update.is_public)

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    params.append(deck_id)

    query = f"""
        UPDATE decks 
        SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
        WHERE deck_id = %s
    """

    db.execute(query, tuple(params))

    # Return updated deck
    return await get_deck(deck_id, db)


@router.delete("/{deck_id}")
async def delete_deck(deck_id: int, db: DatabaseConnection = Depends(get_db)):
    """Delete a deck"""
    logger.info(f"Deleting deck {deck_id}")

    # TODO: Add user ownership check

    query = "DELETE FROM decks WHERE deck_id = %s"
    db.execute(query, (deck_id,))

    return {"message": "Deck deleted successfully"}


@router.delete("/{deck_id}/cards/{card_id}")
async def remove_card_from_deck(
    deck_id: int, card_id: int, db: DatabaseConnection = Depends(get_db)
):
    """Remove a card from a deck"""
    logger.info(f"Removing card {card_id} from deck {deck_id}")

    query = "DELETE FROM deck_cards WHERE deck_id = %s AND card_id = %s"
    db.execute(query, (deck_id, card_id))

    return {"message": "Card removed from deck"}


@router.post("/{deck_id}/cards/remove-multiple")
async def remove_multiple_cards_from_deck(
    deck_id: int, card_ids: List[int], db: DatabaseConnection = Depends(get_db)
):
    """Remove multiple cards from a deck"""
    logger.info(f"Removing {len(card_ids)} cards from deck {deck_id}")

    # Delete cards
    for card_id in card_ids:
        query = "DELETE FROM deck_cards WHERE deck_id = %s AND card_id = %s"
        db.execute(query, (deck_id, card_id))

    return {"message": f"Removed {len(card_ids)} cards from deck"}


@router.post("/{deck_id}/cards/reorder")
async def reorder_deck_cards(
    deck_id: int, card_ids: List[int], db: DatabaseConnection = Depends(get_db)
):
    """Reorder cards within a deck based on the provided list of card IDs"""
    logger.info(f"Reordering cards for deck {deck_id}")

    position = 1
    for card_id in card_ids:
        query = (
            "UPDATE deck_cards SET position = %s WHERE deck_id = %s AND card_id = %s"
        )
        db.execute(query, (position, deck_id, card_id))
        position += 1

    return {"message": "Deck cards reordered"}


# Add these routes to backend/routers/decks.py


@router.get("/saved/{user_id}", response_model=DeckListResponse)
async def get_saved_decks(user_id: int, db: DatabaseConnection = Depends(get_db)):
    """Get all decks saved by a user"""
    logger.info(f"Getting saved decks for user {user_id}")

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
            COUNT(DISTINCT dc.card_id) as card_count,
            COUNT(DISTINCT sd2.user_id) as save_count,
            TRUE as is_saved
        FROM saved_decks sd
        JOIN decks d ON sd.deck_id = d.deck_id
        JOIN users u ON d.user_id = u.user_id
        LEFT JOIN deck_cards dc ON d.deck_id = dc.deck_id
        LEFT JOIN saved_decks sd2 ON d.deck_id = sd2.deck_id
        WHERE sd.user_id = %s
        GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at
        ORDER BY sd.saved_at DESC
    """

    decks = db.fetch_all(query, (user_id,))

    deck_responses = []
    for deck in decks:
        deck_responses.append(
            DeckResponse(
                deck_id=deck["deck_id"],
                creator_id=deck["creator_id"],
                creator_name=deck["creator_name"],
                name=deck["name"],
                description=deck["description"],
                is_public=deck["is_public"],
                save_count=deck["save_count"],
                created_at=deck["created_at"].isoformat(),
                updated_at=deck["updated_at"].isoformat(),
                card_count=deck["card_count"],
                tags=get_deck_tags(deck["deck_id"], db),
                is_saved=True,
            )
        )

    return DeckListResponse(total=len(deck_responses), decks=deck_responses)


@router.post("/{deck_id}/save")
async def save_deck(
    deck_id: int, request: dict, db: DatabaseConnection = Depends(get_db)
):
    """Save a deck to user's collection"""
    user_id = request.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    logger.info(f"User {user_id} saving deck {deck_id}")

    # Check if deck exists
    deck = db.fetch_one("SELECT deck_id FROM decks WHERE deck_id = %s", (deck_id,))
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    # Check if already saved
    existing = db.fetch_one(
        "SELECT * FROM saved_decks WHERE user_id = %s AND deck_id = %s",
        (user_id, deck_id),
    )

    if existing:
        return {"message": "Deck already saved"}

    # Save the deck
    query = """
        INSERT INTO saved_decks (user_id, deck_id, saved_at)
        VALUES (%s, %s, CURRENT_TIMESTAMP)
    """
    db.execute(query, (user_id, deck_id))

    return {"message": "Deck saved successfully"}


@router.delete("/{deck_id}/save/{user_id}")
async def unsave_deck(
    deck_id: int, user_id: int, db: DatabaseConnection = Depends(get_db)
):
    """Remove a deck from user's saved collection"""
    logger.info(f"User {user_id} removing saved deck {deck_id}")

    query = "DELETE FROM saved_decks WHERE user_id = %s AND deck_id = %s"
    db.execute(query, (user_id, deck_id))

    return {"message": "Deck removed from saved collection"}


# Also update the get_public_decks method to include is_saved status for the current user
@router.get("/public", response_model=DeckListResponse)
async def get_public_decks(
    skip: int = 0,
    limit: int = 20,
    user_id: Optional[int] = None,
    tag: Optional[str] = None,
    db: DatabaseConnection = Depends(get_db),
):
    """Get public decks"""
    logger.info(f"Getting public decks, skip={skip}, limit={limit}, user_id={user_id}")

    join_tag = ""
    tag_filter = ""
    params = [user_id or 0]
    if tag:
        join_tag = "JOIN deck_tag_map dtm ON d.deck_id = dtm.deck_id JOIN deck_tags dt ON dtm.tag_id = dt.tag_id"
        tag_filter = "AND dt.tag_name = %s"
        params.append(tag)

    query = f"""
        SELECT
            d.deck_id,
            d.user_id as creator_id,
            u.name as creator_name,
            d.name,
            d.description,
            d.is_public,
            d.created_at,
            d.updated_at,
            COUNT(DISTINCT dc.card_id) as card_count,
            COUNT(DISTINCT sd.user_id) as save_count,
            CASE WHEN usd.user_id IS NOT NULL THEN TRUE ELSE FALSE END as is_saved
        FROM decks d
        JOIN users u ON d.user_id = u.user_id
        LEFT JOIN deck_cards dc ON d.deck_id = dc.deck_id
        LEFT JOIN saved_decks sd ON d.deck_id = sd.deck_id
        LEFT JOIN saved_decks usd ON d.deck_id = usd.deck_id AND usd.user_id = %s
        {join_tag}
        WHERE d.is_public = TRUE {tag_filter}
        GROUP BY d.deck_id, d.user_id, u.name, d.name, d.description, d.is_public, d.created_at, d.updated_at, usd.user_id
        ORDER BY d.created_at DESC
        LIMIT %s OFFSET %s
    """.format(
        join_tag=join_tag, tag_filter=tag_filter
    )

    params.extend([limit, skip])
    decks = db.fetch_all(query, tuple(params))

    deck_responses = []
    for deck in decks:
        deck_responses.append(
            DeckResponse(
                deck_id=deck["deck_id"],
                creator_id=deck["creator_id"],
                creator_name=deck["creator_name"],
                name=deck["name"],
                description=deck["description"],
                is_public=deck["is_public"],
                save_count=deck["save_count"],
                created_at=deck["created_at"].isoformat(),
                updated_at=deck["updated_at"].isoformat(),
                card_count=deck["card_count"],
                tags=get_deck_tags(deck["deck_id"], db),
                is_saved=deck["is_saved"] if user_id else False,
            )
        )

    return DeckListResponse(total=len(deck_responses), decks=deck_responses)
