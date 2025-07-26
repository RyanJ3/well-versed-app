"""Base exceptions for all domain operations"""


class DomainException(Exception):
    """Base exception for all domain errors"""

    def __init__(self, message: str, details: dict | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class NotFoundError(DomainException):
    """Resource not found"""

    def __init__(self, resource: str, id: object) -> None:
        super().__init__(f"{resource} {id} not found")
        self.resource = resource
        self.id = id


class ValidationError(DomainException):
    """Business rule validation failed"""


class AccessDeniedError(DomainException):
    """User doesn't have access to resource"""

    def __init__(self, user_id: int, resource: str, id: object) -> None:
        super().__init__(f"User {user_id} cannot access {resource} {id}")
        self.user_id = user_id
        self.resource = resource
        self.id = id


class ConflictError(DomainException):
    """Resource already exists or conflicts with existing data"""

