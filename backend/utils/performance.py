import time
import functools
import logging

logger = logging.getLogger(__name__)

def track_queries(func):
    """Decorator to log query count and execution time"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        db = getattr(args[0], "db", None)
        start_count = db.query_count if db else 0
        start_time = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start_time
        queries = (db.query_count - start_count) if db else 0
        logger.info(f"{func.__name__}: {queries} queries in {elapsed:.3f}s")
        return result
    return wrapper
