"""Unit of Work pattern for transaction management"""

from contextlib import contextmanager
import logging
import db_pool

logger = logging.getLogger(__name__)


class UnitOfWork:
    """Manages database transactions"""

    @contextmanager
    def transaction(self):
        """Context manager for database transactions"""
        conn = None
        try:
            conn = db_pool.db_pool.getconn()
            conn.autocommit = False
            yield conn
            conn.commit()
            logger.debug("Transaction committed successfully")
        except Exception as e:
            if conn:
                conn.rollback()
                logger.error(f"Transaction rolled back: {e}")
            raise
        finally:
            if conn:
                db_pool.db_pool.putconn(conn)
