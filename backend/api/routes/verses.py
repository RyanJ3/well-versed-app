"""Verses API routes - unified from all implementations"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict
from pydantic import BaseModel
from domain.verses import (
    VerseService,
    UserVerseResponse,
    VerseUpdate,
    ConfidenceUpdate,
    ChapterSaveRequest,
    BookSaveRequest,
    VerseTextsRequest,
    VerseTextResponse,
    VerseNotFoundError,
    InvalidVerseCodeError,
)
from domain.core.exceptions import ValidationError
from core.dependencies import get_verse_service

router = APIRouter(prefix="/verses", tags=["verses"])


def get_current_user_id() -> int:
    """Placeholder for auth"""
    return 1


class VerseTextsRequestBody(BaseModel):
    verse_codes: List[str]
    bible_id: Optional[str] = None


@router.get("/", response_model=List[UserVerseResponse])
def get_user_verses(
    include_apocrypha: bool = False,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Get all verses for current user"""
    return service.get_user_verses(user_id, include_apocrypha)


@router.put("/{book_id}/{chapter}/{verse}", response_model=dict)
def save_or_update_verse(
    book_id: int,
    chapter: int,
    verse: int,
    update: VerseUpdate,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Save or update a single verse"""
    try:
        return service.save_or_update_verse(user_id, book_id, chapter, verse, update)
    except VerseNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidVerseCodeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{book_id}/{chapter}/{verse}/confidence", response_model=dict)
def update_verse_confidence(
    book_id: int,
    chapter: int,
    verse: int,
    update: ConfidenceUpdate,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Update confidence score for a verse"""
    try:
        return service.update_confidence(user_id, book_id, chapter, verse, update)
    except VerseNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.delete("/{book_id}/{chapter}/{verse}", response_model=dict)
def delete_verse(
    book_id: int,
    chapter: int,
    verse: int,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Delete a verse from memorization"""
    try:
        return service.delete_verse(user_id, book_id, chapter, verse)
    except InvalidVerseCodeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/chapters", response_model=dict)
def save_chapter(
    request: ChapterSaveRequest,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Save all verses in a chapter"""
    try:
        return service.save_chapter(user_id, request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/chapters/{book_id}/{chapter}", response_model=dict)
def clear_chapter(
    book_id: int,
    chapter: int,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Clear all verses in a chapter"""
    return service.clear_chapter(user_id, book_id, chapter)


@router.post("/books", response_model=dict)
def save_book(
    request: BookSaveRequest,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Save all verses in a book"""
    try:
        return service.save_book(user_id, request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/books/{book_id}", response_model=dict)
def clear_book(
    book_id: int,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Clear all verses in a book"""
    return service.clear_book(user_id, book_id)


@router.delete("/all", response_model=dict)
def clear_all_memorization(
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Clear all memorization data for user"""
    return service.clear_all_memorization(user_id)


@router.post("/texts", response_model=Dict[str, str])
def get_verse_texts(
    request: VerseTextsRequestBody,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Get verse texts from Bible API"""
    from routers.user_verses import get_verse_texts as old_implementation
    from database import DatabaseConnection
    import db_pool

    db = DatabaseConnection(db_pool.db_pool)
    return old_implementation(user_id, request, db)
