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

def execute_sql_with_bible_data(conn, filepath):
    """Execute SQL file with Bible data if needed"""
    logging.info(f"Executing {filepath}...")
    
    with open(filepath, 'r') as f:
        sql = f.read()
    
    cur = conn.cursor()
    try:
        # Execute the base SQL
        cur.execute(sql)
        
        # If this is the populate file, add the Bible data
        if '03-populate-bible-verses.sql' in filepath:
            # Load Bible data
            with open('bible_base_data.json', 'r') as f:
                bible_data = json.load(f)
            
            # Book ID mapping
            book_id_map = {
                'Genesis': 'GENE', 'Exodus': 'EXOD', 'Leviticus': 'LEVI', 'Numbers': 'NUMB',
                'Deuteronomy': 'DEUT', 'Joshua': 'JOSH', 'Judges': 'JUDG', 'Ruth': 'RUTH',
                '1 Samuel': '1SAM', '2 Samuel': '2SAM', '1 Kings': '1KIN', '2 Kings': '2KIN',
                '1 Chronicles': '1CHR', '2 Chronicles': '2CHR', 'Ezra': 'EZRA', 'Nehemiah': 'NEHE',
                'Esther': 'ESTH', 'Job': 'JOB', 'Psalms': 'PSAL', 'Proverbs': 'PROV',
                'Ecclesiastes': 'ECCL', 'Song of Solomon': 'SONG', 'Isaiah': 'ISAI', 'Jeremiah': 'JERE',
                'Lamentations': 'LAME', 'Ezekiel': 'EZEK', 'Daniel': 'DANI', 'Hosea': 'HOSE',
                'Joel': 'JOEL', 'Amos': 'AMOS', 'Obadiah': 'OBAD', 'Jonah': 'JONA',
                'Micah': 'MICA', 'Nahum': 'NAHU', 'Habakkuk': 'HABA', 'Zephaniah': 'ZEPH',
                'Haggai': 'HAGG', 'Zechariah': 'ZECH', 'Malachi': 'MALA', 'Matthew': 'MATT',
                'Mark': 'MARK', 'Luke': 'LUKE', 'John': 'JOHN', 'Acts': 'ACTS',
                'Romans': 'ROMA', '1 Corinthians': '1COR', '2 Corinthians': '2COR', 'Galatians': 'GALA',
                'Ephesians': 'EPHE', 'Philippians': 'PHIL', 'Colossians': 'COLO', '1 Thessalonians': '1THE',
                '2 Thessalonians': '2THE', '1 Timothy': '1TIM', '2 Timothy': '2TIM', 'Titus': 'TITU',
                'Philemon': 'PHLE', 'Hebrews': 'HEBR', 'James': 'JAME', '1 Peter': '1PET',
                '2 Peter': '2PET', '1 John': '1JOH', '2 John': '2JOH', '3 John': '3JOH',
                'Jude': 'JUDE', 'Revelation': 'REVE'
            }
            
            # Process Protestant canon books
            protestant_books = [b for b in bible_data['books'] if b['canonicalAffiliation'] in ['All', 'Protestant']]
            
            # Use psycopg2.extras for batch insert
            from psycopg2.extras import execute_values
            
            verses_to_insert = []
            for book in protestant_books:
                book_name = book['name']
                book_id = book_id_map.get(book_name, book_name[:4].upper())
                testament = book['testament']
                book_group = book['bookGroup']
                
                for chapter_num, verse_count in enumerate(book['chapters'], 1):
                    for verse_num in range(1, verse_count + 1):
                        verse_code = f"{book_id}-{chapter_num:03d}-{verse_num:03d}"
                        verses_to_insert.append((
                            verse_code, book_id, book_name, testament, 
                            book_group, chapter_num, verse_num
                        ))
            
            # Batch insert
            execute_values(
                cur,
                """INSERT INTO bible_verses (verse_code, book_id, book_name, testament, 
                                           book_group, chapter_number, verse_number)
                   VALUES %s""",
                verses_to_insert,
                template="(%s, %s, %s, %s, %s, %s, %s)"
            )
            
            logging.info(f"✓ Inserted {len(verses_to_insert)} Bible verses")
        
        conn.commit()
        logging.info(f"✓ {filepath} executed successfully")
        
    except Exception as e:
        conn.rollback()
        logging.error(f"✗ Error executing {filepath}: {e}")
        raise
    finally:
        cur.close()

def main():
    """Main setup function"""
    logging.info("Starting database setup...")
    
    # Create drop schema file if it doesn't exist
    if not os.path.exists('01-drop-schema.sql'):
        logging.info("Creating 01-drop-schema.sql...")
        with open('01-drop-schema.sql', 'w') as f:
            f.write("-- Drop existing schema if it exists\nDROP SCHEMA IF EXISTS wellversed01dev CASCADE;")
    
    # SQL files to execute in order
    sql_files = [
        '01-drop-schema.sql',
        '02-create-schema.sql',
        '03-populate-bible-verses.sql',
        '04-test-data.sql'
    ]
    
    conn = get_db_connection()
    
    try:
        # Execute SQL files
        for sql_file in sql_files:
            if os.path.exists(sql_file):
                execute_sql_with_bible_data(conn, sql_file)
            else:
                logging.warning(f"File {sql_file} not found, skipping...")
        
        logging.info("✓ Database setup completed successfully!")
        
    except Exception as e:
        logging.error(f"Database setup failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()