import time
import functools
import logging
import warnings
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

# Global registry for tracking method performance
PERFORMANCE_REGISTRY: Dict[str, List['QueryMetrics']] = {}

@dataclass
class QueryMetrics:
    method_name: str
    query_count: int
    execution_time: float
    timestamp: datetime
    exceeded_limit: bool

class QueryLimitExceeded(Warning):
    """Warning raised when a method exceeds the query limit"""
    pass

def track_queries(max_queries: int = 3, log_details: bool = True):
    """Decorator to track query count and execution time."""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            db = getattr(args[0], "db", None)
            if not db:
                return func(*args, **kwargs)

            start_count = db.query_count if hasattr(db, 'query_count') else 0
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                elapsed = time.time() - start_time
                queries = (db.query_count - start_count) if hasattr(db, 'query_count') else 0

                metrics = QueryMetrics(
                    method_name=f"{args[0].__class__.__name__}.{func.__name__}",
                    query_count=queries,
                    execution_time=elapsed,
                    timestamp=datetime.now(),
                    exceeded_limit=queries > max_queries
                )

                if metrics.method_name not in PERFORMANCE_REGISTRY:
                    PERFORMANCE_REGISTRY[metrics.method_name] = []
                PERFORMANCE_REGISTRY[metrics.method_name].append(metrics)

                if log_details:
                    logger.info(
                        f"{metrics.method_name}: {queries} queries in {elapsed:.3f}s" +
                        (" \u26A0\uFE0F EXCEEDED LIMIT" if metrics.exceeded_limit else "")
                    )

                if metrics.exceeded_limit:
                    warnings.warn(
                        f"{metrics.method_name} executed {queries} queries "
                        f"(limit: {max_queries}). Consider optimizing this method.",
                        QueryLimitExceeded,
                        stacklevel=2
                    )

                return result
            except Exception as e:
                elapsed = time.time() - start_time
                logger.error(f"{func.__name__} failed after {elapsed:.3f}s: {e}")
                raise
        return wrapper
    return decorator


def get_performance_report() -> Dict[str, Dict]:
    """Generate a performance report of all tracked methods"""
    report: Dict[str, Dict] = {}
    for method_name, metrics_list in PERFORMANCE_REGISTRY.items():
        if not metrics_list:
            continue
        total_calls = len(metrics_list)
        total_queries = sum(m.query_count for m in metrics_list)
        avg_queries = total_queries / total_calls
        avg_time = sum(m.execution_time for m in metrics_list) / total_calls
        exceeded_count = sum(1 for m in metrics_list if m.exceeded_limit)
        report[method_name] = {
            'total_calls': total_calls,
            'total_queries': total_queries,
            'avg_queries_per_call': round(avg_queries, 2),
            'avg_execution_time': round(avg_time, 3),
            'times_exceeded_limit': exceeded_count,
            'exceeded_percentage': round((exceeded_count / total_calls) * 100, 1)
        }
    return report


def reset_performance_tracking():
    """Reset all performance tracking data"""
    PERFORMANCE_REGISTRY.clear()
