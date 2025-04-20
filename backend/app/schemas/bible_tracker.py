from pydantic import BaseModel
from typing import List, Optional

class BibleTrackerBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None

class BibleTrackerCreate(BibleTrackerBase):
    pass

class BibleTrackerUpdate(BibleTrackerBase):
    pass

class BibleTracker(BibleTrackerBase):
    id: int

    class Config:
        orm_mode = True

class BibleTrackerList(BaseModel):
    __root__: List[BibleTracker]