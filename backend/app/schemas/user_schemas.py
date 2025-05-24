# backend/app/schemas/user_schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    denomination: Optional[str] = None
    preferred_bible: Optional[str] = None
    include_apocrypha: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: str
    denomination: Optional[str] = None
    preferred_bible: Optional[str] = None
    include_apocrypha: bool = False
    verses_memorized: int = 0
    streak_days: int = 0
    books_started: int = 0