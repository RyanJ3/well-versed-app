"""Verse data access layer"""

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
        self._cache_max_size = 1000

    def _add_to_cache(self, verse_code: str, verse: Dict):
        """Add verse to cache with size limit"""
        if len(self._verse_cache) >= self._cache_max_size:
            self._verse_cache.pop(next(iter(self._verse_cache)))
        self._verse_cache[verse_code] = verse

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

    def get_verse_by_code(self, verse_code: str) -> Optional[Dict]:
        """Get verse by code with caching"""
        if verse_code in self._verse_cache:
            return self._verse_cache[verse_code]
        verse = self.db.fetch_one(
            "SELECT id, book_id, chapter_number, verse_number, is_apocryphal "
            "FROM bible_verses WHERE verse_code = %s",
            (verse_code,),
        )
        if verse:
            self._verse_cache[verse_code] = verse
        return verse

    @track_queries(max_queries=2)
    def get_verses_batch(self, verse_codes: List[str]) -> Dict[str, Dict]:
        """Get multiple verses in batch"""
        if not verse_codes:
            return {}
        uncached_codes = []
        cached_verses = {}
        for code in verse_codes:
            if code in self._verse_cache:
                cached_verses[code] = self._verse_cache[code]
            else:
                uncached_codes.append(code)
        if uncached_codes:
            query = """
                SELECT verse_code, id, book_id, chapter_number, verse_number, is_apocryphal
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
    def bulk_upsert_verses(self, user_id: int, verse_data: List[tuple]) -> None:
        """Bulk upsert verses using a single query with UNNEST"""
        if not verse_data:
            return
        query = """
            INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
            SELECT %s, unnest(%s::int[]), unnest(%s::int[]), unnest(%s::timestamp[])
            ON CONFLICT (user_id, verse_id) DO UPDATE SET
                practice_count = EXCLUDED.practice_count,
                last_practiced = EXCLUDED.last_practiced,
                updated_at = CURRENT_TIMESTAMP
        """
        verse_ids = [v[0] for v in verse_data]
        practice_counts = [v[1] for v in verse_data]
        last_practiced_dates = [v[2] for v in verse_data]
        self.db.execute(query, (user_id, verse_ids, practice_counts, last_practiced_dates))

    @track_queries(max_queries=2)
    def save_chapter(self, user_id: int, book_id: int, chapter_num: int) -> Dict[str, any]:
        """Save all verses in a chapter with just 2 queries"""
        verses = self.db.fetch_all(
            "SELECT id FROM bible_verses WHERE book_id = %s AND chapter_number = %s",
            (book_id, chapter_num)
        )
        if not verses:
            raise ValueError(f"Chapter {book_id}:{chapter_num} not found")
        verse_ids = [v['id'] for v in verses]
        query = """
            INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
            SELECT %s, unnest(%s::int[]), 1, NOW()
            ON CONFLICT (user_id, verse_id) DO UPDATE SET
                practice_count = EXCLUDED.practice_count,
                last_practiced = EXCLUDED.last_practiced,
                updated_at = CURRENT_TIMESTAMP
        """
        self.db.execute(query, (user_id, verse_ids))
        return {"message": "Chapter saved successfully", "verses_count": len(verses)}

    def get_verses_in_chapter(self, book_id: int, chapter_num: int) -> List[Dict]:
        query = "SELECT id FROM bible_verses WHERE book_id = %s AND chapter_number = %s"
        return self.db.fetch_all(query, (book_id, chapter_num))

    def get_verses_in_book(self, book_id: int) -> List[Dict]:
        query = "SELECT id FROM bible_verses WHERE book_id = %s"
        return self.db.fetch_all(query, (book_id,))

    def upsert_user_verse(self, user_id: int, verse_id: int, practice_count: int, last_practiced: datetime) -> None:
        query = """
            INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, verse_id) DO UPDATE SET
                practice_count = EXCLUDED.practice_count,
                last_practiced = EXCLUDED.last_practiced,
                updated_at = CURRENT_TIMESTAMP
        """
        self.db.execute(query, (user_id, verse_id, practice_count, last_practiced))

    def delete_user_verse(self, user_id: int, verse_id: int) -> None:
        self.db.execute("DELETE FROM user_verses WHERE user_id = %s AND verse_id = %s", (user_id, verse_id))

    def delete_verses_by_chapter(self, user_id: int, book_id: int, chapter_num: int) -> None:
        query = """
            DELETE FROM user_verses
            WHERE user_id = %s
              AND verse_id IN (
                SELECT id FROM bible_verses WHERE book_id = %s AND chapter_number = %s
            )
        """
        self.db.execute(query, (user_id, book_id, chapter_num))

    def delete_verses_by_book(self, user_id: int, book_id: int) -> None:
        query = """
            DELETE FROM user_verses
            WHERE user_id = %s
              AND verse_id IN (
                SELECT id FROM bible_verses WHERE book_id = %s
            )
        """
        self.db.execute(query, (user_id, book_id))

    @track_queries(max_queries=2)
    def save_book(self, user_id: int, book_id: int) -> Dict[str, any]:
        """Save all verses in a book with just 2 queries"""
        verses = self.db.fetch_all(
            "SELECT id FROM bible_verses WHERE book_id = %s",
            (book_id,)
        )
        if not verses:
            raise ValueError(f"Book {book_id} not found")
        verse_ids = [v['id'] for v in verses]
        chunks = BatchLoader.chunk_list(verse_ids, chunk_size=1000)
        for chunk in chunks:
            query = """
                INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
                SELECT %s, unnest(%s::int[]), 1, NOW()
                ON CONFLICT (user_id, verse_id) DO UPDATE SET
                    practice_count = EXCLUDED.practice_count,
                    last_practiced = EXCLUDED.last_practiced,
                    updated_at = CURRENT_TIMESTAMP
            """
            self.db.execute(query, (user_id, chunk))
        return {"message": "Book saved successfully", "verses_count": len(verses)}

    def clear_cache(self):
        """Clear the verse cache"""
        self._verse_cache.clear()

    # New helper methods for text retrieval and confidence tracking

    def get_user_preferences(self, user_id: int) -> Optional[Dict]:
        """Return user's verse text preferences"""
        query = "SELECT use_esv_api, esv_api_token FROM users WHERE user_id = %s"
        return self.db.fetch_one(query, (user_id,))

    def get_verse_references(self, verse_codes: List[str]) -> Dict[str, str]:
        """Map verse codes to references for ESV API"""
        if not verse_codes:
            return {}
        query = """
            SELECT bv.verse_code, bb.book_name, bv.chapter_number, bv.verse_number
            FROM bible_verses bv
            JOIN bible_books bb ON bv.book_id = bb.book_id
            WHERE bv.verse_code = ANY(%s)
        """
        refs = self.db.fetch_all(query, (verse_codes,))
        return {
            r["verse_code"]: f"{r['book_name']} {r['chapter_number']}:{r['verse_number']}"
            for r in refs
        }

    def update_confidence(self, user_id: int, verse_id: int, score: int, last_reviewed: datetime) -> None:
        """Insert or update confidence score for a verse"""
        query = """
            INSERT INTO user_verse_confidence (user_id, verse_id, confidence_score, last_reviewed)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, verse_id) DO UPDATE SET
                confidence_score = EXCLUDED.confidence_score,
                last_reviewed = EXCLUDED.last_reviewed,
                review_count = user_verse_confidence.review_count + 1
        """
        self.db.execute(query, (user_id, verse_id, score, last_reviewed))

    def clear_all_user_verses(self, user_id: int) -> None:
        """Delete all memorization records for a user"""
        self.db.execute("DELETE FROM user_verse_confidence WHERE user_id = %s", (user_id,))
        self.db.execute("DELETE FROM user_verses WHERE user_id = %s", (user_id,))

