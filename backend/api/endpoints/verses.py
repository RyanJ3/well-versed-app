from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from core.dependencies import get_verse_service
from domain.verses import schemas
from domain.verses.service import VerseService
from domain.verses.exceptions import VerseNotFoundError

router = APIRouter(tags=["verses"])


@router.get("/{user_id}", response_model=List[schemas.UserVerseResponse])
async def get_user_verses(
    user_id: int,
    include_apocrypha: bool = False,
    verse_service: VerseService = Depends(get_verse_service),
):
    return await verse_service.get_user_verses(user_id, include_apocrypha)


@router.put("/{user_id}/{book_id:int}/{chapter_num:int}/{verse_num:int}")
async def save_verse(
    user_id: int,
    book_id: int,
    chapter_num: int,
    verse_num: int,
    verse_update: schemas.VerseUpdate,
    verse_service: VerseService = Depends(get_verse_service),
):
    return await verse_service.save_or_update_verse(
        user_id, book_id, chapter_num, verse_num, verse_update
    )


@router.delete("/{user_id}/{book_id:int}/{chapter_num:int}/{verse_num:int}")
async def delete_verse(
    user_id: int,
    book_id: int,
    chapter_num: int,
    verse_num: int,
    verse_service: VerseService = Depends(get_verse_service),
):
    return await verse_service.delete_verse(user_id, book_id, chapter_num, verse_num)


@router.post("/{user_id}/chapters/{book_id:int}/{chapter_num}")
async def save_chapter(
    user_id: int,
    book_id: int,
    chapter_num: int,
    verse_service: VerseService = Depends(get_verse_service),
):
    return await verse_service.save_chapter(user_id, book_id, chapter_num)


@router.delete("/{user_id}/chapters/{book_id:int}/{chapter_num}")
async def clear_chapter(
    user_id: int,
    book_id: int,
    chapter_num: int,
    verse_service: VerseService = Depends(get_verse_service),
):
    return await verse_service.clear_chapter(user_id, book_id, chapter_num)


@router.post("/{user_id}/books/{book_id:int}")
async def save_book(
    user_id: int,
    book_id: int,
    verse_service: VerseService = Depends(get_verse_service),
):
    return await verse_service.save_book(user_id, book_id)


@router.delete("/{user_id}/books/{book_id:int}")
async def clear_book(
    user_id: int,
    book_id: int,
    verse_service: VerseService = Depends(get_verse_service),
):
    return await verse_service.clear_book(user_id, book_id)


@router.delete("/{user_id}")
async def clear_user_memorization(
    user_id: int,
    verse_service: VerseService = Depends(get_verse_service),
):
    return await verse_service.clear_all_memorization(user_id)
