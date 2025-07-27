from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional

from core.dependencies import get_feature_request_service
from domain.feature_requests import (
    FeatureRequestService,
    FeatureRequestCreate,
    FeatureRequestResponse,
    FeatureRequestListResponse,
    FeatureRequestComment,
    CommentCreate,
    VoteRequest,
    FeatureRequestNotFoundError,
)

router = APIRouter(tags=["feature_requests"])


def get_current_user_id() -> int:
    """Placeholder for auth"""
    return 1


@router.get("", response_model=FeatureRequestListResponse)
def list_requests(
    page: int = 1,
    per_page: int = 20,
    type: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "upvotes",
    search: Optional[str] = None,
    service: FeatureRequestService = Depends(get_feature_request_service),
):
    """List feature requests"""
    return service.get_requests(page, per_page, type, status, sort_by, search)


@router.get("/trending", response_model=List[FeatureRequestResponse])
def get_trending(
    limit: int = 5,
    service: FeatureRequestService = Depends(get_feature_request_service),
):
    """Get trending requests"""
    return service.get_trending_requests(limit)


@router.get("/{request_id}", response_model=FeatureRequestResponse)
def get_request(
    request_id: int,
    service: FeatureRequestService = Depends(get_feature_request_service),
):
    """Get single request"""
    try:
        return service.get_request(request_id)
    except FeatureRequestNotFoundError:
        raise HTTPException(status_code=404, detail="Feature request not found")


@router.post("", response_model=FeatureRequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    data: FeatureRequestCreate,
    user_id: int = Depends(get_current_user_id),
    service: FeatureRequestService = Depends(get_feature_request_service),
):
    """Create feature request"""
    return service.create_request(data, user_id)


@router.post("/{request_id}/vote")
def vote_request(
    request_id: int,
    vote: VoteRequest,
    user_id: int = Depends(get_current_user_id),
    service: FeatureRequestService = Depends(get_feature_request_service),
):
    """Vote on request"""
    return service.vote(request_id, user_id, vote.vote_type)


@router.delete("/{request_id}/vote")
def remove_vote(
    request_id: int,
    user_id: int = Depends(get_current_user_id),
    service: FeatureRequestService = Depends(get_feature_request_service),
):
    """Remove vote"""
    return service.remove_vote(request_id, user_id)


@router.get("/{request_id}/comments", response_model=List[FeatureRequestComment])
def list_comments(
    request_id: int,
    service: FeatureRequestService = Depends(get_feature_request_service),
):
    """List comments"""
    return service.get_comments(request_id)


@router.post("/{request_id}/comments", response_model=FeatureRequestComment)
def add_comment(
    request_id: int,
    data: CommentCreate,
    user_id: int = Depends(get_current_user_id),
    service: FeatureRequestService = Depends(get_feature_request_service),
):
    """Add comment"""
    return service.add_comment(request_id, user_id, data.comment)


@router.get("/user/{user_id}", response_model=List[FeatureRequestResponse])
def get_user_requests(
    user_id: int,
    service: FeatureRequestService = Depends(get_feature_request_service),
):
    """Get user's requests"""
    return service.get_user_requests(user_id)

