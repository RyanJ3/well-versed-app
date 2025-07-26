"""Verses API routes with authentication"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Annotated, Optional
from domain.verses import (
    VerseService,
    UserVerseResponse,
    VerseUpdate,
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

@router.get("/user-verses/{user_id}", response_model=List[UserVerseResponse], include_in_schema=False)
async def get_user_verses_compat(
    user_id: int,
    include_apocrypha: bool = False,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None
):
    """Compatibility endpoint - user can only access their own verses"""
    if current_user.user_id != user_id and not current_user.has_role("admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's verses"
        )
    return await service.get_user_verses(user_id, include_apocrypha)

@router.put("/user-verses/{user_id}/{book_id}/{chapter}/{verse}", include_in_schema=False)
async def save_verse_compat(
    user_id: int,
    book_id: int,
    chapter: int,
    verse: int,
    update: VerseUpdate,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[VerseService, Depends(get_verse_service)] = None
):
    """Compatibility endpoint"""
    if current_user.user_id != user_id and not current_user.has_role("admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify other user's verses"
        )
    return await save_or_update_verse(book_id, chapter, verse, update, current_user, service)
