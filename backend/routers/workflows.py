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


class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(default=None, alias="title")
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class WorkflowResponse(BaseModel):
    id: int = Field(alias="workflow_id")
    creator_id: int
    creator_name: str
    title: str = Field(alias="name")
    description: Optional[str]
    thumbnail_url: Optional[str] = None
    is_public: bool
    created_at: str
    updated_at: str
    lesson_count: int = 0
    enrolled_count: int = 0
    tags: List[str] = []
    average_rating: Optional[float] = None


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


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    content_data: Optional[Dict] = None
    audio_url: Optional[str] = None
    flashcards_required: Optional[int] = None
    position: Optional[int] = None


class LessonResponse(BaseModel):
    id: int = Field(alias="lesson_id")
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


class UserWorkflowProgress(BaseModel):
    user_id: int
    workflow_id: int
    current_lesson_id: Optional[int] = None
    current_lesson_position: int
    lessons_completed: int
    enrolled_at: str
    last_accessed: str
    completed_at: Optional[str] = None


class UserLessonProgress(BaseModel):
    user_id: int
    lesson_id: int
    workflow_id: int
    started_at: str
    completed_at: Optional[str] = None
    flashcards_required: int
    flashcards_completed: int
    is_unlocked: bool
    quiz_attempts: Optional[int] = None
    best_score: Optional[int] = None
    last_attempt: Optional[str] = None


def get_db():
    return DatabaseConnection(db_pool.db_pool)


@router.post("", response_model=WorkflowResponse)
async def create_workflow(
    workflow: WorkflowCreate, db: DatabaseConnection = Depends(get_db)
):
    logger.info(f"Creating workflow request: {workflow.dict()}")
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
    logger.info(f"Workflow {workflow_id} created with {len(workflow.tags)} tags")
    response = WorkflowResponse(
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
        enrolled_count=0,
        tags=workflow.tags,
    )
    logger.info(f"Create workflow response: {response}")
    return response


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    updates: WorkflowUpdate,
    db: DatabaseConnection = Depends(get_db),
):
    logger.info(f"Updating workflow {workflow_id}: {updates.dict(exclude_unset=True)}")
    update_fields = []
    params: List = []
    if updates.name is not None:
        update_fields.append("name = %s")
        params.append(updates.name)
    if updates.description is not None:
        update_fields.append("description = %s")
        params.append(updates.description)
    if updates.thumbnail_url is not None:
        update_fields.append("thumbnail_url = %s")
        params.append(updates.thumbnail_url)
    if updates.is_public is not None:
        update_fields.append("is_public = %s")
        params.append(updates.is_public)
    params.append(workflow_id)
    if update_fields:
        query = f"UPDATE workflows SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP WHERE workflow_id = %s"
        db.execute(query, tuple(params))

    if updates.tags is not None:
        with db.get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM workflow_tag_map WHERE workflow_id = %s",
                    (workflow_id,),
                )
                for tag in updates.tags:
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

    response = await get_workflow(workflow_id, db)
    logger.info(f"Updated workflow response: {response}")
    return response


@router.get("/tags", response_model=List[str])
async def list_workflow_tags(db: DatabaseConnection = Depends(get_db)):
    logger.info("Listing workflow tags")
    rows = db.fetch_all("SELECT tag_name FROM workflow_tags ORDER BY tag_name")
    return [r["tag_name"] for r in rows]


@router.get("/public", response_model=WorkflowListResponse)
async def list_public_workflows(
    search: Optional[str] = None,
    tags: Optional[str] = None,
    db: DatabaseConnection = Depends(get_db),
):
    logger.info(f"Listing public workflows search={search} tags={tags}")
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
        SELECT w.workflow_id, w.user_id, u.name AS creator_name, w.name, w.description,
               w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
               COUNT(DISTINCT l.lesson_id) as lesson_count,
               COUNT(DISTINCT e.user_id) as enrolled_count,
               COALESCE(AVG(r.rating)::float, 0) as average_rating,
               ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
        FROM workflows w
        JOIN users u ON w.user_id = u.user_id
        LEFT JOIN workflow_lessons l ON w.workflow_id = l.workflow_id
        LEFT JOIN workflow_enrollments e ON w.workflow_id = e.workflow_id
        LEFT JOIN workflow_ratings r ON w.workflow_id = r.workflow_id
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
                creator_name=r["creator_name"],
                name=r["name"],
                description=r["description"],
                thumbnail_url=r.get("thumbnail_url"),
                is_public=r["is_public"],
                created_at=r["created_at"].isoformat(),
                updated_at=r["updated_at"].isoformat(),
                lesson_count=r["lesson_count"],
                enrolled_count=r.get("enrolled_count", 0),
                tags=r.get("tags") or [],
                average_rating=r.get("average_rating"),
            )
        )
    logger.info(f"Public workflows returned: {len(workflows)}")
    return WorkflowListResponse(total=len(workflows), workflows=workflows)


