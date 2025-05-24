#!/usr/bin/env python3
# sql_setup/setup_database.py
import psycopg2
from psycopg2.extras import execute_values
import json
import logging
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Book mapping with numerical IDs
BOOK_MAPPING = {
    'Genesis': {'id': 1, 'code3': 'GEN', 'code4': 'GENE'},
    'Exodus': {'id': 2, 'code3': 'EXO', 'code4': 'EXOD'},
    'Leviticus': {'id': 3, 'code3': 'LEV', 'code4': 'LEVI'},
    'Numbers': {'id': 4, 'code3': 'NUM', 'code4': 'NUMB'},
    'Deuteronomy': {'id': 5, 'code3': 'DEU', 'code4': 'DEUT'},
    'Joshua': {'id': 6, 'code3': 'JOS', 'code4': 'JOSH'},
    'Judges': {'id': 7, 'code3': 'JDG', 'code4': 'JUDG'},
    'Ruth': {'id': 8, 'code3': 'RUT', 'code4': 'RUTH'},
    '1 Samuel': {'id': 9, 'code3': '1SA', 'code4': '1SAM'},
    '2 Samuel': {'id': 10, 'code3': '2SA', 'code4': '2SAM'},
    '1 Kings': {'id': 11, 'code3': '1KI', 'code4': '1KIN'},
    '2 Kings': {'id': 12, 'code3': '2KI', 'code4': '2KIN'},
    '1 Chronicles': {'id': 13, 'code3': '1CH', 'code4': '1CHR'},
    '2 Chronicles': {'id': 14, 'code3': '2CH', 'code4': '2CHR'},
    'Ezra': {'id': 15, 'code3': 'EZR', 'code4': 'EZRA'},
    'Nehemiah': {'id': 16, 'code3': 'NEH', 'code4': 'NEHE'},
    'Esther': {'id': 17, 'code3': 'EST', 'code4': 'ESTH'},
    'Job': {'id': 18, 'code3': 'JOB', 'code4': 'JOBB'},
    'Psalms': {'id': 19, 'code3': 'PSA', 'code4': 'PSAL'},
    'Proverbs': {'id': 20, 'code3': 'PRO', 'code4': 'PROV'},
    'Ecclesiastes': {'id': 21, 'code3': 'ECC', 'code4': 'ECCL'},
    'Song of Solomon': {'id': 22, 'code3': 'SOS', 'code4': 'SONG'},
    'Isaiah': {'id': 23, 'code3': 'ISA', 'code4': 'ISAI'},
    'Jeremiah': {'id': 24, 'code3': 'JER', 'code4': 'JERE'},
    'Lamentations': {'id': 25, 'code3': 'LAM', 'code4': 'LAME'},
    'Ezekiel': {'id': 26, 'code3': 'EZE', 'code4': 'EZEK'},
    'Daniel': {'id': 27, 'code3': 'DAN', 'code4': 'DANI'},
    'Hosea': {'id': 28, 'code3': 'HOS', 'code4': 'HOSE'},
    'Joel': {'id': 29, 'code3': 'JOE', 'code4': 'JOEL'},
    'Amos': {'id': 30, 'code3': 'AMO', 'code4': 'AMOS'},
    'Obadiah': {'id': 31, 'code3': 'OBA', 'code4': 'OBAD'},
    'Jonah': {'id': 32, 'code3': 'JON', 'code4': 'JONA'},
    'Micah': {'id': 33, 'code3': 'MIC', 'code4': 'MICA'},
    'Nahum': {'id': 34, 'code3': 'NAH', 'code4': 'NAHU'},
    'Habakkuk': {'id': 35, 'code3': 'HAB', 'code4': 'HABA'},
    'Zephaniah': {'id': 36, 'code3': 'ZEP', 'code4': 'ZEPH'},
    'Haggai': {'id': 37, 'code3': 'HAG', 'code4': 'HAGG'},
    'Zechariah': {'id': 38, 'code3': 'ZEC', 'code4': 'ZECH'},
    'Malachi': {'id': 39, 'code3': 'MAL', 'code4': 'MALA'},
    'Matthew': {'id': 40, 'code3': 'MAT', 'code4': 'MATT'},
    'Mark': {'id': 41, 'code3': 'MRK', 'code4': 'MARK'},
    'Luke': {'id': 42, 'code3': 'LUK', 'code4': 'LUKE'},
    'John': {'id': 43, 'code3': 'JHN', 'code4': 'JOHN'},
    'Acts': {'id': 44, 'code3': 'ACT', 'code4': 'ACTS'},
    'Romans': {'id': 45, 'code3': 'ROM', 'code4': 'ROMA'},
    '1 Corinthians': {'id': 46, 'code3': '1CO', 'code4': '1COR'},
    '2 Corinthians': {'id': 47, 'code3': '2CO', 'code4': '2COR'},
    'Galatians': {'id': 48, 'code3': 'GAL', 'code4': 'GALA'},
    'Ephesians': {'id': 49, 'code3': 'EPH', 'code4': 'EPHE'},
    'Philippians': {'id': 50, 'code3': 'PHP', 'code4': 'PHIL'},
    'Colossians': {'id': 51, 'code3': 'COL', 'code4': 'COLO'},
    '1 Thessalonians': {'id': 52, 'code3': '1TH', 'code4': '1THE'},
    '2 Thessalonians': {'id': 53, 'code3': '2TH', 'code4': '2THE'},
    '1 Timothy': {'id': 54, 'code3': '1TI', 'code4': '1TIM'},
    '2 Timothy': {'id': 55, 'code3': '2TI', 'code4': '2TIM'},
    'Titus': {'id': 56, 'code3': 'TIT', 'code4': 'TITU'},
    'Philemon': {'id': 57, 'code3': 'PHM', 'code4': 'PHLE'},
    'Hebrews': {'id': 58, 'code3': 'HEB', 'code4': 'HEBR'},
    'James': {'id': 59, 'code3': 'JAS', 'code4': 'JAME'},
    '1 Peter': {'id': 60, 'code3': '1PE', 'code4': '1PET'},
    '2 Peter': {'id': 61, 'code3': '2PE', 'code4': '2PET'},
    '1 John': {'id': 62, 'code3': '1JN', 'code4': '1JOH'},
    '2 John': {'id': 63, 'code3': '2JN', 'code4': '2JOH'},
    '3 John': {'id': 64, 'code3': '3JN', 'code4': '3JOH'},
    'Jude': {'id': 65, 'code3': 'JDE', 'code4': 'JUDE'},
    'Revelation': {'id': 66, 'code3': 'REV', 'code4': 'REVE'},
    # Apocryphal books (if needed later)
    'Tobit': {'id': 67, 'code3': 'TOB', 'code4': 'TOBI'},
    'Judith': {'id': 68, 'code3': 'JDT', 'code4': 'JUDI'},
    '1 Maccabees': {'id': 69, 'code3': '1MA', 'code4': '1MAC'},
    '2 Maccabees': {'id': 70, 'code3': '2MA', 'code4': '2MAC'},
    'Wisdom of Solomon': {'id': 71, 'code3': 'WIS', 'code4': 'WISD'},
    'Sirach': {'id': 72, 'code3': 'SIR', 'code4': 'SIRA'},
    'Baruch': {'id': 73, 'code3': 'BAR', 'code4': 'BARU'},
}

