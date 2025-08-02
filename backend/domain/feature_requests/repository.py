from typing import List, Dict, Optional, Tuple
import logging
from database import DatabaseConnection
from utils.performance import track_queries
from utils.batch_loader import BatchLoader

logger = logging.getLogger(__name__)

class FeatureRequestRepository:
    """Optimized repository for feature requests"""

    def __init__(self, db: DatabaseConnection):
        self.db = db

    @track_queries(max_queries=3)
    def get_requests(
        self,
        limit: int = 20,
        offset: int = 0,
        filters: Optional[Dict] = None,
    ) -> Tuple[List[Dict], int]:
        """Fetch feature requests with their tags using exactly 3 queries"""
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

        # Remove ::text casting to let psycopg2 handle datetime conversion properly
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
                fr.created_at,
                fr.updated_at,
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
        tags_by_request = BatchLoader.load_one_to_many(
            db=self.db,
            parent_ids=request_ids,
            query="""
                SELECT m.request_id, t.tag_name
                FROM feature_request_tag_map m
                JOIN feature_request_tags t ON m.tag_id = t.tag_id
                WHERE m.request_id = ANY(%s)
                ORDER BY m.request_id, t.tag_name
            """,
            parent_key='request_id',
            child_key='tag_name'
        )

        for request in requests:
            request["tags"] = tags_by_request.get(request["id"], [])

        logger.info(f"Fetched {len(requests)} requests with tags using exactly 3 queries")
        return requests, total_count

    @track_queries(max_queries=2)
    def get_trending_requests(self, limit: int = 5) -> List[Dict]:
        """Get trending requests with tags in exactly 2 queries"""
        # Remove ::text casting here too
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
                fr.created_at,
                fr.updated_at,
                COALESCE(SUM(CASE WHEN frv.vote_type='up' THEN 1 ELSE 0 END), 0) AS upvotes,
                COALESCE(SUM(CASE WHEN frv.vote_type='down' THEN 1 ELSE 0 END), 0) AS downvotes,
                COUNT(DISTINCT frc.comment_id) AS comments_count
            FROM feature_requests fr
            JOIN users u ON fr.user_id = u.user_id
            LEFT JOIN feature_request_votes frv ON fr.request_id = frv.request_id 
                AND frv.voted_at >= NOW() - INTERVAL '7 days'
            LEFT JOIN feature_request_comments frc ON fr.request_id = frc.request_id
            GROUP BY fr.request_id, u.name
            HAVING COALESCE(SUM(CASE WHEN frv.vote_type='up' THEN 1 ELSE 0 END), 0) > 0
            ORDER BY upvotes DESC, fr.created_at DESC
            LIMIT %s
        """
        requests = self.db.fetch_all(requests_query, (limit,))

        if not requests:
            return []

        request_ids = [r["id"] for r in requests]
        tags_by_request = BatchLoader.load_one_to_many(
            db=self.db,
            parent_ids=request_ids,
            query="""
                SELECT m.request_id, t.tag_name
                FROM feature_request_tag_map m
                JOIN feature_request_tags t ON m.tag_id = t.tag_id
                WHERE m.request_id = ANY(%s)
            """,
            parent_key='request_id',
            child_key='tag_name'
        )

        for request in requests:
            request["tags"] = tags_by_request.get(request["id"], [])

        return requests

    @track_queries(max_queries=1)
    def create_request(self, title: str, description: str, type: str, user_id: int, tags: List[str]) -> Dict:
        """Create a feature request with tags in a single transaction"""
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO feature_requests (title, description, type, user_id)
                    VALUES (%s, %s, %s, %s)
                    RETURNING request_id, status, priority, created_at, updated_at
                """, (title, description, type, user_id))
                result = cur.fetchone()
                request_id = result[0]

                if tags:
                    cur.execute("""
                        INSERT INTO feature_request_tags (tag_name)
                        SELECT DISTINCT unnest(%s::text[])
                        ON CONFLICT (tag_name) DO NOTHING
                    """, (tags,))
                    cur.execute("""
                        INSERT INTO feature_request_tag_map (request_id, tag_id)
                        SELECT %s, t.tag_id
                        FROM feature_request_tags t
                        WHERE t.tag_name = ANY(%s)
                    """, (request_id, tags))

                cur.execute("SELECT name FROM users WHERE user_id = %s", (user_id,))
                user_name = cur.fetchone()[0]

                conn.commit()

                return {
                    'id': request_id,
                    'title': title,
                    'description': description,
                    'type': type,
                    'status': result[1],
                    'priority': result[2],
                    'user_id': user_id,
                    'user_name': user_name,
                    'created_at': result[3],  # Return datetime object directly
                    'updated_at': result[4],  # Return datetime object directly
                    'tags': tags,
                    'upvotes': 0,
                    'downvotes': 0,
                    'comments_count': 0
                }

    def get_request_by_id(self, request_id: int) -> Optional[Dict]:
        """Get single request with all details"""
        query = """
            SELECT
                fr.request_id AS id,
                fr.title,
                fr.description,
                fr.type,
                fr.status,
                fr.priority,
                fr.user_id,
                u.name AS user_name,
                fr.created_at,
                fr.updated_at,
                COALESCE(SUM(CASE WHEN frv.vote_type='up' THEN 1 ELSE 0 END), 0) AS upvotes,
                COALESCE(SUM(CASE WHEN frv.vote_type='down' THEN 1 ELSE 0 END), 0) AS downvotes,
                COUNT(DISTINCT frc.comment_id) AS comments_count
            FROM feature_requests fr
            JOIN users u ON fr.user_id = u.user_id
            LEFT JOIN feature_request_votes frv ON fr.request_id = frv.request_id
            LEFT JOIN feature_request_comments frc ON fr.request_id = frc.request_id
            WHERE fr.request_id = %s
            GROUP BY fr.request_id, u.name
        """
        result = self.db.fetch_one(query, (request_id,))
        if not result:
            return None

        tag_rows = self.db.fetch_all(
            """
            SELECT t.tag_name 
            FROM feature_request_tag_map m 
            JOIN feature_request_tags t ON m.tag_id = t.tag_id 
            WHERE m.request_id = %s
            """,
            (request_id,)
        )
        result["tags"] = [t["tag_name"] for t in tag_rows]
        return result

    def add_vote(self, request_id: int, user_id: int, vote_type: str):
        """Add or update vote"""
        self.db.execute(
            """
            INSERT INTO feature_request_votes (request_id, user_id, vote_type)
            VALUES (%s, %s, %s)
            ON CONFLICT (request_id, user_id)
            DO UPDATE SET vote_type = EXCLUDED.vote_type, voted_at = CURRENT_TIMESTAMP
            """,
            (request_id, user_id, vote_type)
        )

    def remove_vote(self, request_id: int, user_id: int):
        """Remove vote"""
        self.db.execute(
            "DELETE FROM feature_request_votes WHERE request_id = %s AND user_id = %s",
            (request_id, user_id)
        )

    def add_comment(self, request_id: int, user_id: int, comment: str) -> Dict:
        """Add comment"""
        with self.db.get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO feature_request_comments (request_id, user_id, comment)
                    VALUES (%s, %s, %s)
                    RETURNING comment_id, created_at
                    """,
                    (request_id, user_id, comment)
                )
                row = cur.fetchone()
                cur.execute("SELECT name FROM users WHERE user_id = %s", (user_id,))
                user_row = cur.fetchone()
                conn.commit()

        return {
            "id": row[0],
            "request_id": request_id,
            "user_id": user_id,
            "user_name": user_row[0] if user_row else "",
            "comment": comment,
            "created_at": row[1]  # Return datetime object directly
        }

    def get_comments(self, request_id: int) -> List[Dict]:
        """Get comments for request"""
        query = """
            SELECT
                c.comment_id AS id,
                c.request_id,
                c.user_id,
                u.name AS user_name,
                c.comment,
                c.created_at
            FROM feature_request_comments c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.request_id = %s
            ORDER BY c.created_at
        """
        return self.db.fetch_all(query, (request_id,))

    def get_user_requests(self, user_id: int) -> List[Dict]:
        """Get all requests by user"""
        query = """
            SELECT
                fr.request_id AS id,
                fr.title,
                fr.description,
                fr.type,
                fr.status,
                fr.priority,
                fr.user_id,
                u.name AS user_name,
                fr.created_at,
                fr.updated_at,
                0 as upvotes,
                0 as downvotes,
                0 as comments_count
            FROM feature_requests fr
            JOIN users u ON fr.user_id = u.user_id
            WHERE fr.user_id = %s
            ORDER BY fr.created_at DESC
        """
        rows = self.db.fetch_all(query, (user_id,))

        for row in rows:
            tag_rows = self.db.fetch_all(
                """
                SELECT t.tag_name
                FROM feature_request_tag_map m
                JOIN feature_request_tags t ON m.tag_id = t.tag_id
                WHERE m.request_id = %s
                """,
                (row["id"],)
            )
            row["tags"] = [t["tag_name"] for t in tag_rows]

        return rows