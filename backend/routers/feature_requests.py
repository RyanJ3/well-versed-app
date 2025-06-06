# backend/routers/feature_requests.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
from database import DatabaseConnection
import db_pool

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class FeatureRequestCreate(BaseModel):
    title: str
    description: str
    type: str
    user_id: int
    tags: Optional[List[str]] = None

class VoteRequest(BaseModel):
    user_id: int
    vote_type: str  # 'up' or 'down'

class CommentCreate(BaseModel):
    user_id: int
    comment: str

class FeatureRequestResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    type: Optional[str]
    status: Optional[str]
    priority: Optional[str] = None
    upvotes: int = 0
    downvotes: int = 0
    user_id: Optional[int]
    user_name: Optional[str]
    created_at: str
    updated_at: Optional[str]
    tags: List[str] = []
    comments_count: int = 0

class FeatureRequestListResponse(BaseModel):
    total: int
    requests: List[FeatureRequestResponse]
    page: int
    per_page: int

class FeatureRequestComment(BaseModel):
    id: int
    request_id: int
    user_id: int
    user_name: str
    comment: str
    created_at: str

def get_db():
    """Dependency to get database connection"""
    return DatabaseConnection(db_pool.db_pool)

@router.get("", response_model=FeatureRequestListResponse)
async def list_requests(
    page: int = 1,
    per_page: int = 20,
    type: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "upvotes",
    search: Optional[str] = None,
    db: DatabaseConnection = Depends(get_db)
):
    logger.info(
        f"Listing feature requests page={page} per_page={per_page} type={type} status={status}"
    )
    offset = (page - 1) * per_page
    filters = []
    params: List = []
    if type:
        filters.append("fr.type = %s")
        params.append(type)
    if status:
        filters.append("fr.status = %s")
        params.append(status)
    if search:
        filters.append("(fr.title ILIKE %s OR fr.description ILIKE %s)")
        params.extend([f"%{search}%", f"%{search}%"])
    where_sql = " WHERE " + " AND ".join(filters) if filters else ""

    sort_map = {
        "upvotes": "upvotes DESC",
        "newest": "fr.created_at DESC",
        "priority": "fr.priority DESC NULLS LAST"
    }
    order_clause = sort_map.get(sort_by, "upvotes DESC")

    base_query = f"""
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
            COALESCE(SUM(CASE WHEN frv.vote_type='up' THEN 1 ELSE 0 END),0) AS upvotes,
            COALESCE(SUM(CASE WHEN frv.vote_type='down' THEN 1 ELSE 0 END),0) AS downvotes,
            COUNT(DISTINCT frc.comment_id) AS comments_count
        FROM feature_requests fr
        JOIN users u ON fr.user_id = u.user_id
        LEFT JOIN feature_request_votes frv ON fr.request_id = frv.request_id
        LEFT JOIN feature_request_comments frc ON fr.request_id = frc.request_id
        {where_sql}
        GROUP BY fr.request_id, u.name
        ORDER BY {order_clause}
        LIMIT %s OFFSET %s
    """
    query_params = params + [per_page, offset]
    rows = db.fetch_all(base_query, tuple(query_params))

    logger.info(f"Retrieved {len(rows)} feature requests")

    total_row = db.fetch_one(f"SELECT COUNT(*) AS count FROM feature_requests fr {where_sql}", tuple(params))
    total = total_row["count"] if total_row else 0

    # Fetch tags for each request
    for r in rows:
        tag_rows = db.fetch_all(
            """SELECT t.tag_name FROM feature_request_tag_map m JOIN feature_request_tags t ON m.tag_id = t.tag_id WHERE m.request_id = %s""",
            (r["id"],)
        )
        r["tags"] = [t["tag_name"] for t in tag_rows]

    requests = [FeatureRequestResponse(**r) for r in rows]
    return FeatureRequestListResponse(total=total, requests=requests, page=page, per_page=per_page)

