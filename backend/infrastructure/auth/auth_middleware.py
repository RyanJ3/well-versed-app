"""Simple auth middleware for logging requests"""

from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware to log auth headers for debugging"""

    async def dispatch(self, request, call_next):
        auth = request.headers.get("authorization", "")
        if auth:
            logger.debug("Auth header received")
        response = await call_next(request)
        return response
