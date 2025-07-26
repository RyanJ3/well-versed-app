"""API routes - thin HTTP layer that delegates to domain services"""

from . import users, books

__all__ = ["users", "books"]
