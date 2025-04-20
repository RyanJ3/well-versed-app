# backend/app/api/__init__.py
from fastapi import APIRouter

router = APIRouter()

from .endpoints import bible_tracker  # Import the bible_tracker endpoints

router.include_router(bible_tracker.router, prefix="/bible_tracker", tags=["bible_tracker"])