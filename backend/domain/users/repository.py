"""User data access layer"""

from typing import Optional, Dict, List
from datetime import datetime
from domain.core import BaseRepository
from database import DatabaseConnection
from utils.performance import track_queries
import logging

logger = logging.getLogger(__name__)


class UserRepository(BaseRepository):
    """Repository for user data access"""

    @track_queries(max_queries=1)
    def get_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        return self.find_by_id("users", "user_id", user_id)

    @track_queries(max_queries=1)
    def get_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        query = "SELECT * FROM users WHERE email = %s"
        return self.db.fetch_one(query, (email.lower(),))

    @track_queries(max_queries=1)
    def create(self, email: str, password_hash: str, name: str) -> Dict:
        """Create new user"""
        data = {
            "email": email.lower(),
            "password_hash": password_hash,
            "name": name,
        }
        return self.insert("users", data)

    @track_queries(max_queries=1)
    def update(self, user_id: int, data: Dict) -> Optional[Dict]:
        """Update user"""
        if "email" in data:
            data["email"] = data["email"].lower()
        return super().update("users", "user_id", user_id, data)

    @track_queries(max_queries=1)
    def update_last_login(self, user_id: int) -> None:
        """Update last login timestamp"""
        query = """
            UPDATE users
            SET last_login = CURRENT_TIMESTAMP
            WHERE user_id = %s
        """
        self.db.execute(query, (user_id,))

    @track_queries(max_queries=3)
    def get_user_stats(self, user_id: int) -> Dict:
        """Get comprehensive user statistics"""
        verse_stats = self.db.fetch_one(
            """
            SELECT
                COUNT(DISTINCT uv.verse_id) as total_verses,
                COUNT(DISTINCT bv.chapter_number || '-' || bv.book_id) as total_chapters,
                COUNT(DISTINCT bv.book_id) as total_books,
                MAX(uv.last_practiced) as last_active
            FROM user_verses uv
            JOIN bible_verses bv ON uv.verse_id = bv.id
            WHERE uv.user_id = %s
        """,
            (user_id,),
        )

        verses_by_book = self.db.fetch_all(
            """
            SELECT
                bb.book_name,
                COUNT(uv.verse_id) as verse_count
            FROM user_verses uv
            JOIN bible_verses bv ON uv.verse_id = bv.id
            JOIN bible_books bb ON bv.book_id = bb.book_id
            WHERE uv.user_id = %s
            GROUP BY bb.book_id, bb.book_name
            ORDER BY bb.book_id
        """,
            (user_id,),
        )

        recent_activity = self.db.fetch_all(
            """
            SELECT
                DATE(last_practiced) as activity_date,
                COUNT(*) as verses_practiced
            FROM user_verses
            WHERE user_id = %s
              AND last_practiced >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(last_practiced)
            ORDER BY activity_date DESC
        """,
            (user_id,),
        )

        streak_days = self._calculate_streak(user_id)

        return {
            "user_id": user_id,
            "total_verses": verse_stats["total_verses"] or 0,
            "total_chapters": verse_stats["total_chapters"] or 0,
            "total_books": verse_stats["total_books"] or 0,
            "verses_by_book": {vb["book_name"]: vb["verse_count"] for vb in verses_by_book},
            "recent_activity": [
                {"date": ra["activity_date"].isoformat(), "verses_practiced": ra["verses_practiced"]}
                for ra in recent_activity
            ],
            "streak_days": streak_days,
            "last_active": verse_stats["last_active"],
        }

    def _calculate_streak(self, user_id: int) -> int:
        """Calculate current practice streak in days"""
        query = """
            WITH daily_practice AS (
                SELECT DISTINCT DATE(last_practiced) as practice_date
                FROM user_verses
                WHERE user_id = %s
                  AND last_practiced >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY practice_date DESC
            )
            SELECT COUNT(*) as streak
            FROM (
                SELECT practice_date,
                       practice_date - (ROW_NUMBER() OVER (ORDER BY practice_date DESC) - 1) * INTERVAL '1 day' as grp
                FROM daily_practice
            ) t
            WHERE grp = (
                SELECT MAX(grp)
                FROM (
                    SELECT practice_date,
                           practice_date - (ROW_NUMBER() OVER (ORDER BY practice_date DESC) - 1) * INTERVAL '1 day' as grp
                    FROM daily_practice
                ) t2
                WHERE practice_date >= CURRENT_DATE - INTERVAL '1 day'
            )
        """
        result = self.db.fetch_one(query, (user_id,))
        return result["streak"] if result else 0

    @track_queries(max_queries=1)
    def email_exists(self, email: str) -> bool:
        """Check if email already exists"""
        return self.exists("users", "email", email.lower())
