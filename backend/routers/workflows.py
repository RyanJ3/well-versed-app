# backend/routers/workflows.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import json
import logging
from database import DatabaseConnection
import db_pool

logger = logging.getLogger(__name__)

router = APIRouter()


class WorkflowCreate(BaseModel):
    name: str = Field(alias="title")
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_public: bool = False
    tags: List[str] = []


class WorkflowResponse(BaseModel):
    workflow_id: int
    creator_id: int
    creator_name: str
    name: str
    description: Optional[str]
    thumbnail_url: Optional[str] = None
    is_public: bool
    created_at: str
    updated_at: str
    lesson_count: int = 0
    tags: List[str] = []


class WorkflowListResponse(BaseModel):
    total: int
    workflows: List[WorkflowResponse]


class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str
    content_data: Optional[Dict] = None
    audio_url: Optional[str] = None
    flashcards_required: int = 0
    position: Optional[int] = None


class LessonResponse(BaseModel):
    lesson_id: int
    workflow_id: int
    position: int
    title: str
    description: Optional[str]
    content_type: str
    content_data: Optional[Dict] = None
    audio_url: Optional[str] = None
    flashcards_required: int
    created_at: str


class LessonListResponse(BaseModel):
    total: int
    lessons: List[LessonResponse]


def get_db():
    return DatabaseConnection(db_pool.db_pool)


