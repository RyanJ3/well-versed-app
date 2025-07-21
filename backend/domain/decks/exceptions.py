class DeckException(Exception):
    """Base exception for deck operations"""
    pass

class DeckNotFoundError(DeckException):
    def __init__(self, deck_id: int):
        super().__init__(f"Deck with id {deck_id} not found")
        self.deck_id = deck_id

class DeckAccessDeniedError(DeckException):
    def __init__(self, deck_id: int, user_id: int):
        super().__init__(f"User {user_id} does not have access to deck {deck_id}")
        self.deck_id = deck_id
        self.user_id = user_id

class InvalidCardDataError(DeckException):
    pass
