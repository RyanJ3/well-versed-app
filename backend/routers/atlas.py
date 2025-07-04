# backend/routers/atlas.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from database import DatabaseConnection
import db_pool
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class Journey(BaseModel):
    id: int
    name: str
    start_year: int | None = None
    end_year: int | None = None
    scripture_refs: str | None = None

class JourneyResponse(BaseModel):
    journey: Journey
    cities: List[Dict[str, Any]]


def get_db():
    return DatabaseConnection(db_pool.db_pool)


@router.get('/journeys', response_model=List[Journey])
async def list_journeys(db: DatabaseConnection = Depends(get_db)):
    logger.info("Fetching list of journeys")
    rows = db.fetch_all(
        "SELECT journey_id AS id, name, start_year, end_year, scripture_refs "
        "FROM missionary_journeys ORDER BY journey_id"
    )
    logger.debug(f"Retrieved {len(rows)} journeys")
    return [Journey(**r) for r in rows]


@router.get('/journeys/{journey_id}', response_model=JourneyResponse)
async def get_journey(journey_id: int, db: DatabaseConnection = Depends(get_db)):
    logger.info(f"Fetching journey details for id={journey_id}")
    j = db.fetch_one(
        "SELECT journey_id AS id, name, start_year, end_year, scripture_refs "
        "FROM missionary_journeys WHERE journey_id = %s",
        (journey_id,)
    )
    if not j:
        raise HTTPException(status_code=404, detail="Journey not found")

    cities = db.fetch_all(
        "SELECT data FROM missionary_journey_cities "
        "WHERE journey_id = %s ORDER BY position",
        (journey_id,),
    )
    city_data = [c["data"] for c in cities]
    logger.debug(f"Journey {journey_id} has {len(city_data)} cities")
    return JourneyResponse(journey=Journey(**j), cities=city_data)
