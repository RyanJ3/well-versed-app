"""Verse schemas - consolidated from all implementations"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class VerseDetail(BaseModel):
    verse_id: str  # verse_code
    book_id: int
    book_name: Optional[str] = None
    chapter_number: int
    verse_number: int
    is_apocryphal: bool = False


class UserVerseResponse(BaseModel):
    verse: VerseDetail
    practice_count: int
    confidence_score: Optional[int] = None
    last_practiced: Optional[str] = None
    last_reviewed: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


class VerseUpdate(BaseModel):
    practice_count: int = Field(..., ge=0)
    last_practiced: Optional[datetime] = None


class ConfidenceUpdate(BaseModel):
    confidence_score: int = Field(..., ge=0, le=100)
    last_reviewed: Optional[datetime] = None


class ChapterSaveRequest(BaseModel):
    book_id: int = Field(..., ge=1, le=73)
    chapter: int = Field(..., ge=1)


class BookSaveRequest(BaseModel):
    book_id: int = Field(..., ge=1, le=73)


class VerseTextsRequest(BaseModel):
    verse_codes: List[str]
    bible_id: Optional[str] = None


class VerseTextResponse(BaseModel):
    verse_code: str
    text: str
    book_name: str
    chapter: int
    verse: int


class ChapterStatusResponse(BaseModel):
    total_verses: int
    memorized_verses: int
    memorized_verse_numbers: List[int]
    is_complete: bool


class BulkOperationResponse(BaseModel):
    message: str
    verses_count: Optional[int] = None
