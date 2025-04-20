from sqlalchemy.orm import Session
from app.models.bible_tracker import BibleTracker
from app.schemas.bible_tracker import BibleTrackerCreate, BibleTrackerUpdate

class BibleTrackerService:
    def __init__(self, db: Session):
        self.db = db

    def create_bible_tracker(self, bible_tracker: BibleTrackerCreate):
        db_bible_tracker = BibleTracker(**bible_tracker.dict())
        self.db.add(db_bible_tracker)
        self.db.commit()
        self.db.refresh(db_bible_tracker)
        return db_bible_tracker

    def get_bible_tracker(self, bible_tracker_id: int):
        return self.db.query(BibleTracker).filter(BibleTracker.id == bible_tracker_id).first()

    def update_bible_tracker(self, bible_tracker_id: int, bible_tracker: BibleTrackerUpdate):
        db_bible_tracker = self.get_bible_tracker(bible_tracker_id)
        if db_bible_tracker:
            for key, value in bible_tracker.dict(exclude_unset=True).items():
                setattr(db_bible_tracker, key, value)
            self.db.commit()
            self.db.refresh(db_bible_tracker)
        return db_bible_tracker

    def delete_bible_tracker(self, bible_tracker_id: int):
        db_bible_tracker = self.get_bible_tracker(bible_tracker_id)
        if db_bible_tracker:
            self.db.delete(db_bible_tracker)
            self.db.commit()
        return db_bible_tracker