@router.get("/{request_id}", response_model=FeatureRequestResponse)
async def get_request(request_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching feature request {request_id}")
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
            fr.created_at::text,
            fr.updated_at::text,
            COALESCE(SUM(CASE WHEN frv.vote_type='up' THEN 1 ELSE 0 END),0) AS upvotes,
            COALESCE(SUM(CASE WHEN frv.vote_type='down' THEN 1 ELSE 0 END),0) AS downvotes,
            COUNT(DISTINCT frc.comment_id) AS comments_count
        FROM feature_requests fr
        JOIN users u ON fr.user_id = u.user_id
        LEFT JOIN feature_request_votes frv ON fr.request_id = frv.request_id
        LEFT JOIN feature_request_comments frc ON fr.request_id = frc.request_id
        WHERE fr.request_id = %s
        GROUP BY fr.request_id, u.name
    """
    row = db.fetch_one(query, (request_id,))
    if not row:
        logger.warning(f"Feature request {request_id} not found")
        raise HTTPException(status_code=404, detail="Feature request not found")
    tag_rows = db.fetch_all(
        "SELECT t.tag_name FROM feature_request_tag_map m JOIN feature_request_tags t ON m.tag_id = t.tag_id WHERE m.request_id = %s",
        (request_id,)
    )
    row["tags"] = [t["tag_name"] for t in tag_rows]
    logger.info(f"Feature request {request_id} retrieved")
    return FeatureRequestResponse(**row)

@router.post("", response_model=FeatureRequestResponse)
async def create_request(req: FeatureRequestCreate, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Creating feature request titled '{req.title}' for user {req.user_id}")
    with db.get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO feature_requests (title, description, type, user_id)
                VALUES (%s, %s, %s, %s)
                RETURNING request_id, status, priority, created_at, updated_at
                """,
                (req.title, req.description, req.type, req.user_id)
            )
            r = cur.fetchone()
            request_id = r[0]
            # RETURNING request_id, status, priority, created_at, updated_at
            created_at = r[3] if len(r) > 3 else None
            updated_at = r[4] if len(r) > 4 else None
            # Insert tags
            if req.tags:
                for tag in req.tags:
                    cur.execute(
                        "INSERT INTO feature_request_tags (tag_name) VALUES (%s) ON CONFLICT (tag_name) DO UPDATE SET tag_name=EXCLUDED.tag_name RETURNING tag_id",
                        (tag,)
                    )
                    tag_id = cur.fetchone()[0]
                    cur.execute(
                        "INSERT INTO feature_request_tag_map (request_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (request_id, tag_id)
                    )
            cur.execute("SELECT name FROM users WHERE user_id = %s", (req.user_id,))
            user_name_row = cur.fetchone()
            user_name = user_name_row[0] if user_name_row else None
            conn.commit()

    logger.info(f"Feature request {request_id} created")

    return FeatureRequestResponse(
        id=request_id,
        title=req.title,
        description=req.description,
        type=req.type,
        status=r[1],
        priority=r[2] if len(r) > 2 else None,
        user_id=req.user_id,
        user_name=user_name,
        upvotes=0,
        downvotes=0,
        created_at=created_at.isoformat() if created_at else None,
        updated_at=updated_at.isoformat() if updated_at else None,
        tags=req.tags or [],
        comments_count=0
    )

@router.post("/{request_id}/vote")
async def vote_request(request_id: int, vote: VoteRequest, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"User {vote.user_id} voting {vote.vote_type} on request {request_id}")
    db.execute(
        """
        INSERT INTO feature_request_votes (request_id, user_id, vote_type)
        VALUES (%s, %s, %s)
        ON CONFLICT (request_id, user_id)
        DO UPDATE SET vote_type = EXCLUDED.vote_type, voted_at = CURRENT_TIMESTAMP
        """,
        (request_id, vote.user_id, vote.vote_type)
    )
    return {"message": "Vote recorded"}

