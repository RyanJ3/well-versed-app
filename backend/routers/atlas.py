# backend/routers/atlas.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from database import DatabaseConnection
import db_pool
import json

router = APIRouter()

class Journey(BaseModel):
    id: int
    name: str
    testament: str
    journey_type: Optional[str] = None
    journey_order: Optional[int] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    scripture_refs: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class Waypoint(BaseModel):
    waypoint_id: int
    position: int
    location_name: str
    modern_name: Optional[str] = None
    latitude: float
    longitude: float
    description: Optional[str] = None
    events: Optional[Dict[str, Any]] = None
    distance_from_start: Optional[int] = None

class JourneyResponse(BaseModel):
    journey: Journey
    waypoints: List[Waypoint]


def get_db():
    return DatabaseConnection(db_pool.db_pool)


@router.get('/journeys', response_model=List[Journey])
async def list_journeys(db: DatabaseConnection = Depends(get_db)):
    """Get all biblical journeys"""
    rows = db.fetch_all(
        """
        SELECT 
            journey_id AS id,
            name,
            testament,
            journey_type,
            journey_order,
            start_year,
            end_year,
            scripture_refs,
            description,
            color
        FROM biblical_journeys 
        ORDER BY journey_order, journey_id
        """
    )
    return [Journey(**r) for r in rows]


@router.get('/journeys/{journey_id}', response_model=JourneyResponse)
async def get_journey(journey_id: int, db: DatabaseConnection = Depends(get_db)):
    """Get a specific journey with all its waypoints"""
    
    # Get journey details
    journey_data = db.fetch_one(
        """
        SELECT 
            journey_id AS id,
            name,
            testament,
            journey_type,
            journey_order,
            start_year,
            end_year,
            scripture_refs,
            description,
            color
        FROM biblical_journeys 
        WHERE journey_id = %s
        """,
        (journey_id,)
    )
    
    if not journey_data:
        raise HTTPException(status_code=404, detail="Journey not found")
    
    # Get waypoints
    waypoints_data = db.fetch_all(
        """
        SELECT 
            waypoint_id,
            position,
            location_name,
            modern_name,
            latitude,
            longitude,
            description,
            events,
            distance_from_start
        FROM journey_waypoints
        WHERE journey_id = %s 
        ORDER BY position
        """,
        (journey_id,)
    )
    
    # Convert waypoints
    waypoints = []
    for wp in waypoints_data:
        waypoint = Waypoint(
            waypoint_id=wp["waypoint_id"],
            position=wp["position"],
            location_name=wp["location_name"],
            modern_name=wp["modern_name"],
            latitude=float(wp["latitude"]),
            longitude=float(wp["longitude"]),
            description=wp["description"],
            events=wp["events"] if wp["events"] else None,
            distance_from_start=wp["distance_from_start"]
        )
        waypoints.append(waypoint)
    
    return JourneyResponse(
        journey=Journey(**journey_data),
        waypoints=waypoints
    )
