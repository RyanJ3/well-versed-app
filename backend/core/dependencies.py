from fastapi import Depends
from database import DatabaseConnection
import db_pool
from domain.users import UserRepository, UserService
from domain.decks.repository import DeckRepository
from domain.decks.service import DeckService
from domain.verses.repository import VerseRepository
from domain.verses.service import VerseService
from domain.books import BookRepository, BookService
from domain.feature_requests import FeatureRequestService, FeatureRequestRepository


def get_db() -> DatabaseConnection:
    """Get database connection"""
    return DatabaseConnection(db_pool.db_pool)


def get_user_repository(db: DatabaseConnection = Depends(get_db)) -> UserRepository:
    """Get user repository"""
    return UserRepository(db)


def get_user_service(repo: UserRepository = Depends(get_user_repository)) -> UserService:
    """Get user service"""
    return UserService(repo)


def get_deck_repository(db: DatabaseConnection = Depends(get_db)) -> DeckRepository:
    return DeckRepository(db)


def get_deck_service(repo: DeckRepository = Depends(get_deck_repository)) -> DeckService:
    return DeckService(repo)


def get_verse_repository(db: DatabaseConnection = Depends(get_db)) -> VerseRepository:
    return VerseRepository(db)


def get_verse_service(repo: VerseRepository = Depends(get_verse_repository)) -> VerseService:
    return VerseService(repo)


def get_book_repository(db: DatabaseConnection = Depends(get_db)) -> BookRepository:
    """Get book repository"""
    return BookRepository(db)


def get_book_service(repo: BookRepository = Depends(get_book_repository)) -> BookService:
    """Get book service"""
    return BookService(repo)


def get_feature_request_repository(db: DatabaseConnection = Depends(get_db)) -> FeatureRequestRepository:
    return FeatureRequestRepository(db)


def get_feature_request_service(
    repository: FeatureRequestRepository = Depends(get_feature_request_repository),
) -> FeatureRequestService:
    return FeatureRequestService(repository)
