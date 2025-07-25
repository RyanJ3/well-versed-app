class VerseException(Exception):
    """Base exception for verse operations"""
    pass


class VerseNotFoundError(VerseException):
    def __init__(self, verse_code: str):
        super().__init__(f"Verse {verse_code} not found")
        self.verse_code = verse_code


class InvalidVerseCodeError(VerseException):
    def __init__(self, verse_code: str):
        super().__init__(f"Invalid verse code format: {verse_code}")
        self.verse_code = verse_code
