"""Verse data access layer - consolidated from all implementations"""

from typing import List, Optional, Dict
from datetime import datetime
import logging
from database import DatabaseConnection
from domain.core import BaseRepository
from utils.performance import track_queries
from utils.batch_loader import BatchLoader

logger = logging.getLogger(__name__)


class VerseRepository(BaseRepository):
    """Repository for verse operations"""

    def __init__(self, db: DatabaseConnection):
        super().__init__(db)
        self._verse_cache: Dict[str, Dict] = {}

    @track_queries(max_queries=1)
    def get_user_verses(self, user_id: int, include_apocrypha: bool = False) -> List[Dict]:
        """Get all verses for a user"""
        query = """
            SELECT 
                uv.verse_id,
                bv.verse_code,
                bv.book_id,
                bb.book_name,
                bv.chapter_number,
                bv.verse_number,
                bv.is_apocryphal,
                uv.practice_count,
                uv.confidence_score,
                uv.last_practiced,
                uv.last_reviewed,
                uv.created_at,
                uv.updated_at
            FROM user_verses uv
            JOIN bible_verses bv ON uv.verse_id = bv.id
            JOIN bible_books bb ON bv.book_id = bb.book_id
            WHERE uv.user_id = %s
        """
        if not include_apocrypha:
            query += " AND bv.is_apocryphal = FALSE"
        query += " ORDER BY bv.book_id, bv.chapter_number, bv.verse_number"

        return self.db.fetch_all(query, (user_id,))

    @track_queries(max_queries=1)
    def get_verse_by_code(self, verse_code: str) -> Optional[Dict]:
        """Get verse by code with caching"""
        if verse_code in self._verse_cache:
            return self._verse_cache[verse_code]

        verse = self.db.fetch_one(
            """
            SELECT 
                id, verse_code, book_id, chapter_number, 
                verse_number, is_apocryphal
            FROM bible_verses 
            WHERE verse_code = %s
            """,
            (verse_code,)
        )

        if verse:
            self._verse_cache[verse_code] = verse
        return verse

    @track_queries(max_queries=2)
    def get_verses_batch(self, verse_codes: List[str]) -> Dict[str, Dict]:
        """Get multiple verses efficiently"""
        if not verse_codes:
            return {}

        # Check cache first
        uncached_codes = []
        cached_verses = {}

        for code in verse_codes:
            if code in self._verse_cache:
                cached_verses[code] = self._verse_cache[code]
            else:
                uncached_codes.append(code)

        # Fetch uncached verses
        if uncached_codes:
            query = """
                SELECT 
                    verse_code, id, book_id, chapter_number, 
                    verse_number, is_apocryphal
                FROM bible_verses
                WHERE verse_code = ANY(%s)
            """
            verses = self.db.fetch_all(query, (uncached_codes,))

            for verse in verses:
                code = verse['verse_code']
                self._verse_cache[code] = verse
                cached_verses[code] = verse

        return cached_verses

    @track_queries(max_queries=1)
    def save_verse(self, user_id: int, verse_id: int, practice_count: int = 1, last_practiced: datetime | None = None) -> Dict:
        """Save or update a user verse"""
        if last_practiced is None:
            last_practiced = datetime.now()

        query = """
            INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, verse_id) DO UPDATE SET
                practice_count = EXCLUDED.practice_count,
                last_practiced = EXCLUDED.last_practiced,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        """
        return self.db.fetch_one(query, (user_id, verse_id, practice_count, last_practiced))

    @track_queries(max_queries=1)
    def update_confidence(self, user_id: int, verse_id: int, confidence_score: int) -> Dict:
        """Update verse confidence score"""
        query = """
            UPDATE user_verses
            SET confidence_score = %s,
                last_reviewed = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s AND verse_id = %s
            RETURNING *
        """
        return self.db.fetch_one(query, (confidence_score, user_id, verse_id))

    @track_queries(max_queries=1)
    def delete_verse(self, user_id: int, verse_id: int) -> bool:
        """Delete a user verse"""
        query = "DELETE FROM user_verses WHERE user_id = %s AND verse_id = %s RETURNING 1"
        result = self.db.fetch_one(query, (user_id, verse_id))
        return result is not None

    @track_queries(max_queries=2)
    def save_chapter(self, user_id: int, book_id: int, chapter_num: int) -> Dict[str, any]:
        """Save all verses in a chapter"""
        # Get all verses in chapter
        verses = self.db.fetch_all(
            "SELECT id FROM bible_verses WHERE book_id = %s AND chapter_number = %s",
            (book_id, chapter_num)
        )

        if not verses:
            raise ValueError(f"Chapter {book_id}:{chapter_num} not found")

        # Bulk insert
        verse_ids = [v['id'] for v in verses]
        query = """
            INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
            SELECT %s, unnest(%s::int[]), 1, NOW()
            ON CONFLICT (user_id, verse_id) DO UPDATE SET
                practice_count = user_verses.practice_count + 1,
                last_practiced = EXCLUDED.last_practiced,
                updated_at = CURRENT_TIMESTAMP
        """
        self.db.execute(query, (user_id, verse_ids))

        return {"message": "Chapter saved successfully", "verses_count": len(verses)}

    @track_queries(max_queries=2)
    def clear_chapter(self, user_id: int, book_id: int, chapter_num: int) -> Dict[str, str]:
        """Clear all verses in a chapter"""
        query = """
            DELETE FROM user_verses
            WHERE user_id = %s AND verse_id IN (
                SELECT id FROM bible_verses 
                WHERE book_id = %s AND chapter_number = %s
            )
        """
        self.db.execute(query, (user_id, book_id, chapter_num))
        return {"message": "Chapter cleared successfully"}

    @track_queries(max_queries=2)
    def save_book(self, user_id: int, book_id: int) -> Dict[str, any]:
        """Save all verses in a book"""
        # Get all verses in book
        verses = self.db.fetch_all(
            "SELECT id FROM bible_verses WHERE book_id = %s",
            (book_id,)
        )

        if not verses:
            raise ValueError(f"Book {book_id} not found")

        # Bulk insert in chunks to avoid query size limits
        verse_ids = [v['id'] for v in verses]
        chunks = BatchLoader.chunk_list(verse_ids, chunk_size=1000)

        for chunk in chunks:
            query = """
                INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
                SELECT %s, unnest(%s::int[]), 1, NOW()
                ON CONFLICT (user_id, verse_id) DO UPDATE SET
                    practice_count = user_verses.practice_count + 1,
                    last_practiced = EXCLUDED.last_practiced,
                    updated_at = CURRENT_TIMESTAMP
            """
            self.db.execute(query, (user_id, chunk))

        return {"message": "Book saved successfully", "verses_count": len(verses)}

    @track_queries(max_queries=1)
    def clear_book(self, user_id: int, book_id: int) -> Dict[str, str]:
        """Clear all verses in a book"""
        query = """
            DELETE FROM user_verses
            WHERE user_id = %s AND verse_id IN (
                SELECT id FROM bible_verses WHERE book_id = %s
            )
        """
        self.db.execute(query, (user_id, book_id))
        return {"message": "Book cleared successfully"}

    @track_queries(max_queries=1)
    def clear_all_verses(self, user_id: int) -> Dict[str, str]:
        """Clear all memorization data for user"""
        query = "DELETE FROM user_verses WHERE user_id = %s"
        self.db.execute(query, (user_id,))
        return {"message": "All memorization data cleared"}
