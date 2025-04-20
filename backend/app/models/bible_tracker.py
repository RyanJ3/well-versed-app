from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class BibleTracker(Base):
    __tablename__ = 'bible_tracker'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String)
    description = Column(String)
    created_at = Column(String)  # You may want to use DateTime for actual timestamps
    updated_at = Column(String)  # Same as above

    def __repr__(self):
        return f"<BibleTracker(title={self.title}, author={self.author})>"