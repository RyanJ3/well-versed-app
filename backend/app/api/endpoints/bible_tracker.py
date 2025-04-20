from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from ..models.bible_tracker import BibleTracker
from ..schemas.bible_tracker import BibleTrackerCreate, BibleTrackerUpdate
from ..database import get_db

router = APIRouter()

@router.post("/bible-trackers/", response_model=BibleTracker)
def create_bible_tracker(bible_tracker: BibleTrackerCreate, db: Session = next(get_db())):
    db_bible_tracker = BibleTracker(**bible_tracker.dict())
    db.add(db_bible_tracker)
    db.commit()
    db.refresh(db_bible_tracker)
    return db_bible_tracker

@router.get("/bible-trackers/{bible_tracker_id}", response_model=BibleTracker)
def read_bible_tracker(bible_tracker_id: int, db: Session = next(get_db())):
    db_bible_tracker = db.query(BibleTracker).filter(BibleTracker.id == bible_tracker_id).first()
    if db_bible_tracker is None:
        raise HTTPException(status_code=404, detail="Bible Tracker not found")
    return db_bible_tracker

@router.put("/bible-trackers/{bible_tracker_id}", response_model=BibleTracker)
def update_bible_tracker(bible_tracker_id: int, bible_tracker: BibleTrackerUpdate, db: Session = next(get_db())):
    db_bible_tracker = db.query(BibleTracker).filter(BibleTracker.id == bible_tracker_id).first()
    if db_bible_tracker is None:
        raise HTTPException(status_code=404, detail="Bible Tracker not found")
    for key, value in bible_tracker.dict(exclude_unset=True).items():
        setattr(db_bible_tracker, key, value)
    db.commit()
    db.refresh(db_bible_tracker)
    return db_bible_tracker

@router.delete("/bible-trackers/{bible_tracker_id}", response_model=dict)
def delete_bible_tracker(bible_tracker_id: int, db: Session = next(get_db())):
    db_bible_tracker = db.query(BibleTracker).filter(BibleTracker.id == bible_tracker_id).first()
    if db_bible_tracker is None:
        raise HTTPException(status_code=404, detail="Bible Tracker not found")
    db.delete(db_bible_tracker)
    db.commit()
    return {"detail": "Bible Tracker deleted"}