@router.get("/user/{user_id}", response_model=WorkflowListResponse)
async def list_user_workflows(user_id: int, db: DatabaseConnection = Depends(get_db)):
    query = """
        SELECT w.workflow_id, w.user_id, u.name AS creator_name, w.name, w.description,
               w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
               COUNT(DISTINCT l.lesson_id) as lesson_count,
               COUNT(DISTINCT e.user_id) as enrolled_count,
               COALESCE(AVG(r.rating)::float, 0) as average_rating,
               ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
        FROM workflows w
        JOIN users u ON w.user_id = u.user_id
        LEFT JOIN workflow_lessons l ON w.workflow_id = l.workflow_id
        LEFT JOIN workflow_enrollments e ON w.workflow_id = e.workflow_id
        LEFT JOIN workflow_ratings r ON w.workflow_id = r.workflow_id
        LEFT JOIN workflow_tag_map m ON w.workflow_id = m.workflow_id
        LEFT JOIN workflow_tags t ON m.tag_id = t.tag_id
        WHERE w.user_id = %s
        GROUP BY w.workflow_id, w.user_id, u.name, w.name, w.description, w.thumbnail_url, w.is_public, w.created_at, w.updated_at
        ORDER BY w.created_at DESC
    """
    rows = db.fetch_all(query, (user_id,))
    workflows = [
        WorkflowResponse(
            workflow_id=r["workflow_id"],
            creator_id=r["user_id"],
            creator_name=r["creator_name"],
            name=r["name"],
            description=r["description"],
            thumbnail_url=r.get("thumbnail_url"),
            is_public=r["is_public"],
            created_at=r["created_at"].isoformat(),
            updated_at=r["updated_at"].isoformat(),
            lesson_count=r["lesson_count"],
            enrolled_count=r.get("enrolled_count", 0),
            tags=r.get("tags") or [],
            average_rating=r.get("average_rating"),
        )
        for r in rows
    ]
    logger.info(f"User {user_id} workflows returned: {len(workflows)}")
    return WorkflowListResponse(total=len(workflows), workflows=workflows)


