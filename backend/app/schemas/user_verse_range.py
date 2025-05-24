# app/schemas/user_verse_range.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class UserVerseRange(BaseModel):
    range_id: Optional[int]
    user_id: int
    book_id: int
    chapter_start: int
    verse_start: int
    chapter_end: int
    verse_end: int
    range_name: Optional[str] = None
    notes: Optional[str] = None
    difficulty_level: Optional[int] = Field(default=1, ge=1, le=5)
    mastery_level: Optional[int] = Field(default=0, ge=0, le=100)
    last_reviewed: Optional[datetime] = None
    next_review: Optional[datetime] = None
    review_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True
