"""Base service class with common patterns"""

from typing import Any, Dict, List
import logging
from .exceptions import ValidationError

logger = logging.getLogger(__name__)


class BaseService:
    """Base service with common business logic patterns"""

    def __init__(self, repository) -> None:
        self.repo = repository

    def validate_required_fields(self, data: Dict, required_fields: List[str]) -> None:
        """Validate required fields are present and not empty"""
        missing = []
        for field in required_fields:
            if field not in data or not data[field]:
                missing.append(field)

        if missing:
            raise ValidationError(
                f"Missing required fields: {', '.join(missing)}",
                {"missing_fields": missing},
            )

    def validate_positive_integer(self, value: Any, field_name: str) -> None:
        """Validate value is a positive integer"""
        if not isinstance(value, int) or value <= 0:
            raise ValidationError(
                f"{field_name} must be a positive integer",
                {field_name: value},
            )
