from typing import List, Optional, Dict
from datetime import datetime
import logging
from database import DatabaseConnection
from . import schemas

logger = logging.getLogger(__name__)


class VerseRepository:
    """Handles all database operations for verses"""

    def __init__(self, db: DatabaseConnection):
        self.db = db

    async def get_user_verses(
        self,
        user_id: int,
        include_apocrypha: bool = False,
    ) -> List[Dict]:
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

    async def get_verse_by_code(self, verse_code: str) -> Optional[Dict]:
        return self.db.fetch_one(
            "SELECT id, book_id, chapter_number, verse_number, is_apocryphal "
            "FROM bible_verses WHERE verse_code = %s",
            (verse_code,),
        )

    async def upsert_user_verse(
        self,
        user_id: int,
        verse_id: int,
        practice_count: int,
        last_practiced: datetime,
    ) -> None:
        query = """
            INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, verse_id) 
            DO UPDATE SET
                practice_count = EXCLUDED.practice_count,
                last_practiced = EXCLUDED.last_practiced,
                updated_at = CURRENT_TIMESTAMP
        """
        self.db.execute(query, (user_id, verse_id, practice_count, last_practiced))

    async def delete_user_verse(self, user_id: int, verse_id: int) -> None:
        self.db.execute(
            "DELETE FROM user_verses WHERE user_id = %s AND verse_id = %s",
            (user_id, verse_id),
        )

    async def get_verses_in_chapter(self, book_id: int, chapter_num: int) -> List[Dict]:
        return self.db.fetch_all(
            "SELECT id FROM bible_verses WHERE book_id = %s AND chapter_number = %s",
            (book_id, chapter_num),
        )

    async def get_verses_in_book(self, book_id: int) -> List[Dict]:
        return self.db.fetch_all(
            "SELECT id FROM bible_verses WHERE book_id = %s",
            (book_id,),
        )

    async def bulk_upsert_verses(self, user_id: int, verse_data: List[tuple]) -> None:
        query = """
            INSERT INTO user_verses (user_id, verse_id, practice_count, last_practiced)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, verse_id) DO UPDATE SET
                practice_count = EXCLUDED.practice_count,
                last_practiced = EXCLUDED.last_practiced,
                updated_at = CURRENT_TIMESTAMP
        """
        params_list = [(user_id, *data) for data in verse_data]
        self.db.execute_many(query, params_list)

    async def delete_verses_by_chapter(self, user_id: int, book_id: int, chapter_num: int) -> None:
        query = """
            DELETE FROM user_verses 
            WHERE user_id = %s 
            AND verse_id IN (
                SELECT id FROM bible_verses 
                WHERE book_id = %s AND chapter_number = %s
            )
        """
        self.db.execute(query, (user_id, book_id, chapter_num))

    async def delete_verses_by_book(self, user_id: int, book_id: int) -> None:
        query = """
            DELETE FROM user_verses 
            WHERE user_id = %s 
            AND verse_id IN (
                SELECT id FROM bible_verses 
                WHERE book_id = %s
            )
        """
        self.db.execute(query, (user_id, book_id))

    async def clear_all_user_verses(self, user_id: int) -> None:
        self.db.execute("DELETE FROM user_verse_confidence WHERE user_id = %s", (user_id,))
        self.db.execute("DELETE FROM user_verses WHERE user_id = %s", (user_id,))
