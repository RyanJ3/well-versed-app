# backend/database.py
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from contextlib import contextmanager
from typing import Dict, List, Any, Optional, Set

logger = logging.getLogger(__name__)

class DatabaseConnection:
    def __init__(self, pool):
        self.pool = pool
        self.query_count = 0
        self.query_log: List[str] = []  # Track actual queries for debugging
        self._enable_query_logging = False

    def enable_query_logging(self, enable: bool = True):
        """Enable or disable query logging for debugging"""
        self._enable_query_logging = enable
        if enable:
            self.query_log = []

    def get_query_log(self) -> List[str]:
        """Get the log of executed queries"""
        return self.query_log.copy()

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

    def _log_query(self, query: str, params: tuple):
        """Log query for debugging if enabled"""
        if self._enable_query_logging:
            query_preview = query[:200] + '...' if len(query) > 200 else query
            self.query_log.append(f"{query_preview} -- params: {params}")
    
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
                if self._enable_query_logging:
                    for params in params_list[:3]:
                        self._log_query(query, params)
                    if len(params_list) > 3:
                        self.query_log.append(f"... and {len(params_list) - 3} more")
                cur.executemany(query, params_list)
                conn.commit()
                logger.debug(f"Total affected rows: {cur.rowcount}")

    def execute_values(self, query: str, values: List[tuple]) -> List[Dict]:
        """Execute a query with multiple value sets using execute_values"""
        from psycopg2.extras import execute_values

        with self.get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                logger.debug(f"Executing values query: {query[:100]}...")
                self.query_count += 1
                self._log_query(query, ('batch values',))
                results = execute_values(cur, query, values, fetch=True)
                conn.commit()
                logger.debug(f"Query returned {len(results) if results else 0} rows")
                return [dict(row) for row in (results or [])]