# Apocryphal chapters
APOCRYPHAL_CHAPTERS = {
    19: [151],  # Psalms 151
    17: list(range(11, 17)),  # Esther additions
    27: [13, 14],  # Daniel additions
}

def get_db_connection():
    """Create a database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', 5432),
        database=os.getenv('DB_NAME', 'wellversed01DEV'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'postgres')
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
    """Populate the Bible books and verses"""
    logging.info("Populating Bible data...")
    
    # Load Bible data
    with open('bible_base_data.json', 'r') as f:
        bible_data = json.load(f)
    
    cur = conn.cursor()
    
    try:
        # Insert books reference data
        books_to_insert = []
        for book in bible_data['books']:
            if book['canonicalAffiliation'] in ['All', 'Protestant']:
                book_name = book['name']
                if book_name in BOOK_MAPPING:
                    mapping = BOOK_MAPPING[book_name]
                    books_to_insert.append((
                        mapping['id'],
                        book_name,
                        mapping['code3'],
                        mapping['code4'],
                        book['testament'],
                        book['bookGroup'],
                        book['canonicalAffiliation'],
                        len(book['chapters'])
                    ))
        
        execute_values(
            cur,
            """INSERT INTO bible_books (book_id, book_name, book_code_3, book_code_4, 
                                      testament, book_group, canonical_affiliation, chapter_count)
               VALUES %s
               ON CONFLICT (book_id) DO NOTHING""",
            books_to_insert,
            template="(%s, %s, %s, %s, %s, %s, %s, %s)"
        )
        logging.info(f"✓ Inserted {len(books_to_insert)} books")
        
        # Insert verses
        verses_to_insert = []
        for book in bible_data['books']:
            if book['canonicalAffiliation'] in ['All', 'Protestant']:
                book_name = book['name']
                if book_name in BOOK_MAPPING:
                    book_id = BOOK_MAPPING[book_name]['id']
                    
                    for chapter_num, verse_count in enumerate(book['chapters'], 1):
                        # Check if this chapter has apocryphal verses
                        is_chapter_apocryphal = (book_id in APOCRYPHAL_CHAPTERS and 
                                               chapter_num in APOCRYPHAL_CHAPTERS[book_id])
                        
                        for verse_num in range(1, verse_count + 1):
                            verse_code = f"{book_id}-{chapter_num}-{verse_num}"
                            verses_to_insert.append((
                                verse_code,
                                book_id,
                                chapter_num,
                                verse_num,
                                is_chapter_apocryphal
                            ))
        
        # Batch insert verses
        execute_values(
            cur,
            """INSERT INTO bible_verses (verse_code, book_id, chapter_number, verse_number, is_apocryphal)
               VALUES %s""",
            verses_to_insert,
            template="(%s, %s, %s, %s, %s)"
        )
        
        logging.info(f"✓ Inserted {len(verses_to_insert)} Bible verses")
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error populating Bible data: {e}")
        raise
    finally:
        cur.close()

def populate_test_data(conn):
    """Add test user and sample memorized verses"""
    logging.info("Adding test data...")
    
    cur = conn.cursor()
    try:
        # Insert test user
        cur.execute("""
            INSERT INTO users (email, name, first_name, last_name, denomination, preferred_bible)
            VALUES ('test@example.com', 'Test User', 'Test', 'User', 'Non-denominational', 'KJV')
            ON CONFLICT (email) DO NOTHING
            RETURNING user_id
        """)
        
        result = cur.fetchone()
        if result:
            user_id = result[0]
            
            # Add some memorized verses (John 3:16, Genesis 1:1, Psalm 23:1)
            test_verses = [
                (43, 3, 16),   # John 3:16
                (1, 1, 1),     # Genesis 1:1
                (19, 23, 1)    # Psalm 23:1
            ]
            
            for book_id, chapter, verse in test_verses:
                verse_code = f"{book_id}-{chapter}-{verse}"
                cur.execute("""
                    INSERT INTO user_verses (user_id, verse_id, practice_count)
                    SELECT %s, id, 1
                    FROM bible_verses
                    WHERE verse_code = %s
                    ON CONFLICT DO NOTHING
                """, (user_id, verse_code))
            
            logging.info("✓ Added test user and memorized verses")
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Error adding test data: {e}")
        raise
    finally:
        cur.close()

def main():
    """Main setup function"""
    logging.info("Starting database setup...")
    
    conn = get_db_connection()
    
    try:
        # Execute schema files
        if os.path.exists('01-drop-schema.sql'):
            execute_sql_file(conn, '01-drop-schema.sql')
        
        if os.path.exists('02-create-schema.sql'):
            execute_sql_file(conn, '02-create-schema.sql')
        
        # Populate Bible data
        populate_bible_data(conn)
        
        # Add test data
        populate_test_data(conn)
        
        logging.info("✓ Database setup completed successfully!")
        
    except Exception as e:
        logging.error(f"Database setup failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()