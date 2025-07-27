from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class FeatureRequestCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: str = Field(..., pattern="^(feature|bug|improvement|documentation)$")
    tags: List[str] = Field(default_factory=list)


class VoteRequest(BaseModel):
    vote_type: str = Field(..., pattern="^(up|down)$")


class CommentCreate(BaseModel):
    comment: str = Field(..., min_length=1)


class FeatureRequestResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    type: str
    status: str
    priority: Optional[str]
    upvotes: int
    downvotes: int
    user_id: int
    user_name: str
    created_at: datetime
    updated_at: Optional[datetime]
    tags: List[str]
    comments_count: int


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
    created_at: datetime

