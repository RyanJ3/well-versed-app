"""Verses API routes with authentication"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Annotated, Optional
from domain.verses import (
    VerseService,
    UserVerseResponse,
    VerseUpdate,
    ConfidenceUpdate,
    VerseTextsRequest,
    VerseNotFoundError,
    InvalidVerseCodeError
)
from domain.auth import UserContext
from domain.core.exceptions import ValidationError
from core.dependencies import get_verse_service
from core.auth_dependencies import get_current_user, get_current_user_id

router = APIRouter(prefix="/verses", tags=["verses"])

@router.get("/", response_model=List[UserVerseResponse])
async def get_user_verses(
    include_apocrypha: bool = False,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None
):
    """Get all verses for current user"""
    return await service.get_user_verses(current_user.user_id, include_apocrypha)

@router.put("/{book_id}/{chapter}/{verse}", response_model=dict)
async def save_or_update_verse(
    book_id: int,
    chapter: int,
    verse: int,
    update: VerseUpdate,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None
):
    """Save or update a single verse"""
    try:
        return await service.save_or_update_verse(
            current_user.user_id, book_id, chapter, verse, update
        )
    except VerseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except InvalidVerseCodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/chapters/{book_id}/{chapter}", response_model=dict)
async def save_chapter(
    book_id: int,
    chapter: int,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None,
):
    return await service.save_chapter(current_user.user_id, book_id, chapter)


@router.delete("/chapters/{book_id}/{chapter}", response_model=dict)
async def clear_chapter(
    book_id: int,
    chapter: int,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None,
):
    return await service.clear_chapter(current_user.user_id, book_id, chapter)


@router.post("/books/{book_id}", response_model=dict)
async def save_book(
    book_id: int,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None,
):
    return await service.save_book(current_user.user_id, book_id)


@router.delete("/books/{book_id}", response_model=dict)
async def clear_book(
    book_id: int,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None,
):
    return await service.clear_book(current_user.user_id, book_id)


@router.post("/texts", response_model=dict)
async def get_verse_texts(
    request: VerseTextsRequest,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None,
):
    try:
        texts = await service.get_verse_texts(current_user.user_id, request.verse_codes, request.bible_id)
        return texts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/confidence/{verse_id}", response_model=dict)
async def update_confidence(
    verse_id: int,
    update: ConfidenceUpdate,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None,
):
    return await service.update_confidence(current_user.user_id, verse_id, update.confidence_score, update.last_reviewed)


@router.delete("/", response_model=dict)
async def clear_all(current_user: Annotated[UserContext, Depends(get_current_user)], service: Annotated[VerseService, Depends(get_verse_service)]):
    return await service.clear_all_memorization(current_user.user_id)

