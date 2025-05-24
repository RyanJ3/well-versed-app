# backend/app/models/deck_models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, SmallInteger, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Deck(Base):
    __tablename__ = "decks"
    
    deck_id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # Privacy settings
    is_public = Column(Boolean, default=False)
    
    # Statistics
    save_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_decks")
    verses = relationship("DeckVerse", back_populates="deck", cascade="all, delete-orphan", order_by="DeckVerse.order_position")
    saved_by = relationship("SavedDeck", back_populates="deck", cascade="all, delete-orphan")
    tags = relationship("DeckTag", back_populates="deck", cascade="all, delete-orphan")


class DeckVerse(Base):
    __tablename__ = "deck_verses"
    
    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.deck_id", ondelete="CASCADE"), nullable=False)
    verse_id = Column(Integer, ForeignKey("bible_verses.verse_id"), nullable=False)
    order_position = Column(SmallInteger, nullable=False, default=0)
    
    # Relationships
    deck = relationship("Deck", back_populates="verses")
    verse = relationship("BibleVerse", back_populates="deck_verses")
    
    __table_args__ = (
        UniqueConstraint('deck_id', 'verse_id', name='uq_deck_verse'),
    )

class SavedDeck(Base):
    __tablename__ = "saved_decks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    deck_id = Column(Integer, ForeignKey("decks.deck_id", ondelete="CASCADE"), nullable=False)
    
    # When the user saved this deck
    saved_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="saved_decks")
    deck = relationship("Deck", back_populates="saved_by")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'deck_id', name='uq_user_saved_deck'),
    )


class DeckTag(Base):
    __tablename__ = "deck_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.deck_id", ondelete="CASCADE"), nullable=False)
    tag = Column(String(50), nullable=False, index=True)
    
    # Relationships
    deck = relationship("Deck", back_populates="tags")
    
    __table_args__ = (
        UniqueConstraint('deck_id', 'tag', name='uq_deck_tag'),
    )