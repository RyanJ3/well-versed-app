# backend/populate_all_verses.py
import json
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from app.utils import get_apocryphal_book_ids

# Load environment variables
load_dotenv()

# Database connection
conn_str = f"postgresql://{os.getenv('DATABASE_USER')}:{os.getenv('DATABASE_PASSWORD')}@{os.getenv('DATABASE_HOST')}:{os.getenv('DATABASE_PORT')}/{os.getenv('DATABASE_NAME')}"

# Load Bible data
with open('../data/bible_base_data.json', 'r') as f:
    bible_data = json.load(f)

# Book ID mapping (same as before)
def get_book_id(book_name):
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
        '1 Samuel': '1SA',
        '2 Samuel': '2SA',
        '1 Kings': '1KI',
        '2 Kings': '2KI',
        '1 Chronicles': '1CH',
        '2 Chronicles': '2CH',
        '1 Corinthians': '1CO',
        '2 Corinthians': '2CO',
        '1 Thessalonians': '1TH',
        '2 Thessalonians': '2TH',
        '1 Timothy': '1TI',
        '2 Timothy': '2TI',
        '1 Peter': '1PE',
        '2 Peter': '2PE',
        '1 John': '1JN',
        '2 John': '2JN',
        '3 John': '3JN',
        'Wisdom of Solomon': 'WIS',
        'Sirach': 'SIR',
        'Baruch': 'BAR',
        'Tobit': 'TOB',
        'Judith': 'JDT',
        'Prayer of Manasseh': 'PAM',
        '1 Esdras': '1ES',
        '2 Esdras': '2ES',
        '1 Maccabees': '1MA',
        '2 Maccabees': '2MA',
        '3 Maccabees': '3MA',
        '4 Maccabees': '4MA'
    }
    
    if book_name in special_cases:
        return special_cases[book_name]
    
    if book_name[0].isdigit():
        parts = book_name.split(' ', 1)
        return f"{parts[0]}{parts[1][:2].upper()}"
    
    return book_name[:3].upper()

try:
    engine = create_engine(conn_str)
    with engine.connect() as conn:
        verse_count = 0
        apocryphal_books = get_apocryphal_book_ids()
        
        for book in bible_data['books']:
            if book['canonicalAffiliation'] == 'NONE':
                continue
                
            book_name = book['name']
            book_id = get_book_id(book_name)
            book_is_apocryphal = book_id in apocryphal_books
            
            # Process each chapter
            for chapter_num, verse_count_in_chapter in enumerate(book['chapters'], 1):
                # Check if chapter is apocryphal
                is_chapter_apocryphal = book_is_apocryphal
                
                # Special cases for partially apocryphal books
                if book_id == 'PSA' and chapter_num == 151:
                    is_chapter_apocryphal = True
                elif book_id == 'DAN' and chapter_num in [13, 14]:
                    is_chapter_apocryphal = True
                elif book_id == 'EST' and chapter_num > 10:
                    is_chapter_apocryphal = True
                
                # Insert all verses for this chapter
                for verse_num in range(1, verse_count_in_chapter + 1):
                    verse_id = f"{book_id}-{chapter_num}-{verse_num}"
                    
                    # Special handling for Daniel 3:24-90 (additions)
                    verse_is_apocryphal = is_chapter_apocryphal
                    if book_id == 'DAN' and chapter_num == 3 and verse_num >= 24:
                        verse_is_apocryphal = True
                    
                    conn.execute(text("""
                        INSERT INTO verses (verse_id, verse_number, is_apocryphal)
                        VALUES (:verse_id, :verse_num, :is_apoc)
                        ON CONFLICT (verse_id) DO UPDATE SET
                            is_apocryphal = EXCLUDED.is_apocryphal
                    """), {
                        'verse_id': verse_id,
                        'verse_num': verse_num,
                        'is_apoc': verse_is_apocryphal
                    })
                    verse_count += 1
        
        conn.commit()
        
        # Show summary
        total = conn.execute(text("SELECT COUNT(*) FROM verses")).scalar()
        apoc = conn.execute(text("SELECT COUNT(*) FROM verses WHERE is_apocryphal = TRUE")).scalar()
        
        print(f"Populated {total} verses ({apoc} apocryphal)")
        
except Exception as e:
    print(f"Error: {str(e)}")