"""Base repository class with common patterns"""

from typing import Any, Dict, List, Optional
import logging
from database import DatabaseConnection
from utils.performance import track_queries

logger = logging.getLogger(__name__)


class BaseRepository:
    """Base repository with common database operations"""

    def __init__(self, db: DatabaseConnection) -> None:
        self.db = db

    @track_queries(max_queries=1)
    def find_by_id(self, table: str, id_column: str, id_value: Any) -> Optional[Dict]:
        """Generic find by ID"""
        query = f"SELECT * FROM {table} WHERE {id_column} = %s"
        return self.db.fetch_one(query, (id_value,))

    @track_queries(max_queries=1)
    def exists(self, table: str, column: str, value: Any) -> bool:
        """Check if record exists"""
        query = f"SELECT 1 FROM {table} WHERE {column} = %s LIMIT 1"
        result = self.db.fetch_one(query, (value,))
        return result is not None

    def insert(self, table: str, data: Dict) -> Dict:
        """Generic insert with RETURNING *"""
        columns = list(data.keys())
        values = list(data.values())
        placeholders = ["%s"] * len(columns)

        query = f"""
            INSERT INTO {table} ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        return self.db.fetch_one(query, tuple(values))

    def update(self, table: str, id_column: str, id_value: Any, data: Dict) -> Optional[Dict]:
        """Generic update with RETURNING *"""
        if not data:
            return None

        set_clauses = [f"{col} = %s" for col in data.keys()]
        values = list(data.values()) + [id_value]

        query = f"""
            UPDATE {table}
            SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP
            WHERE {id_column} = %s
            RETURNING *
        """
        return self.db.fetch_one(query, tuple(values))

    def delete(self, table: str, id_column: str, id_value: Any) -> bool:
        """Generic delete"""
        query = f"DELETE FROM {table} WHERE {id_column} = %s RETURNING 1"
        result = self.db.fetch_one(query, (id_value,))
        return result is not None
