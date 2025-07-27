import logging
from typing import List, Optional, Dict

from .schemas import (
    FeatureRequestCreate,
    FeatureRequestResponse,
    FeatureRequestListResponse,
    FeatureRequestComment,
    CommentCreate,
    VoteRequest,
)
from .repository import FeatureRequestRepository
from .exceptions import FeatureRequestNotFoundError


logger = logging.getLogger(__name__)


class FeatureRequestService:
    def __init__(self, repository: FeatureRequestRepository):
        self.repository = repository

    def create_request(self, data: FeatureRequestCreate, user_id: int) -> FeatureRequestResponse:
        logger.info(f"Creating feature request '{data.title}' for user {user_id}")
        result = self.repository.create_request(
            title=data.title,
            description=data.description or "",
            type=data.type,
            user_id=user_id,
            tags=data.tags,
        )
        return FeatureRequestResponse(**result)

    def get_requests(
        self,
        page: int = 1,
        per_page: int = 20,
        type: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "upvotes",
        search: Optional[str] = None,
    ) -> "FeatureRequestListResponse":
        offset = (page - 1) * per_page
        filters = {}
        if type:
            filters["type"] = type
        if status:
            filters["status"] = status
        if search:
            filters["search"] = search

        requests, total = self.repository.get_requests(
            limit=per_page,
            offset=offset,
            filters=filters,
        )

        return FeatureRequestListResponse(
            total=total,
            requests=[FeatureRequestResponse(**r) for r in requests],
            page=page,
            per_page=per_page,
        )

    def get_request(self, request_id: int) -> FeatureRequestResponse:
        result = self.repository.get_request_by_id(request_id)
        if not result:
            raise FeatureRequestNotFoundError(f"Feature request {request_id} not found")
        return FeatureRequestResponse(**result)

    def vote(self, request_id: int, user_id: int, vote_type: str) -> Dict:
        logger.info(f"User {user_id} voting {vote_type} on request {request_id}")
        self.repository.add_vote(request_id, user_id, vote_type)
        return {"message": "Vote recorded"}

    def remove_vote(self, request_id: int, user_id: int) -> Dict:
        logger.info(f"Removing vote by user {user_id} from request {request_id}")
        self.repository.remove_vote(request_id, user_id)
        return {"message": "Vote removed"}

    def add_comment(self, request_id: int, user_id: int, comment: str) -> FeatureRequestComment:
        logger.info(f"User {user_id} adding comment to request {request_id}")
        result = self.repository.add_comment(request_id, user_id, comment)
        return FeatureRequestComment(**result)

    def get_comments(self, request_id: int) -> List[FeatureRequestComment]:
        results = self.repository.get_comments(request_id)
        return [FeatureRequestComment(**r) for r in results]

    def get_user_requests(self, user_id: int) -> List[FeatureRequestResponse]:
        results = self.repository.get_user_requests(user_id)
        return [FeatureRequestResponse(**r) for r in results]

    def get_trending_requests(self, limit: int = 5) -> List[FeatureRequestResponse]:
        results = self.repository.get_trending_requests(limit)
        return [FeatureRequestResponse(**r) for r in results]

