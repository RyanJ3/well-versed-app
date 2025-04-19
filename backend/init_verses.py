import json
import logging
from sqlalchemy.orm import Session
from app import engine, Verse, Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_bible_data(file_path="bible_data.json"):
    """Load Bible data from JSON file"""
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        return {"books": []}
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in file: {file_path}")
        return {"books": []}

def populate_verses():
    """Populate the verses table with data from Bible JSON"""
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    # Load Bible data
    bible_data = load_bible_data()
    
    # Start a database session
    with Session(engine) as db:
        # Check if verses table already has data
        if db.query(Verse).count() > 0:
            logger.info("Verses table already populated. Skipping.")
            return
        
        verse_count = 0
        
        # Process each book
        for book_idx, book in enumerate(bible_data.get("books", []), 1):
            testament_code = "01" if book["testament"] == "Old Testament" else "02"
            book_code = f"{book_idx:02d}"
            
            logger.info(f"Processing book: {book['name']}")
            
            # Process each chapter
            for chapter_idx, verse_count_in_chapter in enumerate(book["chapters"], 1):
                chapter_code = f"{chapter_idx:03d}"
                
                # Process each verse
                for verse_idx in range(1, verse_count_in_chapter + 1):
                    verse_code = f"{verse_idx:03d}"
                    verse_id = f"{testament_code}-{book_code}-{chapter_code}-{verse_code}"
                    
                    # Create verse record
                    verse = Verse(
                        verse_id=verse_id,
                        verse_number=verse_idx
                    )
                    
                    db.add(verse)
                    verse_count += 1
                    
                    # Commit in batches to avoid memory issues
                    if verse_count % 1000 == 0:
                        db.commit()
                        logger.info(f"Committed {verse_count} verses...")
            
            # Commit after each book
            db.commit()
        
        logger.info(f"Verse population complete. Added {verse_count} verses.")

if __name__ == "__main__":
    populate_verses()