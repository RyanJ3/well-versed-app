from typing import List, Dict, Optional, Tuple
import logging
from database import DatabaseConnection

logger = logging.getLogger(__name__)


from utils.performance import track_queries


class FeatureRequestRepository:
    """Handles all database operations for feature requests"""

    def __init__(self, db: DatabaseConnection):
        self.db = db

    @track_queries
    def get_requests(
        self,
        limit: int = 20,
        offset: int = 0,
        filters: Optional[Dict] = None,
    ) -> Tuple[List[Dict], int]:
        """Fetch feature requests with their tags using minimal queries"""
        where_conditions = []
        params: List = []

        if filters:
            if filters.get("type"):
                where_conditions.append("fr.type = %s")
                params.append(filters["type"])
            if filters.get("status"):
                where_conditions.append("fr.status = %s")
                params.append(filters["status"])
            if filters.get("search"):
                where_conditions.append("(fr.title ILIKE %s OR fr.description ILIKE %s)")
                search = f"%{filters['search']}%"
                params.extend([search, search])

        where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""

        count_query = f"""
            SELECT COUNT(DISTINCT fr.request_id) AS total
            FROM feature_requests fr
            {where_clause}
        """
        count_result = self.db.fetch_one(count_query, tuple(params))
        total_count = count_result["total"] if count_result else 0

        requests_query = f"""
            SELECT
                fr.request_id AS id,
                fr.title,
                fr.description,
                fr.type,
                fr.status,
                fr.priority,
                fr.user_id,
                u.name AS user_name,
                fr.created_at::text,
                fr.updated_at::text,
                COALESCE(SUM(CASE WHEN frv.vote_type='up' THEN 1 ELSE 0 END), 0) AS upvotes,
                COALESCE(SUM(CASE WHEN frv.vote_type='down' THEN 1 ELSE 0 END), 0) AS downvotes,
                COUNT(DISTINCT frc.comment_id) AS comments_count
            FROM feature_requests fr
            JOIN users u ON fr.user_id = u.user_id
            LEFT JOIN feature_request_votes frv ON fr.request_id = frv.request_id
            LEFT JOIN feature_request_comments frc ON fr.request_id = frc.request_id
            {where_clause}
            GROUP BY fr.request_id, u.name
            ORDER BY fr.created_at DESC
            LIMIT %s OFFSET %s
        """
        query_params = params + [limit, offset]
        requests = self.db.fetch_all(requests_query, tuple(query_params))

        if not requests:
            return [], total_count

        request_ids = [r["id"] for r in requests]
        tags_query = """
            SELECT m.request_id, t.tag_name
            FROM feature_request_tag_map m
            JOIN feature_request_tags t ON m.tag_id = t.tag_id
            WHERE m.request_id = ANY(%s)
            ORDER BY m.request_id, t.tag_name
        """
        tags_data = self.db.fetch_all(tags_query, (request_ids,))

        tags_by_request: Dict[int, List[str]] = {}
        for tag_row in tags_data:
            rid = tag_row["request_id"]
            tags_by_request.setdefault(rid, []).append(tag_row["tag_name"])

        for request in requests:
            request["tags"] = tags_by_request.get(request["id"], [])


        logger.info(
            f"Fetched {len(requests)} requests with tags using only 3 queries (previously would have been {len(requests) + 1} queries)"
        )

        return requests, total_count

    @track_queries
    def get_trending_requests(self, limit: int = 5) -> List[Dict]:
        """Get trending requests with tags in just 2 queries"""
        requests_query = """
            SELECT
                fr.request_id AS id,
                fr.title,
                fr.description,
                fr.type,
                fr.status,
                fr.priority,
                fr.user_id,
                u.name AS user_name,
                fr.created_at::text,
                fr.updated_at::text,
                COALESCE(SUM(CASE WHEN frv.vote_type='up' THEN 1 ELSE 0 END), 0) AS upvotes,
                COALESCE(SUM(CASE WHEN frv.vote_type='down' THEN 1 ELSE 0 END), 0) AS downvotes,
                COUNT(DISTINCT frc.comment_id) AS comments_count
            FROM feature_requests fr
            JOIN users u ON fr.user_id = u.user_id
            LEFT JOIN feature_request_votes frv ON fr.request_id = frv.request_id AND frv.voted_at >= NOW() - INTERVAL '7 days'
            LEFT JOIN feature_request_comments frc ON fr.request_id = frc.request_id
            GROUP BY fr.request_id, u.name
            ORDER BY upvotes DESC, fr.created_at DESC
            LIMIT %s
        """
        requests = self.db.fetch_all(requests_query, (limit,))
        if not requests:
            return []

        request_ids = [r["id"] for r in requests]
        tags_query = """
            SELECT m.request_id, t.tag_name
            FROM feature_request_tag_map m
            JOIN feature_request_tags t ON m.tag_id = t.tag_id
            WHERE m.request_id = ANY(%s)
        """
        tags_data = self.db.fetch_all(tags_query, (request_ids,))

        tags_by_request: Dict[int, List[str]] = {}
        for tag_row in tags_data:
            rid = tag_row["request_id"]
            tags_by_request.setdefault(rid, []).append(tag_row["tag_name"])

        for request in requests:
            request["tags"] = tags_by_request.get(request["id"], [])

        return requests
