from fastapi import APIRouter, Depends
from typing import List

from domain.books import BookService, Book
from core.dependencies import get_book_service

router = APIRouter(prefix="/books", tags=["books"])

@router.get("/", response_model=List[Book])
def list_books(service: BookService = Depends(get_book_service)):
    return service.list_books()
