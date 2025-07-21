from pydantic import BaseModel
from typing import List, Optional

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
    card_count: int
    tags: List[str] = []
    is_saved: bool = False


class DeckListResponse(BaseModel):
    total: int
    decks: List[DeckResponse]


class CardWithVerses(BaseModel):
    card_id: int
    card_type: str
    reference: str
    verses: List[dict]
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
    reference: Optional[str] = None
