from fastapi import APIRouter
from app.api import users, verses

router = APIRouter()

router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(verses.router, prefix="/user-verses", tags=["verses"])