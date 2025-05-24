# backend/app/schemas/verse_schemas.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.enums import TestamentType, BookGroupType, CanonicalType


class VerseBase(BaseModel):
    verse_id: int
    confidence_level: int = Field(ge=0, le=5, default=0)


class VerseCreate(VerseBase):
    pass


class VerseUpdate(BaseModel):
    confidence_level: int = Field(ge=0, le=5)
    
    
class BatchVerseUpdate(BaseModel):
    verse_codes: List[str]  # Format: "BOOK-CHAPTER-VERSE"
    confidence_level: int = Field(ge=0, le=5)


class VerseInDB(BaseModel):
    id: int
    user_id: int
    verse_id: int
    confidence_level: int
    review_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BookInfo(BaseModel):
    book_id: int
    book_code: str
    book_name: str
    testament: TestamentType
    book_group: BookGroupType
    canonical_affiliation: CanonicalType
    
    class Config:
        from_attributes = True


class VerseResponse(BaseModel):
    id: int
    user_id: int
    verse_id: int
    verse_code: str  # Format: "BOOK-CHAPTER-VERSE"
    book: BookInfo
    chapter_number: int
    verse_number: int
    confidence_level: int
    review_count: int
    created_at: datetime
    updated_at: datetime
    
    
class UserVersesResponse(BaseModel):
    user_id: int
    total_verses: int
    confidence_breakdown: dict[int, int]  # {confidence_level: count}
    verses: List[VerseResponse]
    
    
class ConfidenceUpdateRequest(BaseModel):
    verse_code: str  # Format: "BOOK-CHAPTER-VERSE"
    confidence_level: int = Field(ge=0, le=5)
    
    
class BulkConfidenceUpdateRequest(BaseModel):
    updates: List[ConfidenceUpdateRequest]