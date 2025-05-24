# backend/app/schemas/deck_schemas.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.schemas.verse_schemas import VerseResponse


class DeckBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_public: bool = False


class DeckCreate(DeckBase):
    verse_codes: Optional[List[str]] = []  # Format: ["GEN-1-1", "JOH-3-16"]
    tags: Optional[List[str]] = []


class DeckUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_public: Optional[bool] = None


class DeckVerseAdd(BaseModel):
    verse_codes: List[str]  # Format: ["GEN-1-1", "JOH-3-16"]


class DeckVerseReorder(BaseModel):
    verse_orders: List[dict]  # [{"verse_code": "GEN-1-1", "position": 0}]


class DeckInDB(BaseModel):
    deck_id: int
    creator_id: int
    name: str
    description: Optional[str]
    is_public: bool
    save_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DeckResponse(DeckInDB):
    creator_name: str
    verse_count: int
    tags: List[str]
    is_saved: bool = False  # For authenticated users


class DeckDetailResponse(DeckResponse):
    verses: List[VerseResponse]


class DeckListResponse(BaseModel):
    total: int
    decks: List[DeckResponse]


class DeckProgressResponse(BaseModel):
    deck_id: int
    deck_name: str
    total_verses: int
    memorized_verses: int
    progress_percentage: float
    confidence_breakdown: dict[int, int]  # {confidence_level: count}