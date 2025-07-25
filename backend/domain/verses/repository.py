from typing import List, Optional, Dict
from datetime import datetime
import logging
from database import DatabaseConnection
from utils.performance import track_queries
from utils.batch_loader import BatchLoader
from . import schemas

logger = logging.getLogger(__name__)

class VerseRepository:
    """Optimized repository for verse operations"""

    def __init__(self, db: DatabaseConnection):
        self.db = db
        self._verse_cache: Dict[str, Dict] = {}

    @track_queries(max_queries=1)
    def get_user_verses(self, user_id: int, include_apocrypha: bool = False) -> List[Dict]:
        """Get all user verses in a single optimized query"""
        query = """
            SELECT 
                bv.verse_code as verse_id,
                bv.book_id,
                bv.chapter_number,
                bv.verse_number,
                bv.is_apocryphal,
                uv.practice_count,
                uv.last_practiced::text,
                uv.created_at::text,
                uv.updated_at::text
            FROM user_verses uv
            JOIN bible_verses bv ON uv.verse_id = bv.id
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

