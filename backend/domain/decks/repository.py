from typing import List, Optional, Dict
from datetime import datetime
from . import schemas

# In-memory storage used for development/testing since
# the real database logic has been stripped during
# refactoring. This allows the API to return predictable
# results without a running database.
DECKS: Dict[int, Dict] = {}
NEXT_DECK_ID = 1
NEXT_CARD_ID = 1

class DeckRepository:
    """Data access layer for decks"""

    def __init__(self, db):
        self.db = db

    async def create_deck(self, deck_data: schemas.DeckCreate, user_id: int):
        """Create a new deck and store it in memory"""
        global NEXT_DECK_ID

        deck_id = NEXT_DECK_ID
        NEXT_DECK_ID += 1

        now = datetime.utcnow().isoformat()
        deck = {
            "deck_id": deck_id,
            "creator_id": user_id,
            "creator_name": f"User {user_id}",
            "name": deck_data.name,
            "description": deck_data.description,
            "is_public": deck_data.is_public,
            "save_count": 0,
            "created_at": now,
            "updated_at": now,
            "card_count": 0,
            "tags": deck_data.tags or [],
            "is_saved": False,
            "cards": [],
        }

        # Optionally create a simple card for each verse code passed
        global NEXT_CARD_ID
        if deck_data.verse_codes:
            for code in deck_data.verse_codes:
                card = {
                    "card_id": NEXT_CARD_ID,
                    "card_type": "single_verse",
                    "reference": code,
                    "verses": [
                        {
                            "verse_id": NEXT_CARD_ID,
                            "verse_code": code,
                            "book_id": 0,
                            "book_name": "",
                            "chapter_number": 0,
                            "verse_number": 0,
                            "reference": code,
                            "text": "",
                            "verse_order": 1,
                        }
                    ],
                    "position": len(deck["cards"]) + 1,
                    "added_at": now,
                }
                deck["cards"].append(card)
                deck["card_count"] += 1
                NEXT_CARD_ID += 1

        DECKS[deck_id] = deck

        return schemas.DeckResponse(**{k: v for k, v in deck.items() if k != "cards"})

    async def get_deck_by_id(self, deck_id: int, user_id: int):
        """Retrieve a deck by ID"""
        deck = DECKS.get(deck_id)
        if not deck:
            return None
        return deck

    async def get_user_decks(self, user_id: int, skip: int = 0, limit: int = 100):
        """Get all decks for a user"""
        decks = [d for d in DECKS.values() if d["creator_id"] == user_id]
        return decks[skip : skip + limit]

    async def update_deck(self, deck_id: int, deck_data: schemas.DeckUpdate):
        """Update a deck"""
        deck = DECKS.get(deck_id)
        if not deck:
            return None
        if deck_data.name is not None:
            deck["name"] = deck_data.name
        if deck_data.description is not None:
            deck["description"] = deck_data.description
        if deck_data.is_public is not None:
            deck["is_public"] = deck_data.is_public
        deck["updated_at"] = datetime.utcnow().isoformat()
        return deck

    async def delete_deck(self, deck_id: int) -> bool:
        """Delete a deck"""
        if deck_id in DECKS:
            del DECKS[deck_id]
            return True
        return False
