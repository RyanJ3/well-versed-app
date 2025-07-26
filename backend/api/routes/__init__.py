"""API routes - thin HTTP layer that delegates to domain services"""

from . import users, books, verses, decks, auth

__all__ = ["users", "books", "verses", "decks", "auth"]
