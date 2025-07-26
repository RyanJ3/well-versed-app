from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime


class VerseDetail(BaseModel):
    verse_id: str  # This is the verse_code (e.g., "40-1-1")
    book_id: int
    book_name: str
    chapter_number: int
    verse_number: int
    is_apocryphal: bool = False


class UserVerseResponse(BaseModel):
    verse: VerseDetail
    practice_count: int
    confidence_score: Optional[int] = None
    last_practiced: Optional[str]
    last_reviewed: Optional[str] = None
    created_at: str
    updated_at: Optional[str]


class VerseUpdate(BaseModel):
    practice_count: int
    last_practiced: Optional[datetime] = None


class ConfidenceUpdate(BaseModel):
    confidence_score: int = Field(..., ge=0, le=100)
    last_reviewed: Optional[datetime] = None


class ChapterSaveRequest(BaseModel):
    book_id: int
    chapter: int


class BookSaveRequest(BaseModel):
    book_id: int


class VerseTextsRequest(BaseModel):
    verse_codes: List[str]
    bible_id: Optional[str] = None


class VerseTextResponse(BaseModel):
    verse_code: str
    text: str
    book_name: str
    chapter: int
    verse: int

