from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter()

@router.get("/data")
async def get_data():
    """Fetch data from PostgreSQL database"""
    # Simplified for testing
    return {"message": "API working", "data": [{"id": 1, "name": "Test Item"}]}

@router.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy"}