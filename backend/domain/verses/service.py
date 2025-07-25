from typing import List, Optional, Dict
from datetime import datetime
import logging
from fastapi import HTTPException
from . import schemas, repository
from .exceptions import VerseNotFoundError

logger = logging.getLogger(__name__)


class VerseService:
    """Business logic for verse operations"""

    def __init__(self, repo: repository.VerseRepository):
        self.repo = repo

    async def get_user_verses(
        self,
        user_id: int,
        include_apocrypha: bool = False,
    ) -> List[schemas.UserVerseResponse]:
        logger.info(f"Getting verses for user {user_id}, include_apocrypha={include_apocrypha}")

        verses = await self.repo.get_user_verses(user_id, include_apocrypha)

        result = []
        for v in verses:
            result.append(
                schemas.UserVerseResponse(
                    verse=schemas.VerseDetail(
                        verse_id=v["verse_id"],
                        book_id=v["book_id"],
                        chapter_number=v["chapter_number"],
                        verse_number=v["verse_number"],
                        is_apocryphal=v.get("is_apocryphal", False),
                    ),
                    practice_count=v["practice_count"],
                    last_practiced=v["last_practiced"],
                    created_at=v["created_at"],
                    updated_at=v["updated_at"],
                )
            )

        logger.info(f"Found {len(result)} verses for user {user_id}")
        return result

    async def save_or_update_verse(
        self,
        user_id: int,
        book_id: int,
        chapter_num: int,
        verse_num: int,
        update: schemas.VerseUpdate,
    ) -> Dict[str, str]:
        verse_code = f"{book_id}-{chapter_num}-{verse_num}"
        logger.info(f"Saving verse {verse_code} for user {user_id}")

        if update.practice_count == 0:
            return await self.delete_verse(user_id, book_id, chapter_num, verse_num)

        verse = await self.repo.get_verse_by_code(verse_code)
        if not verse:
            raise VerseNotFoundError(verse_code)

        await self.repo.upsert_user_verse(
            user_id=user_id,
            verse_id=verse["id"],
            practice_count=update.practice_count,
            last_practiced=update.last_practiced or datetime.now(),
        )

        logger.info(f"Verse {verse_code} saved for user {user_id}")
        return {"message": "Verse saved successfully"}

    async def delete_verse(
        self,
        user_id: int,
        book_id: int,
        chapter_num: int,
        verse_num: int,
    ) -> Dict[str, str]:
        verse_code = f"{book_id}-{chapter_num}-{verse_num}"
        logger.info(f"Deleting verse {verse_code} for user {user_id}")

        verse = await self.repo.get_verse_by_code(verse_code)
        if verse:
            await self.repo.delete_user_verse(user_id, verse["id"])
            logger.info(f"Verse {verse_code} deleted for user {user_id}")

        return {"message": "Verse deleted successfully"}

    async def save_chapter(self, user_id: int, book_id: int, chapter_num: int) -> Dict[str, any]:
        logger.info(f"Saving chapter {book_id} {chapter_num} for user {user_id}")

        verses = await self.repo.get_verses_in_chapter(book_id, chapter_num)
        if not verses:
            raise HTTPException(status_code=404, detail="Chapter not found")

        verse_data = [(v["id"], 1, datetime.now()) for v in verses]

        await self.repo.bulk_upsert_verses(user_id, verse_data)

        logger.info(f"Saved {len(verses)} verses for chapter {book_id} {chapter_num}")
        return {"message": "Chapter saved successfully", "verses_count": len(verses)}

    async def clear_chapter(self, user_id: int, book_id: int, chapter_num: int) -> Dict[str, str]:
        logger.info(f"Clearing chapter {book_id} {chapter_num} for user {user_id}")

        await self.repo.delete_verses_by_chapter(user_id, book_id, chapter_num)

        logger.info(f"Cleared chapter {book_id} {chapter_num} for user {user_id}")
        return {"message": "Chapter cleared successfully"}

    async def save_book(self, user_id: int, book_id: int) -> Dict[str, any]:
        logger.info(f"Saving book {book_id} for user {user_id}")

        verses = await self.repo.get_verses_in_book(book_id)
        if not verses:
            raise HTTPException(status_code=404, detail="Book not found")

        verse_data = [(v["id"], 1, datetime.now()) for v in verses]

        await self.repo.bulk_upsert_verses(user_id, verse_data)

        logger.info(f"Saved {len(verses)} verses for book {book_id}")
        return {"message": "Book saved successfully", "verses_count": len(verses)}

    async def clear_book(self, user_id: int, book_id: int) -> Dict[str, str]:
        logger.info(f"Clearing book {book_id} for user {user_id}")

        await self.repo.delete_verses_by_book(user_id, book_id)

        logger.info(f"Cleared book {book_id} for user {user_id}")
        return {"message": "Book cleared successfully"}

    async def clear_all_memorization(self, user_id: int) -> Dict[str, str]:
        logger.info(f"Clearing memorization data for user {user_id}")

        await self.repo.clear_all_user_verses(user_id)

        logger.info(f"Memorization data cleared for user {user_id}")
        return {"message": "Memorization data cleared"}
