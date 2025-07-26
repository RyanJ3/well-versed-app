"""User business logic"""

from typing import Optional, Dict, List
import hashlib
import secrets
from datetime import datetime
from domain.core import BaseService
from .repository import UserRepository
from .schemas import UserCreate, UserUpdate, UserResponse, UserLogin, UserStats
from .exceptions import UserNotFoundError, EmailAlreadyExistsError, InvalidCredentialsError
import logging

logger = logging.getLogger(__name__)


class UserService(BaseService):
    """Service layer for user operations"""

    def __init__(self, repository: UserRepository):
        super().__init__(repository)
        self.repo: UserRepository = repository

    def _hash_password(self, password: str) -> str:
        """Hash password with salt"""
        salt = secrets.token_hex(16)
        pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
        return f"{salt}${pwd_hash.hex()}"

    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        try:
            salt, hash_hex = password_hash.split("$")
            pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
            return pwd_hash.hex() == hash_hex
        except Exception:
            return False

    def create_user(self, user_data: UserCreate) -> UserResponse:
        """Create new user"""
        logger.info(f"Creating user with email: {user_data.email}")

        if self.repo.email_exists(user_data.email):
            raise EmailAlreadyExistsError(user_data.email)

        password_hash = self._hash_password(user_data.password)
        user = self.repo.create(email=user_data.email, password_hash=password_hash, name=user_data.name)

        logger.info(f"User created successfully: {user['user_id']}")
        return UserResponse(**user)

    def get_user(self, user_id: int) -> UserResponse:
        """Get user by ID"""
        user = self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(user_id)
        return UserResponse(**user)

    def update_user(self, user_id: int, update_data: UserUpdate) -> UserResponse:
        """Update user information"""
        logger.info(f"Updating user: {user_id}")

        existing_user = self.repo.get_by_id(user_id)
        if not existing_user:
            raise UserNotFoundError(user_id)

        update_dict = update_data.model_dump(exclude_unset=True)

        if "email" in update_dict and update_dict["email"] != existing_user["email"]:
            if self.repo.email_exists(update_dict["email"]):
                raise EmailAlreadyExistsError(update_dict["email"])

        if "password" in update_dict:
            update_dict["password_hash"] = self._hash_password(update_dict.pop("password"))

        if not update_dict:
            logger.info("No changes supplied; returning existing user")
            return UserResponse(**existing_user)

        updated_user = self.repo.update(user_id, update_dict)
        logger.info(f"User {user_id} updated successfully")
        return UserResponse(**updated_user if updated_user else existing_user)

    def delete_user(self, user_id: int) -> Dict[str, str]:
        """Delete user (soft delete)"""
        logger.info(f"Deleting user: {user_id}")

        if not self.repo.get_by_id(user_id):
            raise UserNotFoundError(user_id)

        self.repo.update(user_id, {"deleted_at": datetime.now()})

        logger.info(f"User {user_id} deleted successfully")
        return {"message": "User deleted successfully"}

    def authenticate_user(self, credentials: UserLogin) -> UserResponse:
        """Authenticate user"""
        logger.info(f"Authenticating user: {credentials.email}")

        user = self.repo.get_by_email(credentials.email)
        if not user:
            raise InvalidCredentialsError()

        if not self._verify_password(credentials.password, user["password_hash"]):
            raise InvalidCredentialsError()

        self.repo.update_last_login(user["user_id"])
        logger.info(f"User {user['user_id']} authenticated successfully")
        return UserResponse(**user)

    def get_user_stats(self, user_id: int) -> UserStats:
        """Get comprehensive user statistics"""
        logger.info(f"Getting stats for user: {user_id}")

        if not self.repo.get_by_id(user_id):
            raise UserNotFoundError(user_id)

        stats = self.repo.get_user_stats(user_id)
        return UserStats(**stats)

    def get_users(self, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        """Get paginated list of users"""
        query = (
            "SELECT * FROM users "
            "WHERE deleted_at IS NULL "
            "ORDER BY created_at DESC "
            "OFFSET %s LIMIT %s"
        )
        users = self.repo.db.fetch_all(query, (skip, limit))
        return [UserResponse(**u) for u in users]
