from fastapi import Depends
from typing import Generator
from backend.database import DatabaseConnection
import backend.db_pool as db_pool
from backend.domain.decks.repository import DeckRepository
from backend.domain.decks.service import DeckService


def get_db() -> Generator[DatabaseConnection, None, None]:
    return DatabaseConnection(db_pool.db_pool)


def get_deck_repository(db: DatabaseConnection = Depends(get_db)) -> DeckRepository:
    return DeckRepository(db)


def get_deck_service(repo: DeckRepository = Depends(get_deck_repository)) -> DeckService:
    return DeckService(repo)