@router.delete("/{request_id}/vote/{user_id}")
async def remove_vote(request_id: int, user_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Removing vote by user {user_id} from request {request_id}")
    db.execute(
        "DELETE FROM feature_request_votes WHERE request_id = %s AND user_id = %s",
        (request_id, user_id)
    )
    return {"message": "Vote removed"}

@router.get("/{request_id}/comments", response_model=List[FeatureRequestComment])
async def list_comments(request_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Listing comments for request {request_id}")
    query = """
        SELECT
            c.comment_id AS id,
            c.request_id,
            c.user_id,
            u.name AS user_name,
            c.comment,
            c.created_at::text
        FROM feature_request_comments c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.request_id = %s
        ORDER BY c.created_at
    """
    rows = db.fetch_all(query, (request_id,))
    logger.info(f"Retrieved {len(rows)} comments for request {request_id}")
    return [FeatureRequestComment(**r) for r in rows]

@router.post("/{request_id}/comments", response_model=FeatureRequestComment)
async def add_comment(request_id: int, comment: CommentCreate, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"User {comment.user_id} adding comment to request {request_id}")
    with db.get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO feature_request_comments (request_id, user_id, comment) VALUES (%s, %s, %s) RETURNING comment_id, created_at""",
                (request_id, comment.user_id, comment.comment)
            )
            row = cur.fetchone()
            cur.execute("SELECT name FROM users WHERE user_id = %s", (comment.user_id,))
            user_row = cur.fetchone()
            conn.commit()
    return FeatureRequestComment(
        id=row[0],
        request_id=request_id,
        user_id=comment.user_id,
        user_name=user_row[0] if user_row else "",
        comment=comment.comment,
        created_at=row[1].isoformat()
    )

@router.get("/user/{user_id}", response_model=List[FeatureRequestResponse])
async def get_user_requests(user_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Listing requests created by user {user_id}")
    rows = db.fetch_all(
        """SELECT fr.request_id AS id, fr.title, fr.description, fr.type, fr.status, fr.priority, fr.user_id, u.name AS user_name, fr.created_at::text, fr.updated_at::text, 0 as upvotes, 0 as downvotes, 0 as comments_count FROM feature_requests fr JOIN users u ON fr.user_id = u.user_id WHERE fr.user_id = %s ORDER BY fr.created_at DESC""",
        (user_id,)
    )
    for r in rows:
        tag_rows = db.fetch_all(
            "SELECT t.tag_name FROM feature_request_tag_map m JOIN feature_request_tags t ON m.tag_id = t.tag_id WHERE m.request_id = %s",
            (r["id"],)
        )
        r["tags"] = [t["tag_name"] for t in tag_rows]
    logger.info(f"User {user_id} has {len(rows)} requests")
    return [FeatureRequestResponse(**r) for r in rows]

@router.get("/trending", response_model=List[FeatureRequestResponse])
async def get_trending(limit: int = 5, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching top {limit} trending requests")
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
            fr.created_at::text,
            fr.updated_at::text,
            COALESCE(SUM(CASE WHEN frv.vote_type='up' THEN 1 ELSE 0 END),0) AS upvotes,
            COALESCE(SUM(CASE WHEN frv.vote_type='down' THEN 1 ELSE 0 END),0) AS downvotes,
            COUNT(DISTINCT frc.comment_id) AS comments_count
        FROM feature_requests fr
        JOIN users u ON fr.user_id = u.user_id
        LEFT JOIN feature_request_votes frv ON fr.request_id = frv.request_id AND frv.voted_at >= NOW() - INTERVAL '7 days'
        LEFT JOIN feature_request_comments frc ON fr.request_id = frc.request_id
        GROUP BY fr.request_id, u.name
        ORDER BY upvotes DESC, fr.created_at DESC
        LIMIT %s
    """
    rows = db.fetch_all(query, (limit,))
    for r in rows:
        tag_rows = db.fetch_all(
            "SELECT t.tag_name FROM feature_request_tag_map m JOIN feature_request_tags t ON m.tag_id = t.tag_id WHERE m.request_id = %s",
            (r["id"],)
        )
        r["tags"] = [t["tag_name"] for t in tag_rows]
    logger.info(f"Trending requests returned: {len(rows)}")
    return [FeatureRequestResponse(**r) for r in rows]
