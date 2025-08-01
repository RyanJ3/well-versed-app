"""User Pydantic schemas for validation"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1, max_length=100)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    password: Optional[str] = Field(None, min_length=6)
    denomination: Optional[str] = None
    preferred_bible: Optional[str] = None
    preferred_language: Optional[str] = None
    include_apocrypha: Optional[bool] = None
    use_esv_api: Optional[bool] = None
    esv_api_token: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    user_id: int = Field(alias="id")  # Map user_id to id in response
    email: str
    name: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    denomination: Optional[str] = None
    preferred_bible: Optional[str] = None
    preferred_language: Optional[str] = "eng"
    include_apocrypha: bool = False
    use_esv_api: bool = False
    esv_api_token: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Add these fields to match frontend expectations
    verses_memorized: Optional[int] = 0
    streak_days: Optional[int] = 0
    books_started: Optional[int] = 0

    class Config:
        from_attributes = True
        populate_by_name = True  # Allow both user_id and id
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserStats(BaseModel):
    user_id: int
    total_verses: int
    total_chapters: int
    total_books: int
    verses_by_book: Dict[str, int]
    recent_activity: List[Dict]
    streak_days: int
    last_active: Optional[datetime]
