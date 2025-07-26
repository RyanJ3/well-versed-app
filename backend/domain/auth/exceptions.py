"""Authentication exceptions"""

from domain.core.exceptions import DomainException

class AuthenticationError(DomainException):
    """Authentication failed"""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(detail)

class AuthorizationError(DomainException):
    """Authorization failed"""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(detail)

class TokenExpiredError(AuthenticationError):
    """Token has expired"""
    def __init__(self):
        super().__init__("Token has expired")

class InvalidTokenError(AuthenticationError):
    """Invalid token"""
    def __init__(self):
        super().__init__("Invalid token")
