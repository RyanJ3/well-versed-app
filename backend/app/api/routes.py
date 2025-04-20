from fastapi import APIRouter
from app.schemas.bible_tracker import BibleTrackerCreate, BibleTrackerResponse
from app.services.bible_tracker_service import BibleTrackerService

router = APIRouter()
service = BibleTrackerService()

@router.post("/bible-trackers/", response_model=BibleTrackerResponse)
async def create_bible_tracker(bible_tracker: BibleTrackerCreate):
    return await service.create_bible_tracker(bible_tracker)

@router.get("/bible-trackers/{tracker_id}", response_model=BibleTrackerResponse)
async def read_bible_tracker(tracker_id: int):
    return await service.get_bible_tracker(tracker_id)

@router.get("/bible-trackers/")
async def read_bible_trackers(skip: int = 0, limit: int = 10):
    return await service.get_bible_trackers(skip=skip, limit=limit)