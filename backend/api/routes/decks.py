"""Decks API routes - thin HTTP layer"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from domain.decks import (
    DeckService,
    DeckCreate,
    DeckUpdate,
    DeckResponse,
    DeckListResponse,
    DeckCardsResponse,
    AddVersesRequest,
    DeckNotFoundError,
    DeckAccessDeniedError,
)
from core.dependencies import get_deck_service

router = APIRouter(prefix="/decks", tags=["decks"])

# Get current user ID (placeholder - implement proper auth)

def get_current_user_id() -> int:
    return 1  # Replace with actual auth


@router.post("", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
async def create_deck(
    deck_data: DeckCreate,
    user_id: int = Depends(get_current_user_id),
    service: DeckService = Depends(get_deck_service),
):
    """Create a new deck"""
    return await service.create_deck(deck_data, user_id)


@router.get("/user/{user_id}", response_model=DeckListResponse)
async def get_user_decks(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    service: DeckService = Depends(get_deck_service),
):
    """Get decks for a specific user"""
    decks = await service.get_user_decks(user_id, skip, limit)
    return DeckListResponse(total=len(decks), decks=decks)


@router.get("/my-decks", response_model=DeckListResponse)
async def get_my_decks(
    skip: int = 0,
    limit: int = 100,
    user_id: int = Depends(get_current_user_id),
    service: DeckService = Depends(get_deck_service),
):
    """Get current user's decks"""
    decks = await service.get_user_decks(user_id, skip, limit)
    return DeckListResponse(total=len(decks), decks=decks)


@router.get("/public", response_model=DeckListResponse)
async def get_public_decks(
    skip: int = 0,
    limit: int = 20,
    service: DeckService = Depends(get_deck_service),
):
    """Get public decks"""
    decks = await service.get_public_decks(skip, limit)
    return DeckListResponse(total=len(decks), decks=decks)


@router.get("/{deck_id}", response_model=DeckResponse)
async def get_deck(
    deck_id: int,
    user_id: int = Depends(get_current_user_id),
    service: DeckService = Depends(get_deck_service),
):
    """Get deck details"""
    try:
        return await service.get_deck(deck_id, user_id)
    except DeckNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deck {deck_id} not found")


@router.get("/{deck_id}/cards", response_model=DeckCardsResponse)
async def get_deck_cards(
    deck_id: int,
    bible_id: Optional[str] = None,
    user_id: int = Depends(get_current_user_id),
    service: DeckService = Depends(get_deck_service),
):
    """Get deck with all cards"""
    try:
        return await service.get_deck_with_cards(deck_id, user_id, bible_id)
    except DeckNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deck {deck_id} not found")


@router.put("/{deck_id}", response_model=DeckResponse)
async def update_deck(
    deck_id: int,
    deck_data: DeckUpdate,
    user_id: int = Depends(get_current_user_id),
    service: DeckService = Depends(get_deck_service),
):
    """Update deck details"""
    try:
        return await service.update_deck(deck_id, deck_data, user_id)
    except DeckNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deck {deck_id} not found")
    except DeckAccessDeniedError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to update this deck")


@router.delete("/{deck_id}")
async def delete_deck(
    deck_id: int,
    user_id: int = Depends(get_current_user_id),
    service: DeckService = Depends(get_deck_service),
):
    """Delete a deck"""
    try:
        return await service.delete_deck(deck_id, user_id)
    except DeckNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deck {deck_id} not found")
    except DeckAccessDeniedError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to delete this deck")


@router.post("/{deck_id}/cards")
async def add_verses_to_deck(
    deck_id: int,
    request: AddVersesRequest,
    user_id: int = Depends(get_current_user_id),
    service: DeckService = Depends(get_deck_service),
):
    """Add verses to a deck"""
    try:
        return await service.add_verses_to_deck(deck_id, user_id, request)
    except DeckNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Deck {deck_id} not found")
    except DeckAccessDeniedError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to modify this deck")
