from pydantic import BaseModel
from typing import Optional

class Book(BaseModel):
    book_id: int
    book_name: str
    book_code_3: Optional[str] = None
    book_code_4: Optional[str] = None
    testament: str
    book_group: str
    canonical_affiliation: str
    chapter_count: int

    class Config:
        from_attributes = True
