"""API routes - thin HTTP layer that delegates to domain services"""

from . import users, books, verses

__all__ = ["users", "books", "verses"]
