from typing import List
from . import schemas, repository
from .exceptions import DeckNotFoundError

class DeckService:
    """Business logic for deck operations"""

    def __init__(self, repo: repository.DeckRepository):
        self.repo = repo

    async def create_deck(self, deck_data: schemas.DeckCreate, user_id: int) -> schemas.DeckResponse:
        return await self.repo.create_deck(deck_data, user_id)

    async def get_user_decks(self, user_id: int, skip: int = 0, limit: int = 100) -> List[schemas.DeckResponse]:
        return await self.repo.get_user_decks(user_id, skip, limit)

    async def get_deck_with_cards(self, deck_id: int, user_id: int):
        deck = await self.repo.get_deck_by_id(deck_id, user_id)
        if not deck:
            raise DeckNotFoundError(deck_id)
        return deck
