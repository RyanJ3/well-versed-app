# filename: app/models.py
# SQLAlchemy ORM models for database tables

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=True)
    last_login = Column(DateTime, nullable=True)
    active = Column(Boolean, default=True, nullable=True)

    settings = relationship("UserSettings", back_populates="user", uselist=False)
    verses = relationship("UserVerse", back_populates="user")

class UserSettings(Base):
    __tablename__ = "user_settings"

    setting_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    denomination = Column(String(50), nullable=True)
    include_apocrypha = Column(Boolean, default=False, nullable=True)

    user = relationship("User", back_populates="settings")

class Verse(Base):
    __tablename__ = "verses"

    verse_id = Column(String(12), primary_key=True, index=True)
    verse_number = Column(Integer, nullable=False)

    users = relationship("UserVerse", back_populates="verse")

class UserVerse(Base):
    __tablename__ = "user_verses"

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    verse_id = Column(String(12), ForeignKey("verses.verse_id", ondelete="CASCADE"), primary_key=True)
    confidence = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="verses")
    verse = relationship("Verse", back_populates="users")

    __table_args__ = (
        CheckConstraint('confidence >= 1 AND confidence <= 1000', name='check_confidence_range'),
    )