@router.get("/enrolled/{user_id}", response_model=List[WorkflowResponse])
async def list_enrolled_workflows(user_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Listing workflows enrolled by user {user_id}")
    query = """
        SELECT w.workflow_id, w.user_id, u.name AS creator_name, w.name, w.description,
               w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
               e.enrolled_at,
               COUNT(DISTINCT l.lesson_id) as lesson_count,
               COUNT(DISTINCT e2.user_id) as enrolled_count,
               COALESCE(AVG(r.rating)::float, 0) as average_rating,
               ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
        FROM workflow_enrollments e
        JOIN workflows w ON e.workflow_id = w.workflow_id
        JOIN users u ON w.user_id = u.user_id
        LEFT JOIN workflow_lessons l ON w.workflow_id = l.workflow_id
        LEFT JOIN workflow_enrollments e2 ON w.workflow_id = e2.workflow_id
        LEFT JOIN workflow_ratings r ON w.workflow_id = r.workflow_id
        LEFT JOIN workflow_tag_map m ON w.workflow_id = m.workflow_id
        LEFT JOIN workflow_tags t ON m.tag_id = t.tag_id
        WHERE e.user_id = %s
        GROUP BY w.workflow_id, w.user_id, u.name, w.name, w.description, w.thumbnail_url, w.is_public, w.created_at, w.updated_at, e.enrolled_at
        ORDER BY e.enrolled_at DESC
    """
    rows = db.fetch_all(query, (user_id,))
    workflows = [
        WorkflowResponse(
            workflow_id=r["workflow_id"],
            creator_id=r["user_id"],
            creator_name=r["creator_name"],
            name=r["name"],
            description=r["description"],
            thumbnail_url=r.get("thumbnail_url"),
            is_public=r["is_public"],
            created_at=r["created_at"].isoformat(),
            updated_at=r["updated_at"].isoformat(),
            lesson_count=r["lesson_count"],
            enrolled_count=r.get("enrolled_count", 0),
            tags=r.get("tags") or [],
            average_rating=r.get("average_rating"),
        )
        for r in rows
    ]
    logger.info(f"User {user_id} enrolled workflows count: {len(workflows)}")
    return workflows


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching workflow {workflow_id}")
    query = """
        SELECT w.workflow_id, w.user_id, u.name as creator_name, w.name, w.description,
               w.thumbnail_url, w.is_public, w.created_at, w.updated_at,
               COUNT(DISTINCT l.lesson_id) as lesson_count,
               COUNT(DISTINCT e.user_id) as enrolled_count,
               COALESCE(AVG(r.rating)::float, 0) as average_rating,
               ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.tag_name), NULL) as tags
        FROM workflows w
        JOIN users u ON w.user_id = u.user_id
        LEFT JOIN workflow_lessons l ON w.workflow_id = l.workflow_id
        LEFT JOIN workflow_enrollments e ON w.workflow_id = e.workflow_id
        LEFT JOIN workflow_ratings r ON w.workflow_id = r.workflow_id
        LEFT JOIN workflow_tag_map m ON w.workflow_id = m.workflow_id
        LEFT JOIN workflow_tags t ON m.tag_id = t.tag_id
        WHERE w.workflow_id = %s
        GROUP BY w.workflow_id, w.user_id, u.name, w.name, w.description, w.thumbnail_url, w.is_public, w.created_at, w.updated_at
    """
    row = db.fetch_one(query, (workflow_id,))
    if not row:
        logger.warning(f"Workflow {workflow_id} not found")
        raise HTTPException(status_code=404, detail="Workflow not found")
    response = WorkflowResponse(
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
        enrolled_count=row.get("enrolled_count", 0),
        tags=row.get("tags") or [],
        average_rating=row.get("average_rating"),
    )
    logger.info(f"Fetched workflow {workflow_id}")
    return response


@router.post("/{workflow_id}/enroll", response_model=UserWorkflowProgress)
async def enroll_workflow(workflow_id: int, user_id: int = 1, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Enrolling user {user_id} in workflow {workflow_id}")
    with db.get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO workflow_enrollments (user_id, workflow_id)
                VALUES (%s, %s)
                ON CONFLICT (user_id, workflow_id)
                DO UPDATE SET last_accessed = CURRENT_TIMESTAMP
                RETURNING user_id, workflow_id, current_lesson_id, current_lesson_position,
                          lessons_completed, enrolled_at, last_accessed, completed_at
                """,
                (user_id, workflow_id),
            )
            row = cur.fetchone()
            conn.commit()
    response = UserWorkflowProgress(
        user_id=row[0],
        workflow_id=row[1],
        current_lesson_id=row[2],
        current_lesson_position=row[3],
        lessons_completed=row[4],
        enrolled_at=row[5].isoformat(),
        last_accessed=row[6].isoformat(),
        completed_at=row[7].isoformat() if row[7] else None,
    )
    logger.info(f"Enroll workflow response: {response}")
    return response


@router.delete("/{workflow_id}/enroll/{user_id}")
async def unenroll_workflow(workflow_id: int, user_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Unenrolling user {user_id} from workflow {workflow_id}")
    db.execute(
        "DELETE FROM workflow_enrollments WHERE workflow_id = %s AND user_id = %s",
        (workflow_id, user_id),
    )
    return {"message": "Unenrolled"}


@router.get("/{workflow_id}/progress/{user_id}", response_model=UserWorkflowProgress)
async def get_workflow_progress(workflow_id: int, user_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching progress for user {user_id} workflow {workflow_id}")
    row = db.fetch_one(
        """
        SELECT user_id, workflow_id, current_lesson_id, current_lesson_position,
               lessons_completed, enrolled_at, last_accessed, completed_at
        FROM workflow_enrollments
        WHERE workflow_id = %s AND user_id = %s
        """,
        (workflow_id, user_id),
    )
    if not row:
        logger.warning(f"Enrollment not found for user {user_id} workflow {workflow_id}")
        raise HTTPException(status_code=404, detail="Enrollment not found")
    response = UserWorkflowProgress(
        user_id=row["user_id"],
        workflow_id=row["workflow_id"],
        current_lesson_id=row.get("current_lesson_id"),
        current_lesson_position=row["current_lesson_position"],
        lessons_completed=row["lessons_completed"],
        enrolled_at=row["enrolled_at"].isoformat(),
        last_accessed=row["last_accessed"].isoformat(),
        completed_at=row["completed_at"].isoformat() if row.get("completed_at") else None,
    )
    logger.info(f"Workflow progress response: {response}")
    return response



@router.post("/{workflow_id}/lessons", response_model=LessonResponse)
async def add_lesson(
    workflow_id: int, lesson: LessonCreate, db: DatabaseConnection = Depends(get_db)
):
    logger.info(f"Adding lesson to workflow {workflow_id}: {lesson.dict()}")
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
    response = LessonResponse(
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
    logger.info(f"Added lesson response: {response}")
    return response


@router.get("/{workflow_id}/lessons", response_model=LessonListResponse)
async def list_lessons(workflow_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Listing lessons for workflow {workflow_id}")
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
    logger.info(f"Lessons returned: {len(lessons)} for workflow {workflow_id}")
    return LessonListResponse(total=len(lessons), lessons=lessons)


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(lesson_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching lesson {lesson_id}")
    row = db.fetch_one(
        """
        SELECT lesson_id, workflow_id, position, title, description, content_type, content_data,
               audio_url, flashcards_required, created_at
        FROM workflow_lessons
        WHERE lesson_id = %s
        """,
        (lesson_id,),
    )
    if not row:
        logger.warning(f"Lesson {lesson_id} not found")
        raise HTTPException(status_code=404, detail="Lesson not found")
    response = LessonResponse(
        lesson_id=row["lesson_id"],
        workflow_id=row["workflow_id"],
        position=row["position"],
        title=row["title"],
        description=row.get("description"),
        content_type=row["content_type"],
        content_data=row.get("content_data"),
        audio_url=row.get("audio_url"),
        flashcards_required=row.get("flashcards_required", 0),
        created_at=row["created_at"].isoformat(),
    )
    logger.info(f"Fetched lesson {lesson_id}")
    return response


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(lesson_id: int, updates: LessonUpdate, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Updating lesson {lesson_id}: {updates.dict(exclude_unset=True)}")
    update_fields = []
    params = []
    if updates.title is not None:
        update_fields.append("title = %s")
        params.append(updates.title)
    if updates.description is not None:
        update_fields.append("description = %s")
        params.append(updates.description)
    if updates.content_type is not None:
        update_fields.append("content_type = %s")
        params.append(updates.content_type)
    if updates.content_data is not None:
        update_fields.append("content_data = %s")
        params.append(json.dumps(updates.content_data))
    if updates.audio_url is not None:
        update_fields.append("audio_url = %s")
        params.append(updates.audio_url)
    if updates.flashcards_required is not None:
        update_fields.append("flashcards_required = %s")
        params.append(updates.flashcards_required)
    if updates.position is not None:
        update_fields.append("position = %s")
        params.append(updates.position)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    params.append(lesson_id)
    query = f"UPDATE workflow_lessons SET {', '.join(update_fields)} WHERE lesson_id = %s"
    db.execute(query, tuple(params))
    response = await get_lesson(lesson_id, db)
    logger.info(f"Updated lesson response: {response}")
    return response


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(lesson_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Deleting lesson {lesson_id}")
    db.execute("DELETE FROM workflow_lessons WHERE lesson_id = %s", (lesson_id,))
    return {"message": "Lesson deleted"}


class RatingRequest(BaseModel):
    user_id: int
    rating: int


@router.post("/{workflow_id}/rating")
async def submit_rating(workflow_id: int, req: RatingRequest, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"User {req.user_id} rating workflow {workflow_id} = {req.rating}")
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    db.execute(
        """
        INSERT INTO workflow_ratings (user_id, workflow_id, rating)
        VALUES (%s, %s, %s)
        ON CONFLICT (user_id, workflow_id)
        DO UPDATE SET rating = EXCLUDED.rating, created_at = CURRENT_TIMESTAMP
        """,
        (req.user_id, workflow_id, req.rating),
    )
    return {"message": "Rating saved"}


@router.get("/{workflow_id}/rating")
async def get_rating(workflow_id: int, user_id: Optional[int] = None, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching rating for workflow {workflow_id} user {user_id}")
    row = db.fetch_one(
        "SELECT AVG(rating)::float AS avg FROM workflow_ratings WHERE workflow_id = %s",
        (workflow_id,),
    )
    avg = row["avg"] if row and row["avg"] is not None else 0
    user_rating = None
    if user_id is not None:
        ur = db.fetch_one(
            "SELECT rating FROM workflow_ratings WHERE workflow_id = %s AND user_id = %s",
            (workflow_id, user_id),
        )
        user_rating = ur["rating"] if ur else None
    return {"workflow_id": workflow_id, "average_rating": avg, "user_rating": user_rating}