@router.post("", response_model=WorkflowResponse)
async def create_workflow(
    workflow: WorkflowCreate, db: DatabaseConnection = Depends(get_db)
):
    user_id = 1  # TODO: auth
    with db.get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO workflows (user_id, name, description, thumbnail_url, is_public)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING workflow_id, created_at, updated_at
                """,
                (
                    user_id,
                    workflow.name,
                    workflow.description,
                    workflow.thumbnail_url,
                    workflow.is_public,
                ),
            )
            row = cur.fetchone()
            workflow_id = row[0]
            created_at = row[1].isoformat()
            updated_at = row[2].isoformat()
            cur.execute("SELECT name FROM users WHERE user_id = %s", (user_id,))
            creator_name = cur.fetchone()[0]

            # Handle tags
            for tag in workflow.tags:
                cur.execute(
                    "INSERT INTO workflow_tags (tag_name) VALUES (%s) ON CONFLICT (tag_name) DO UPDATE SET tag_name = EXCLUDED.tag_name RETURNING tag_id",
                    (tag,),
                )
                tag_id = cur.fetchone()[0]
                cur.execute(
                    "INSERT INTO workflow_tag_map (workflow_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (workflow_id, tag_id),
                )
            conn.commit()

    return WorkflowResponse(
        workflow_id=workflow_id,
        creator_id=user_id,
        creator_name=creator_name,
        name=workflow.name,
        description=workflow.description,
        thumbnail_url=workflow.thumbnail_url,
        is_public=workflow.is_public,
        created_at=created_at,
        updated_at=updated_at,
        lesson_count=0,
        tags=workflow.tags,
    )


@router.get("/public", response_model=WorkflowListResponse)
async def list_public_workflows(
    search: Optional[str] = None,
    tags: Optional[str] = None,
    db: DatabaseConnection = Depends(get_db),
):
    where_clause = "WHERE w.is_public = TRUE"
    params: List[str] = []
    if search:
        where_clause += " AND (w.name ILIKE %s OR w.description ILIKE %s)"
        like = f"%{search}%"
        params.extend([like, like])
    if tags:
        tag_list = [t.strip() for t in tags.split(',') if t.strip()]
        if tag_list:
            where_clause += " AND t.tag_name = ANY(%s)"
            params.append(tag_list)

    query = f"""
        SELECT w.workflow_id, w.user_id, u.name, w.name, w.description,
               w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
               COUNT(DISTINCT l.lesson_id) as lesson_count,
               ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
        FROM workflows w
        JOIN users u ON w.user_id = u.user_id
        LEFT JOIN workflow_lessons l ON w.workflow_id = l.workflow_id
        LEFT JOIN workflow_tag_map m ON w.workflow_id = m.workflow_id
        LEFT JOIN workflow_tags t ON m.tag_id = t.tag_id
        {where_clause}
        GROUP BY w.workflow_id, w.user_id, u.name, w.name, w.description, w.thumbnail_url, w.is_public, w.created_at, w.updated_at
        ORDER BY w.created_at DESC
    """
    rows = db.fetch_all(query, tuple(params))
    workflows = []
    for r in rows:
        workflows.append(
            WorkflowResponse(
                workflow_id=r["workflow_id"],
                creator_id=r["user_id"],
                creator_name=r["name"],
                name=r["name"],
                description=r["description"],
                thumbnail_url=r.get("thumbnail_url"),
                is_public=r["is_public"],
                created_at=r["created_at"].isoformat(),
                updated_at=r["updated_at"].isoformat(),
                lesson_count=r["lesson_count"],
                tags=r.get("tags") or [],
            )
        )
    return WorkflowListResponse(total=len(workflows), workflows=workflows)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: int, db: DatabaseConnection = Depends(get_db)):
    query = """
        SELECT w.workflow_id, w.user_id, u.name as creator_name, w.name, w.description,
               w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
               COUNT(DISTINCT l.lesson_id) as lesson_count,
               ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
        FROM workflows w
        JOIN users u ON w.user_id = u.user_id
        LEFT JOIN workflow_lessons l ON w.workflow_id = l.workflow_id
        LEFT JOIN workflow_tag_map m ON w.workflow_id = m.workflow_id
        LEFT JOIN workflow_tags t ON m.tag_id = t.tag_id
        WHERE w.workflow_id = %s
        GROUP BY w.workflow_id, w.user_id, u.name, w.name, w.description, w.thumbnail_url, w.is_public, w.created_at, w.updated_at
    """
    row = db.fetch_one(query, (workflow_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowResponse(
        workflow_id=row["workflow_id"],
        creator_id=row["user_id"],
        creator_name=row["creator_name"],
        name=row["name"],
        description=row["description"],
        thumbnail_url=row.get("thumbnail_url"),
        is_public=row["is_public"],
        created_at=row["created_at"].isoformat(),
        updated_at=row["updated_at"].isoformat(),
        lesson_count=row["lesson_count"],
        tags=row.get("tags") or [],
    )


@router.post("/{workflow_id}/lessons", response_model=LessonResponse)
async def add_lesson(
    workflow_id: int, lesson: LessonCreate, db: DatabaseConnection = Depends(get_db)
):
    user_id = 1
    # Verify workflow ownership
    wf = db.fetch_one(
        "SELECT user_id FROM workflows WHERE workflow_id = %s", (workflow_id,)
    )
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if wf["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify workflow")
    position = lesson.position or 1
    with db.get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO workflow_lessons (workflow_id, position, title, description, content_type, content_data, audio_url, flashcards_required)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING lesson_id, created_at
                """,
                (
                    workflow_id,
                    position,
                    lesson.title,
                    lesson.description,
                    lesson.content_type,
                    json.dumps(lesson.content_data) if lesson.content_data else None,
                    lesson.audio_url,
                    lesson.flashcards_required,
                ),
            )
            row = cur.fetchone()
            conn.commit()
            lesson_id = row[0]
            created_at = row[1].isoformat()
    return LessonResponse(
        lesson_id=lesson_id,
        workflow_id=workflow_id,
        position=position,
        title=lesson.title,
        description=lesson.description,
        content_type=lesson.content_type,
        content_data=lesson.content_data,
        audio_url=lesson.audio_url,
        flashcards_required=lesson.flashcards_required,
        created_at=created_at,
    )


@router.get("/{workflow_id}/lessons", response_model=LessonListResponse)
async def list_lessons(workflow_id: int, db: DatabaseConnection = Depends(get_db)):
    query = """
        SELECT lesson_id, workflow_id, position, title, description, content_type, content_data,
               audio_url, flashcards_required, created_at
        FROM workflow_lessons
        WHERE workflow_id = %s
        ORDER BY position
    """
    rows = db.fetch_all(query, (workflow_id,))
    lessons = [
        LessonResponse(
            lesson_id=r["lesson_id"],
            workflow_id=r["workflow_id"],
            position=r["position"],
            title=r["title"],
            description=r.get("description"),
            content_type=r["content_type"],
            content_data=r.get("content_data"),
            audio_url=r.get("audio_url"),
            flashcards_required=r.get("flashcards_required", 0),
            created_at=r["created_at"].isoformat(),
        )
        for r in rows
    ]
    return LessonListResponse(total=len(lessons), lessons=lessons)
