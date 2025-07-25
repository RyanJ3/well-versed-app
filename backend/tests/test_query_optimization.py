import time
import logging
from database import DatabaseConnection
import db_pool
from domain.feature_requests.repository import FeatureRequestRepository

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def measure_queries(func, *args, **kwargs):
    db = DatabaseConnection(db_pool.db_pool)
    start_count = db.query_count
    start_time = time.time()
    result = func(*args, **kwargs)
    elapsed = time.time() - start_time
    query_count = db.query_count - start_count
    logger.info(f"Function {func.__name__} made {query_count} queries in {elapsed:.3f} seconds")
    return result, query_count

def test_feature_requests():
    db = DatabaseConnection(db_pool.db_pool)
    repo = FeatureRequestRepository(db)
    logger.info("Testing optimized feature request fetch...")
    requests, count = repo.get_requests(limit=20)
    logger.info(f"Fetched {len(requests)} requests")
    logger.info(f"Total queries made: {db.query_count}")
    for req in requests:
        if req.get("tags"):
            logger.info(f"Request {req['id']} has tags: {req['tags']}")

if __name__ == "__main__":
    test_feature_requests()
