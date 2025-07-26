from typing import List
from .repository import BookRepository
from .schemas import Book

class BookService:
    """Business logic for Bible books"""

    def __init__(self, repository: BookRepository):
        self.repo = repository

    def list_books(self) -> List[Book]:
        rows = self.repo.list_books()
        return [Book(**row) for row in rows]
