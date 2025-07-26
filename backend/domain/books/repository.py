from domain.core import BaseRepository
from typing import List, Dict

class BookRepository(BaseRepository):
    """Data access layer for Bible books"""

    def list_books(self) -> List[Dict]:
        query = "SELECT * FROM bible_books ORDER BY book_id"
        return self.db.fetch_all(query)
