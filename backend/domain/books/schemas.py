from pydantic import BaseModel, ConfigDict
from typing import Optional

class Book(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    book_id: int
    book_name: str
    book_code_3: Optional[str] = None
    book_code_4: Optional[str] = None
    testament: str
    book_group: str
    canonical_affiliation: str
    chapter_count: int
