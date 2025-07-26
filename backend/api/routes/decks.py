"""Decks API routes with authentication"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Annotated, Optional
from domain.decks import (
    DeckService,
    DeckCreate,
    DeckUpdate,
    DeckResponse,
    DeckListResponse,
    DeckCardsResponse,
    AddVersesRequest,
    DeckNotFoundError,
    DeckAccessDeniedError
)
from domain.auth import UserContext
from core.dependencies import get_deck_service
from core.auth_dependencies import get_current_user, get_optional_user

router = APIRouter(prefix="/decks", tags=["decks"])

@router.post("/", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
async def create_deck(
    deck_data: DeckCreate,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[DeckService, Depends(get_deck_service)] = None
):
    """Create a new deck"""
    return await service.create_deck(deck_data, current_user.user_id)

@router.get("/", response_model=List[DeckResponse])
async def get_my_decks(
    skip: int = 0,
    limit: int = 100,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[DeckService, Depends(get_deck_service)] = None
):
    """Get current user's decks"""
    return await service.get_user_decks(current_user.user_id, skip, limit)

@router.get("/public", response_model=List[DeckResponse])
async def get_public_decks(
    skip: int = 0,
    limit: int = 20,
    current_user: Annotated[Optional[UserContext], Depends(get_optional_user)] = None,
    service: Annotated[DeckService, Depends(get_deck_service)] = None
):
    """Get public decks (authentication optional)"""
    user_id = current_user.user_id if current_user else None
    return await service.get_public_decks(skip, limit, user_id)

@router.get("/{deck_id}", response_model=DeckCardsResponse)
async def get_deck_with_cards(
    deck_id: int,
    current_user: Annotated[Optional[UserContext], Depends(get_optional_user)] = None,
    service: Annotated[DeckService, Depends(get_deck_service)] = None
):
    """Get deck with all cards (public decks don't require auth)"""
    try:
        user_id = current_user.user_id if current_user else None
        return await service.get_deck_with_cards(deck_id, user_id)
    except DeckNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deck {deck_id} not found"
        )
    except DeckAccessDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this deck"
        )

@router.put("/{deck_id}", response_model=DeckResponse)
async def update_deck(
    deck_id: int,
    deck_data: DeckUpdate,
    current_user: Annotated[UserContext, Depends(get_current_user)] = None,
    service: Annotated[DeckService, Depends(get_deck_service)] = None
):
    """Update deck details (owner only)"""
    try:
        return await service.update_deck(deck_id, deck_data, current_user.user_id)
    except DeckNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deck {deck_id} not found"
        )
    except DeckAccessDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this deck"
        )
