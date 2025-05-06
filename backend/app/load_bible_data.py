# backend/app/scripts/load_bible_data.py
import json
import os
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models import Base, BibleBook, BibleVerse

def load_bible_data():
    """Load Bible data from JSON file into database"""
    # Path to JSON file - adjust as needed
    json_path = os.path.join(os.path.dirname(__file__), '../../bible_data/bible_base_data.json')
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Load JSON data
        with open(json_path, 'r', encoding='utf-8') as f:
            bible_data = json.load(f)
        
        print(f"Loaded Bible data with {len(bible_data['books'])} books")
        
        # Clear existing data
        db.query(BibleVerse).delete()
        db.query(BibleBook).delete()
        
        # Process book data
        for book_data in bible_data['books']:
            # Skip non-canonical books
            if book_data['canonicalAffiliation'] == 'NONE':
                continue
                
            # Create book record
            book = BibleBook(
                book_id=book_data['name'][:3].upper(),
                name=book_data['name'],
                testament=book_data['testament'],
                book_group=book_data['bookGroup']
            )
            db.add(book)
            db.flush()  # Flush to get the book_id
            
            # Create verses for each chapter
            for chapter_num, verse_count in enumerate(book_data['chapters'], 1):
                for verse_num in range(1, verse_count + 1):
                    verse_id = f"{book.book_id}-{chapter_num}-{verse_num}"
                    verse = BibleVerse(
                        verse_id=verse_id,
                        book_id=book.book_id,
                        chapter_number=chapter_num,
                        verse_number=verse_num
                    )
                    db.add(verse)
        
        # Commit all changes
        db.commit()
        print("Bible data loaded successfully")
        
    except Exception as e:
        db.rollback()
        print(f"Error loading Bible data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    load_bible_data()