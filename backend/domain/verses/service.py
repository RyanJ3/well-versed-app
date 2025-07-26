from typing import List, Dict
from datetime import datetime
import logging
from domain.core import BaseService
from domain.core.exceptions import ValidationError
from .repository import VerseRepository
from .schemas import (
    VerseUpdate,
    UserVerseResponse,
    VerseDetail,
    ConfidenceUpdate,
    ChapterSaveRequest,
    BookSaveRequest,
    VerseTextsRequest,
    VerseTextResponse,
)
from .exceptions import VerseNotFoundError, InvalidVerseCodeError

logger = logging.getLogger(__name__)


class VerseService(BaseService):
    """Service layer for verse operations"""

    def __init__(self, repository: VerseRepository):
        super().__init__(repository)
        self.repo: VerseRepository = repository

    def _validate_verse_code(self, book_id: int, chapter: int, verse: int) -> str:
        """Validate and format verse code"""
        if book_id < 1 or book_id > 73:
            raise InvalidVerseCodeError(f"Invalid book ID: {book_id}")
        if chapter < 1:
            raise InvalidVerseCodeError(f"Invalid chapter: {chapter}")
        if verse < 1:
            raise InvalidVerseCodeError(f"Invalid verse: {verse}")
        return f"{book_id}-{chapter}-{verse}"

    def get_user_verses(self, user_id: int, include_apocrypha: bool = False) -> List[UserVerseResponse]:
        """Get all verses for a user"""
        logger.info(f"Getting verses for user {user_id}, include_apocrypha={include_apocrypha}")
        verses = self.repo.get_user_verses(user_id, include_apocrypha)
        result: List[UserVerseResponse] = []
        for v in verses:
            result.append(
                UserVerseResponse(
                    verse=VerseDetail(
                        verse_id=v["verse_code"],
                        book_id=v["book_id"],
                        book_name=v["book_name"],
                        chapter_number=v["chapter_number"],
                        verse_number=v["verse_number"],
                        is_apocryphal=v.get("is_apocryphal", False),
                    ),
                    practice_count=v["practice_count"],
                    confidence_score=v.get("confidence_score"),
                    last_practiced=v["last_practiced"].isoformat() if v["last_practiced"] else None,
                    last_reviewed=v["last_reviewed"].isoformat() if v.get("last_reviewed") else None,
                    created_at=v["created_at"].isoformat(),
                    updated_at=v["updated_at"].isoformat() if v["updated_at"] else None,
                )
            )
        logger.info(f"Found {len(result)} verses for user {user_id}")
        return result

    def save_or_update_verse(self, user_id: int, book_id: int, chapter_num: int,
                             verse_num: int, update: VerseUpdate) -> Dict[str, str]:
        """Save or update a single verse"""
        verse_code = self._validate_verse_code(book_id, chapter_num, verse_num)
        logger.info(f"Saving verse {verse_code} for user {user_id}")

        # If practice count is 0, delete the verse
        if update.practice_count == 0:
            return self.delete_verse(user_id, book_id, chapter_num, verse_num)

        verse = self.repo.get_verse_by_code(verse_code)
        if not verse:
            raise VerseNotFoundError(verse_code)

        self.repo.save_verse(
            user_id=user_id,
            verse_id=verse["id"],
            practice_count=update.practice_count,
            last_practiced=update.last_practiced or datetime.now(),
        )
        logger.info(f"Verse {verse_code} saved for user {user_id}")
        return {"message": "Verse saved successfully"}

    def update_confidence(self, user_id: int, book_id: int, chapter_num: int,
                          verse_num: int, update: ConfidenceUpdate) -> Dict[str, str]:
        """Update confidence score for a verse"""
        verse_code = self._validate_verse_code(book_id, chapter_num, verse_num)
        logger.info(f"Updating confidence for verse {verse_code}, user {user_id}")
        if not 0 <= update.confidence_score <= 100:
            raise ValidationError("Confidence score must be between 0 and 100")
        verse = self.repo.get_verse_by_code(verse_code)
        if not verse:
            raise VerseNotFoundError(verse_code)
        self.repo.update_confidence(user_id, verse["id"], update.confidence_score)
        logger.info(f"Confidence updated for verse {verse_code}")
        return {"message": "Confidence updated successfully"}

    def delete_verse(self, user_id: int, book_id: int, chapter_num: int,
                     verse_num: int) -> Dict[str, str]:
        """Delete a verse from user's memorization"""
        verse_code = self._validate_verse_code(book_id, chapter_num, verse_num)
        logger.info(f"Deleting verse {verse_code} for user {user_id}")
        verse = self.repo.get_verse_by_code(verse_code)
        if verse:
            self.repo.delete_verse(user_id, verse["id"])
            logger.info(f"Verse {verse_code} deleted for user {user_id}")
        return {"message": "Verse deleted successfully"}

    def save_chapter(self, user_id: int, request: ChapterSaveRequest) -> Dict[str, any]:
        """Save all verses in a chapter"""
        logger.info(f"Saving chapter {request.book_id}:{request.chapter} for user {user_id}")
        result = self.repo.save_chapter(user_id, request.book_id, request.chapter)
        logger.info(f"Chapter saved: {result['verses_count']} verses")
        return result

    def clear_chapter(self, user_id: int, book_id: int, chapter_num: int) -> Dict[str, str]:
        """Clear all verses in a chapter"""
        logger.info(f"Clearing chapter {book_id}:{chapter_num} for user {user_id}")
        return self.repo.clear_chapter(user_id, book_id, chapter_num)

    def save_book(self, user_id: int, request: BookSaveRequest) -> Dict[str, any]:
        """Save all verses in a book"""
        logger.info(f"Saving book {request.book_id} for user {user_id}")
        result = self.repo.save_book(user_id, request.book_id)
        logger.info(f"Book saved: {result['verses_count']} verses")
        return result

    def clear_book(self, user_id: int, book_id: int) -> Dict[str, str]:
        """Clear all verses in a book"""
        logger.info(f"Clearing book {book_id} for user {user_id}")
        return self.repo.clear_book(user_id, book_id)

    def clear_all_memorization(self, user_id: int) -> Dict[str, str]:
        """Clear all memorization data for user"""
        logger.info(f"Clearing all memorization data for user {user_id}")
        return self.repo.clear_all_verses(user_id)

    def get_verse_texts(self, user_id: int, request: VerseTextsRequest) -> Dict[str, str]:
        """Get verse texts from external API - delegates to routers for now"""
        logger.info(f"Getting texts for {len(request.verse_codes)} verses")
        # This method would integrate with your Bible API service
        # For now, return empty to avoid breaking changes
        # The actual implementation is in routers/user_verses.py
        return {code: "" for code in request.verse_codes}
