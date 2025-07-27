"""Verses API routes - unified from all implementations"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict
from pydantic import BaseModel
from domain.verses import (
    VerseService,
    UserVerseResponse,
    VerseUpdate,
    ConfidenceUpdate,
    ChapterSaveRequest,
    BookSaveRequest,
    VerseTextsRequest,
    VerseTextResponse,
    VerseNotFoundError,
    InvalidVerseCodeError,
)
from domain.core.exceptions import ValidationError
from core.dependencies import get_verse_service, get_db
from database import DatabaseConnection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/verses", tags=["verses"])


def get_current_user_id() -> int:
    """Placeholder for auth"""
    return 1


class VerseTextsRequestBody(BaseModel):
    verse_codes: List[str]
    bible_id: Optional[str] = None


@router.get("", response_model=List[UserVerseResponse])
def get_user_verses(
    include_apocrypha: bool = False,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Get all verses for current user"""
    return service.get_user_verses(user_id, include_apocrypha)


@router.put("/{book_id}/{chapter}/{verse}", response_model=dict)
def save_or_update_verse(
    book_id: int,
    chapter: int,
    verse: int,
    update: VerseUpdate,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Save or update a single verse"""
    try:
        return service.save_or_update_verse(user_id, book_id, chapter, verse, update)
    except VerseNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidVerseCodeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{book_id}/{chapter}/{verse}/confidence", response_model=dict)
def update_verse_confidence(
    book_id: int,
    chapter: int,
    verse: int,
    update: ConfidenceUpdate,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Update confidence score for a verse"""
    try:
        return service.update_confidence(user_id, book_id, chapter, verse, update)
    except VerseNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.delete("/{book_id}/{chapter}/{verse}", response_model=dict)
def delete_verse(
    book_id: int,
    chapter: int,
    verse: int,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Delete a verse from memorization"""
    try:
        return service.delete_verse(user_id, book_id, chapter, verse)
    except InvalidVerseCodeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/chapters", response_model=dict)
def save_chapter(
    request: ChapterSaveRequest,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Save all verses in a chapter"""
    try:
        return service.save_chapter(user_id, request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/chapters/{book_id}/{chapter}", response_model=dict)
def clear_chapter(
    book_id: int,
    chapter: int,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Clear all verses in a chapter"""
    return service.clear_chapter(user_id, book_id, chapter)


@router.post("/books", response_model=dict)
def save_book(
    request: BookSaveRequest,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Save all verses in a book"""
    try:
        return service.save_book(user_id, request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/books/{book_id}", response_model=dict)
def clear_book(
    book_id: int,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Clear all verses in a book"""
    return service.clear_book(user_id, book_id)


@router.delete("/all", response_model=dict)
def clear_all_memorization(
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
):
    """Clear all memorization data for user"""
    return service.clear_all_memorization(user_id)


@router.post("/texts", response_model=Dict[str, str])
async def get_verse_texts(
    request: VerseTextsRequestBody,
    user_id: int = Depends(get_current_user_id),
    service: VerseService = Depends(get_verse_service),
    db: DatabaseConnection = Depends(get_db),
):
    """Get verse texts from Bible API"""
    from services.api_bible import APIBibleService
    from services.esv_api import ESVService, ESVRateLimitError
    from config import Config

    verse_codes = request.verse_codes
    bible_id = request.bible_id or Config.DEFAULT_BIBLE_ID

    logger.info(f"Getting texts for {len(verse_codes)} verses for user {user_id}")

    try:
        user_pref = db.fetch_one(
            "SELECT use_esv_api, esv_api_token FROM users WHERE user_id = %s",
            (user_id,),
        )
        use_esv = user_pref.get("use_esv_api", False) if user_pref else False
        esv_token = user_pref.get("esv_api_token") if user_pref else None

        if use_esv and esv_token:
            logger.info("Using ESV API for verse texts")
            refs_query = """
                SELECT bv.verse_code, bb.book_name, bv.chapter_number, bv.verse_number
                FROM bible_verses bv
                JOIN bible_books bb ON bv.book_id = bb.book_id
                WHERE bv.verse_code = ANY(%s)
            """
            refs = db.fetch_all(refs_query, (verse_codes,))
            ref_map = {
                r["verse_code"]: f"{r['book_name']} {r['chapter_number']}:{r['verse_number']}"
                for r in refs
            }

            esv = ESVService(esv_token)
            verse_texts = esv.get_verses_batch(ref_map)
        else:
            logger.info("Using API.Bible for verse texts")
            api_bible = APIBibleService(Config.API_BIBLE_KEY, bible_id)
            verse_texts = api_bible.get_verses_batch(verse_codes, bible_id)

        logger.info(f"Successfully retrieved {len(verse_texts)} verse texts")
        return {code: verse_texts.get(code, "") for code in verse_codes}

    except ESVRateLimitError as e:
        logger.warning(f"ESV API rate limited for {e.wait_seconds} seconds")
        raise HTTPException(status_code=429, detail={"wait_seconds": e.wait_seconds})
    except Exception as e:
        logger.error(f"Error getting verse texts: {e}")
        return {code: "" for code in verse_codes}
