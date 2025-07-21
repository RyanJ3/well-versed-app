from typing import List
from . import schemas, repository
from .exceptions import DeckNotFoundError

class DeckService:
    """Business logic for deck operations"""

    def __init__(self, repo: repository.DeckRepository):
        self.repo = repo

    async def create_deck(self, deck_data: schemas.DeckCreate, user_id: int) -> schemas.DeckResponse:
        deck = await self.repo.create_deck(deck_data, user_id)
        return deck

    async def get_user_decks(self, user_id: int, skip: int = 0, limit: int = 100) -> List[schemas.DeckResponse]:
        decks = await self.repo.get_user_decks(user_id, skip, limit)
        return [schemas.DeckResponse(**{k: v for k, v in d.items() if k != "cards"}) for d in decks]

    async def get_deck_with_cards(self, deck_id: int, user_id: int) -> schemas.DeckCardsResponse:
        deck = await self.repo.get_deck_by_id(deck_id, user_id)
        if not deck:
            raise DeckNotFoundError(deck_id)
        return schemas.DeckCardsResponse(
            deck_id=deck["deck_id"],
            deck_name=deck["name"],
            total_cards=len(deck.get("cards", [])),
            cards=[schemas.CardWithVerses(**c) for c in deck.get("cards", [])],
        )

    async def add_verses_to_deck(
        self, deck_id: int, user_id: int, request: schemas.AddVersesRequest
    ) -> schemas.CardWithVerses:
        deck = await self.repo.get_deck_by_id(deck_id, user_id)
        if not deck:
            raise DeckNotFoundError(deck_id)

        card = await self.repo.add_card(
            deck_id, request.verse_codes, reference=request.reference
        )
        if not card:
            raise DeckNotFoundError(deck_id)

        return schemas.CardWithVerses(**card)
