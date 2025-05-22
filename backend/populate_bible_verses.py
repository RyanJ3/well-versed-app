#!/usr/bin/env python3
"""
Populate bible_verses table from bible_base_data.json
"""

import json
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
host = os.getenv('DATABASE_HOST', 'localhost')
port = os.getenv('DATABASE_PORT', '5432')
user = os.getenv('DATABASE_USER', 'postgres')
password = os.getenv('DATABASE_PASSWORD', 'postgres')
dbname = os.getenv('DATABASE_NAME', 'wellversed01DEV')

conn_str = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

# Load Bible data
with open('/app/../data/bible_base_data.json', 'r') as f:
    bible_data = json.load(f)

# Book ID mapping
def get_book_id(book_name):
    """Generate book ID from name"""
    special_cases = {
        'Psalms': 'PSA',
        'Genesis': 'GEN',
        'Exodus': 'EXO',
        'Leviticus': 'LEV',
        'Numbers': 'NUM',
        'Deuteronomy': 'DEU',
        'Joshua': 'JOS',
        'Judges': 'JDG',
        'Ruth': 'RUT',
        'Esther': 'EST',
        'Job': 'JOB',
        'Proverbs': 'PRO',
        'Ecclesiastes': 'ECC',
        'Song of Solomon': 'SOS',
        'Isaiah': 'ISA',
        'Jeremiah': 'JER',
        'Lamentations': 'LAM',
        'Ezekiel': 'EZK',
        'Daniel': 'DAN',
        'Hosea': 'HOS',
        'Joel': 'JOL',
        'Amos': 'AMO',
        'Obadiah': 'OBA',
        'Jonah': 'JON',
        'Micah': 'MIC',
        'Nahum': 'NAH',
        'Habakkuk': 'HAB',
        'Zephaniah': 'ZEP',
        'Haggai': 'HAG',
        'Zechariah': 'ZEC',
        'Malachi': 'MAL',
        'Matthew': 'MAT',
        'Mark': 'MRK',
        'Luke': 'LUK',
        'John': 'JHN',
        'Acts': 'ACT',
        'Romans': 'ROM',
        'Revelation': 'REV',
        'Philemon': 'PHM',
        'Hebrews': 'HEB',
        'James': 'JAS',
        'Jude': 'JDE',
        'Titus': 'TIT',
        'Wisdom of Solomon': 'WIS',
        'Sirach': 'SIR',
        'Baruch': 'BAR',
        'Tobit': 'TOB',
        'Judith': 'JDT',
        'Prayer of Manasseh': 'PAM',
    }
    
    if book_name in special_cases:
        return special_cases[book_name]
    
    # Handle numbered books
    if book_name[0].isdigit():
        parts = book_name.split(' ', 1)
        return parts[0] + parts[1][:2].upper()
    
    return book_name[:3].upper()

# Apocryphal books
apocryphal_books = {
    'SIR', 'TOB', 'JDT', 'WIS', '1MA', '2MA', '3MA', '4MA', 
    'BAR', 'PAM', '1ES', '2ES'
}

# Special apocryphal chapters/verses
apocryphal_content = {
    'PSA': [151],  # Psalm 151
    'EST': list(range(10, 17)),  # Esther 10-16
    'DAN': {
        3: list(range(24, 51)),  # Prayer of Azariah (3:24-50)
        13: 'all',  # Susanna
        14: 'all'   # Bel and the Dragon
    }
}

try:
    engine = create_engine(conn_str)
    with engine.connect() as conn:
        verse_count = 0
        
        for book in bible_data['books']:
            # Skip books with no canonical affiliation
            if book['canonicalAffiliation'] == 'NONE':
                continue
                
            book_name = book['name']
            book_id = get_book_id(book_name)
            
            # Check if entire book is apocryphal
            book_is_apocryphal = (
                book_id in apocryphal_books or 
                book['canonicalAffiliation'] in ['Catholic', 'Eastern Orthodox']
            )
            
            # Process each chapter
            for chapter_num, verse_count_in_chapter in enumerate(book['chapters'], 1):
                # Check if chapter is apocryphal
                chapter_is_apocryphal = book_is_apocryphal
                
                if book_id in apocryphal_content:
                    if isinstance(apocryphal_content[book_id], list):
                        chapter_is_apocryphal = chapter_num in apocryphal_content[book_id]
                    elif isinstance(apocryphal_content[book_id], dict):
                        chapter_is_apocryphal = chapter_num in apocryphal_content[book_id]
                
                # Process each verse
                for verse_num in range(1, verse_count_in_chapter + 1):
                    verse_is_apocryphal = chapter_is_apocryphal
                    
                    # Check specific verse ranges (e.g., Daniel 3:24-50)
                    if book_id == 'DAN' and chapter_num == 3:
                        verse_is_apocryphal = verse_num >= 24
                    
                    verse_id = f"{book_id}-{chapter_num}-{verse_num}"
                    
                    conn.execute(text("""
                        INSERT INTO bible_verses (verse_id, book_id, chapter_number, verse_number, is_apocryphal)
                        VALUES (:verse_id, :book_id, :chapter, :verse, :is_apoc)
                        ON CONFLICT (verse_id) DO UPDATE SET
                            is_apocryphal = EXCLUDED.is_apocryphal
                    """), {
                        'verse_id': verse_id,
                        'book_id': book_id,
                        'chapter': chapter_num,
                        'verse': verse_num,
                        'is_apoc': verse_is_apocryphal
                    })
                    
                    verse_count += 1
        
        conn.commit()
        
        # Show summary
        total = conn.execute(text("SELECT COUNT(*) FROM bible_verses")).scalar()
        apoc = conn.execute(text("SELECT COUNT(*) FROM bible_verses WHERE is_apocryphal = TRUE")).scalar()
        
        print(f"Populated {total} verses ({apoc} apocryphal)")
        
except Exception as e:
    print(f"Error: {str(e)}")