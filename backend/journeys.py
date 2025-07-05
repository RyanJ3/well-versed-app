from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from db import get_db

router = APIRouter()

# Pydantic models
class Waypoint(BaseModel):
    waypoint_id: int
    position: int
    location_name: str
    modern_name: str | None
    latitude: float
    longitude: float
    description: str | None
    events: dict | None
    distance_from_start: int | None

    class Config:
        from_attributes = True

class Journey(BaseModel):
    journey_id: int
    name: str
    testament: str
    journey_type: str | None
    journey_order: int | None
    start_year: int | None
    end_year: int | None
    scripture_refs: str | None
    description: str | None
    color: str | None
    waypoints: List[Waypoint] = []

    class Config:
        from_attributes = True

@router.get("/journeys", response_model=List[Journey])
def get_all_journeys(db: Session = Depends(get_db)):
    """Get all biblical journeys with their waypoints"""
    try:
        # Query for journeys
        journeys = db.execute("""
            SELECT 
                j.journey_id,
                j.name,
                j.testament,
                j.journey_type,
                j.journey_order,
                j.start_year,
                j.end_year,
                j.scripture_refs,
                j.description,
                j.color
            FROM biblical_journeys j
            ORDER BY j.journey_order
        """).fetchall()
        
        # Convert to list of dicts
        journey_list = []
        for journey in journeys:
            journey_dict = {
                "journey_id": journey.journey_id,
                "name": journey.name,
                "testament": journey.testament,
                "journey_type": journey.journey_type,
                "journey_order": journey.journey_order,
                "start_year": journey.start_year,
                "end_year": journey.end_year,
                "scripture_refs": journey.scripture_refs,
                "description": journey.description,
                "color": journey.color,
                "waypoints": []
            }
            
            # Get waypoints for this journey
            waypoints = db.execute("""
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
                WHERE journey_id = :journey_id
                ORDER BY position
            """, {"journey_id": journey.journey_id}).fetchall()
            
            # Add waypoints to journey
            for wp in waypoints:
                waypoint_dict = {
                    "waypoint_id": wp.waypoint_id,
                    "position": wp.position,
                    "location_name": wp.location_name,
                    "modern_name": wp.modern_name,
                    "latitude": float(wp.latitude),
                    "longitude": float(wp.longitude),
                    "description": wp.description,
                    "events": wp.events,
                    "distance_from_start": wp.distance_from_start
                }
                journey_dict["waypoints"].append(waypoint_dict)
            
            journey_list.append(journey_dict)
        
        return journey_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/journeys/{journey_id}", response_model=Journey)
def get_journey(journey_id: int, db: Session = Depends(get_db)):
    """Get a specific journey with its waypoints"""
    try:
        # Query for the journey
        journey = db.execute("""
            SELECT 
                j.journey_id,
                j.name,
                j.testament,
                j.journey_type,
                j.journey_order,
                j.start_year,
                j.end_year,
                j.scripture_refs,
                j.description,
                j.color
            FROM biblical_journeys j
            WHERE j.journey_id = :journey_id
        """, {"journey_id": journey_id}).fetchone()
        
        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")
        
        # Convert to dict
        journey_dict = {
            "journey_id": journey.journey_id,
            "name": journey.name,
            "testament": journey.testament,
            "journey_type": journey.journey_type,
            "journey_order": journey.journey_order,
            "start_year": journey.start_year,
            "end_year": journey.end_year,
            "scripture_refs": journey.scripture_refs,
            "description": journey.description,
            "color": journey.color,
            "waypoints": []
        }
        
        # Get waypoints
        waypoints = db.execute("""
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
            WHERE journey_id = :journey_id
            ORDER BY position
        """, {"journey_id": journey_id}).fetchall()
        
        # Add waypoints
        for wp in waypoints:
            waypoint_dict = {
                "waypoint_id": wp.waypoint_id,
                "position": wp.position,
                "location_name": wp.location_name,
                "modern_name": wp.modern_name,
                "latitude": float(wp.latitude),
                "longitude": float(wp.longitude),
                "description": wp.description,
                "events": wp.events,
                "distance_from_start": wp.distance_from_start
            }
            journey_dict["waypoints"].append(waypoint_dict)
        
        return journey_dict
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
