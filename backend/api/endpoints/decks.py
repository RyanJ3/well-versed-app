from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from core.dependencies import get_deck_service
from domain.decks import schemas
from domain.decks.service import DeckService
from domain.decks.exceptions import DeckNotFoundError, DeckAccessDeniedError

router = APIRouter(prefix="/decks", tags=["decks"])


@router.post("/", response_model=schemas.DeckResponse, status_code=status.HTTP_201_CREATED)
async def create_deck(deck_data: schemas.DeckCreate, deck_service: DeckService = Depends(get_deck_service)):
    try:
        return await deck_service.create_deck(deck_data, user_id=1)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/user/{user_id}", response_model=schemas.DeckListResponse)
async def get_user_decks(user_id: int, deck_service: DeckService = Depends(get_deck_service)):
    decks = await deck_service.get_user_decks(user_id)
    return schemas.DeckListResponse(total=len(decks), decks=decks)


@router.get("/{deck_id}", response_model=schemas.DeckCardsResponse)
async def get_deck(deck_id: int, deck_service: DeckService = Depends(get_deck_service)):
    try:
        return await deck_service.get_deck_with_cards(deck_id, user_id=1)
    except DeckNotFoundError:
        raise HTTPException(status_code=404, detail="Deck not found")
    except DeckAccessDeniedError:
        raise HTTPException(status_code=403, detail="Access denied")
