#!/usr/bin/env python3
import psycopg2
from psycopg2.extras import execute_values
import json
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env
backend_env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(backend_env_path)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_db_connection():
    """Create a database connection"""
    return psycopg2.connect(
        host=os.getenv('DATABASE_HOST'),
        port=os.getenv('DATABASE_PORT'),
        database=os.getenv('DATABASE_NAME'),
        user=os.getenv('DATABASE_USER'),
        password=os.getenv('DATABASE_PASSWORD')
    )

def execute_sql_file(conn, filepath):
    """Execute a SQL file"""
    logging.info(f"Executing {filepath}...")
    with open(filepath, 'r') as f:
        sql = f.read()
    
    cur = conn.cursor()
    try:
        cur.execute(sql)
        conn.commit()
        logging.info(f"✓ {filepath} executed successfully")
    except Exception as e:
        conn.rollback()
        logging.error(f"✗ Error executing {filepath}: {e}")
        raise
    finally:
        cur.close()

def populate_bible_data(conn):
    """Populate Bible books and verses with numerical book IDs"""
    logging.info("Populating Bible data...")
    
    with open('bible_base_data.json', 'r') as f:
        bible_data = json.load(f)
    
    cur = conn.cursor()
    
    try:
        # Book ID mapping from the JSON
        book_id_map = {
            'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
            'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
            '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14,
            'Ezra': 15, 'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19,
            'Proverbs': 20, 'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23,
            'Jeremiah': 24, 'Lamentations': 25, 'Ezekiel': 26, 'Daniel': 27,
            'Hosea': 28, 'Joel': 29, 'Amos': 30, 'Obadiah': 31, 'Jonah': 32,
            'Micah': 33, 'Nahum': 34, 'Habakkuk': 35, 'Zephaniah': 36,
            'Haggai': 37, 'Zechariah': 38, 'Malachi': 39, 'Matthew': 40,
            'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44, 'Romans': 45,
            '1 Corinthians': 46, '2 Corinthians': 47, 'Galatians': 48,
            'Ephesians': 49, 'Philippians': 50, 'Colossians': 51,
            '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54,
            '2 Timothy': 55, 'Titus': 56, 'Philemon': 57, 'Hebrews': 58,
            'James': 59, '1 Peter': 60, '2 Peter': 61, '1 John': 62,
            '2 John': 63, '3 John': 64, 'Jude': 65, 'Revelation': 66,
            # Apocryphal books
            'Tobit': 67, 'Judith': 68, '1 Maccabees': 69, '2 Maccabees': 70,
            'Wisdom of Solomon': 71, 'Sirach': 72, 'Baruch': 73,
            '1 Esdras': 74, '3 Maccabees': 75, 'Prayer of Manasseh': 76
        }
        
        # 3-char book codes
        book_code_3_map = {
            'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
            'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
            '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
            '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
            'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO',
            'Ecclesiastes': 'ECC', 'Song of Solomon': 'SOS', 'Isaiah': 'ISA', 'Jeremiah': 'JER',
            'Lamentations': 'LAM', 'Ezekiel': 'EZE', 'Daniel': 'DAN', 'Hosea': 'HOS',
            'Joel': 'JOE', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
            'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP',
            'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL', 'Matthew': 'MAT',
            'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
            'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL',
            'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
            '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI',
            '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
            'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN',
            '2 John': '2JN', '3 John': '3JN', 'Jude': 'JDE', 'Revelation': 'REV',
            'Tobit': 'TOB', 'Judith': 'JDT', '1 Maccabees': '1MA', '2 Maccabees': '2MA',
            'Wisdom of Solomon': 'WIS', 'Sirach': 'SIR', 'Baruch': 'BAR',
            '1 Esdras': '1ES', '3 Maccabees': '3MA', 'Prayer of Manasseh': 'MAN'
        }
        
        # Insert books first
        books_to_insert = []
        verses_to_insert = []
        
        for book in bible_data['books']:
            book_name = book['name']
            
            # Skip books with canonicalAffiliation NONE
            if book.get('canonicalAffiliation') == 'NONE':
                continue
                
            book_id = book_id_map.get(book_name)
            if not book_id:
                logging.warning(f"No book ID found for {book_name}, skipping...")
                continue
                
            book_code_3 = book_code_3_map.get(book_name, book_name[:3].upper())
            testament = book['testament']
            book_group = book['bookGroup']
            canonical_affiliation = book.get('canonicalAffiliation', 'All')
            chapter_count = len(book['chapters'])
            
            books_to_insert.append((
                book_id, book_name, book_code_3, None,
                testament, book_group, canonical_affiliation, chapter_count
            ))
            
            # Create verses for this book
            for chapter_num, verse_count in enumerate(book['chapters'], 1):
                for verse_num in range(1, verse_count + 1):
                    verse_code = f"{book_id}-{chapter_num}-{verse_num}"
                    
                    # Check if this chapter/verse is apocryphal
                    is_apocryphal = False
                    if book_name == 'Psalms' and chapter_num == 151:
                        is_apocryphal = True
                    elif canonical_affiliation in ['Catholic', 'Eastern Orthodox']:
                        is_apocryphal = True
                    
                    verses_to_insert.append((
                        verse_code, book_id, chapter_num, verse_num, is_apocryphal
                    ))
        
        # Insert books
        execute_values(
            cur,
            """INSERT INTO bible_books (book_id, book_name, book_code_3, book_code_4, 
                                       testament, book_group, canonical_affiliation, chapter_count)
               VALUES %s ON CONFLICT (book_id) DO NOTHING""",
            books_to_insert,
            template="(%s, %s, %s, %s, %s, %s, %s, %s)"
        )
        
        logging.info(f"✓ Inserted {len(books_to_insert)} Bible books")
        
        # Insert verses
        execute_values(
            cur,
            """INSERT INTO bible_verses (verse_code, book_id, chapter_number, verse_number, is_apocryphal)
               VALUES %s ON CONFLICT (verse_code) DO NOTHING""",
            verses_to_insert,
            template="(%s, %s, %s, %s, %s)"
        )
        
        logging.info(f"✓ Inserted {len(verses_to_insert)} Bible verses")
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        logging.error(f"✗ Error populating Bible data: {e}")
        raise
    finally:
        cur.close()

def main():
    """Main setup function"""
    logging.info("Starting database setup...")
    
    # SQL files to execute in order
    sql_files = [
        '01-drop-schema.sql',
        '02-create-schema.sql',
        '05-create-decks.sql',
        '06-create-confidence-tracking.sql'
    ]
    
    conn = get_db_connection()
    
    try:
        # Execute SQL files
        for sql_file in sql_files:
            if os.path.exists(sql_file):
                execute_sql_file(conn, sql_file)
            else:
                logging.warning(f"File {sql_file} not found, skipping...")
        
        # Populate Bible data
        populate_bible_data(conn)
        
        logging.info("✓ Database setup completed successfully!")
        
    except Exception as e:
        logging.error(f"Database setup failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()