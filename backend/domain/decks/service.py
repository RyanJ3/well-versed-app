from typing import List, Dict
import logging
from . import schemas, repository
from .exceptions import DeckNotFoundError

logger = logging.getLogger(__name__)

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

    async def get_public_decks(self, skip: int = 0, limit: int = 20) -> List[schemas.DeckResponse]:
        decks = await self.repo.get_public_decks(skip, limit)
        return [
            schemas.DeckResponse(**{k: v for k, v in d.items() if k != "cards"})
            for d in decks
        ]

    async def get_deck_with_cards(self, deck_id: int, user_id: int) -> schemas.DeckCardsResponse:
        deck = await self.repo.get_deck_with_cards(deck_id, user_id)
        if not deck:
            raise DeckNotFoundError(deck_id)
            
        # Populate verse text for all verses in all cards
        cards_with_text = await self._populate_verse_text(deck.get("cards", []), user_id)
        
        return schemas.DeckCardsResponse(
            deck_id=deck["deck_id"],
            deck_name=deck["name"],
            total_cards=len(cards_with_text),
            cards=[schemas.CardWithVerses(**c) for c in cards_with_text],
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

    async def delete_deck(self, deck_id: int) -> dict:
        """Delete a deck by id"""
        deleted = await self.repo.delete_deck(deck_id)
        if not deleted:
            raise DeckNotFoundError(deck_id)
        return {"message": "Deck deleted successfully"}
    
    async def _populate_verse_text(self, cards: List[Dict], user_id: int) -> List[Dict]:
        """Populate verse text for all verses in cards"""
        try:
            # Collect all unique verse codes
            verse_codes = set()
            for card in cards:
                for verse in card.get("verses", []):
                    verse_codes.add(verse["verse_code"])
            
            if not verse_codes:
                return cards
            
            # Get verse text using the verse text service
            verse_texts = await self._get_verse_texts(list(verse_codes), user_id)
            
            # Update cards with verse text
            updated_cards = []
            for card in cards:
                updated_card = dict(card)
                updated_verses = []
                for verse in card.get("verses", []):
                    updated_verse = dict(verse)
                    verse_code = verse["verse_code"]
                    updated_verse["text"] = verse_texts.get(verse_code, f"Unable to load text for {verse.get('reference', verse_code)}")
                    updated_verses.append(updated_verse)
                updated_card["verses"] = updated_verses
                updated_cards.append(updated_card)
            
            return updated_cards
            
        except Exception as e:
            logger.error(f"Error populating verse text: {e}")
            # Return cards with fallback text
            updated_cards = []
            for card in cards:
                updated_card = dict(card)
                updated_verses = []
                for verse in card.get("verses", []):
                    updated_verse = dict(verse)
                    updated_verse["text"] = f"Unable to load text for {verse.get('reference', verse['verse_code'])}"
                    updated_verses.append(updated_verse)
                updated_card["verses"] = updated_verses
                updated_cards.append(updated_card)
            return updated_cards
    
    async def _get_verse_texts(self, verse_codes: List[str], user_id: int) -> Dict[str, str]:
        """Get verse texts using the same logic as the verse text endpoint"""
        try:
            from services.api_bible import APIBibleService
            from services.esv_api import ESVService, ESVRateLimitError
            from config import Config
            
            # Get user preferences 
            user_query = """
                SELECT use_esv_api, esv_api_token, preferred_bible 
                FROM users 
                WHERE user_id = %s
            """
            user_row = self.repo.db.fetch_one(user_query, (user_id,))
            
            use_esv = user_row and user_row.get("use_esv_api", False)
            esv_token = user_row and user_row.get("esv_api_token")
            bible_id = user_row and user_row.get("preferred_bible") or Config.DEFAULT_BIBLE_ID
            
            if use_esv and esv_token:
                logger.info("Using ESV API for verse texts")
                # Get verse references
                refs_query = """
                    SELECT bv.verse_code, bb.book_name, bv.chapter_number, bv.verse_number
                    FROM bible_verses bv
                    JOIN bible_books bb ON bv.book_id = bb.book_id
                    WHERE bv.verse_code = ANY(%s)
                """
                refs_rows = self.repo.db.fetch_all(refs_query, (verse_codes,))
                ref_map = {
                    row["verse_code"]: f"{row['book_name']} {row['chapter_number']}:{row['verse_number']}"
                    for row in refs_rows
                }
                
                esv = ESVService(esv_token)
                verse_texts = esv.get_verses_batch(ref_map)
            else:
                logger.info("Using API.Bible for verse texts")
                api_bible = APIBibleService(Config.API_BIBLE_KEY, bible_id)
                verse_texts = api_bible.get_verses_batch(verse_codes, bible_id)
            
            # Ensure all requested codes are present
            return {code: verse_texts.get(code, "") for code in verse_codes}
            
        except Exception as e:
            if "ESVRateLimitError" in str(type(e)):
                logger.warning(f"ESV rate limit hit: {e}")
                raise e
            logger.error(f"Error getting verse texts: {e}")
            return {code: "" for code in verse_codes}
