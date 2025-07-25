from typing import Dict, List, Any, Tuple, TypeVar, Callable, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')
K = TypeVar('K')

class BatchLoader:
    """Utility class for batch loading related data to prevent N+1 queries."""

    @staticmethod
    def load_one_to_many(
        db,
        parent_ids: List[Any],
        query: str,
        parent_key: str,
        child_key: str,
        transform: Optional[Callable[[Dict], Any]] = None
    ) -> Dict[Any, List[Any]]:
        if not parent_ids:
            return {}
        unique_ids = list(dict.fromkeys(parent_ids))
        rows = db.fetch_all(query, (unique_ids,))
        result: Dict[Any, List[Any]] = defaultdict(list)
        for row in rows:
            parent_id = row[parent_key]
            child_value = transform(row) if transform else row[child_key]
            result[parent_id].append(child_value)
        for parent_id in unique_ids:
            if parent_id not in result:
                result[parent_id] = []
        return dict(result)

    @staticmethod
    def load_many_to_many(
        db,
        parent_ids: List[Any],
        query: str,
        parent_key: str,
        transform: Optional[Callable[[Dict], Tuple[Any, Any]]] = None
    ) -> Dict[Any, List[Dict]]:
        if not parent_ids:
            return {}
        unique_ids = list(dict.fromkeys(parent_ids))
        rows = db.fetch_all(query, (unique_ids,))
        result: Dict[Any, List[Dict]] = defaultdict(list)
        for row in rows:
            parent_id = row[parent_key]
            if transform:
                key, value = transform(row)
                result[parent_id].append({key: value})
            else:
                result[parent_id].append(dict(row))
        return dict(result)

    @staticmethod
    def load_aggregates(
        db,
        parent_ids: List[Any],
        query: str,
        parent_key: str = 'id'
    ) -> Dict[Any, Dict[str, Any]]:
        if not parent_ids:
            return {}
        unique_ids = list(dict.fromkeys(parent_ids))
        rows = db.fetch_all(query, (unique_ids,))
        result = {}
        for row in rows:
            parent_id = row.pop(parent_key)
            result[parent_id] = dict(row)
        for parent_id in unique_ids:
            if parent_id not in result:
                result[parent_id] = {}
        return result

    @staticmethod
    def chunk_list(items: List[T], chunk_size: int = 1000) -> List[List[T]]:
        return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]
