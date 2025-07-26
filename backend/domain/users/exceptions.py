"""User-specific exceptions"""

from domain.core.exceptions import NotFoundError, ConflictError, ValidationError


class UserNotFoundError(NotFoundError):
    """User not found"""

    def __init__(self, user_id: int):
        super().__init__("User", user_id)


class EmailAlreadyExistsError(ConflictError):
    """Email already registered"""

    def __init__(self, email: str):
        super().__init__(f"Email {email} is already registered")
        self.email = email


class InvalidCredentialsError(ValidationError):
    """Invalid login credentials"""

    def __init__(self):
        super().__init__("Invalid email or password")
