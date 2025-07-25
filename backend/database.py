# backend/database.py
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from contextlib import contextmanager
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class DatabaseConnection:
    def __init__(self, pool):
        self.pool = pool
        self.query_count = 0
    
    @contextmanager
    def get_db(self):
        """Get database connection from pool"""
        conn = None
        try:
            logger.debug("Acquiring DB connection from pool")
            conn = self.pool.getconn()
            conn.cursor().execute("SET search_path TO wellversed01DEV;")
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            if conn:
                self.pool.putconn(conn)
                logger.debug("Connection returned to pool")
    
    def fetch_one(self, query: str, params: tuple = ()) -> Optional[Dict]:
        """Execute query and fetch one result"""
        with self.get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                logger.debug(f"Executing query: {query[:100]}...")
                self.query_count += 1
                cur.execute(query, params)
                result = cur.fetchone()
                logger.debug(f"Query returned {'1 row' if result else '0 rows'}")
                return dict(result) if result else None
    
    def fetch_all(self, query: str, params: tuple = ()) -> List[Dict]:
        """Execute query and fetch all results"""
        with self.get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                logger.debug(f"Executing query: {query[:100]}...")
                self.query_count += 1
                cur.execute(query, params)
                results = cur.fetchall()
                logger.debug(f"Query returned {len(results)} rows")
                return [dict(row) for row in results]
    
    def execute(self, query: str, params: tuple = ()) -> None:
        """Execute query without returning results"""
        with self.get_db() as conn:
            with conn.cursor() as cur:
                logger.debug(f"Executing query: {query[:100]}...")
                self.query_count += 1
                cur.execute(query, params)
                conn.commit()
                logger.debug(f"Affected rows: {cur.rowcount}")
    
    def execute_many(self, query: str, params_list: List[tuple]) -> None:
        """Execute query multiple times with different parameters"""
        with self.get_db() as conn:
            with conn.cursor() as cur:
                logger.debug(f"Executing batch query: {query[:100]}...")
                self.query_count += len(params_list)
                cur.executemany(query, params_list)
                conn.commit()
                logger.debug(f"Total affected rows: {cur.rowcount}")
