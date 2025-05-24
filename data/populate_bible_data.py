# data/populate_bible_data.py
import os
import json
import psycopg2
from dotenv import load_dotenv

# Load environment variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(parent_dir, '.env'))

def populate_bible_data():
    # Load JSON data
    json_path = os.path.join(os.path.dirname(__file__), 'bible_base_data.json')
    with open(json_path, 'r') as f:
        bible_data = json.load(f)
    
    # Database connection
    conn_params = {
        'host': os.getenv('DATABASE_HOST'),
        'port': os.getenv('DATABASE_PORT'),
        'user': os.getenv('DATABASE_USER'),
        'password': os.getenv('DATABASE_PASSWORD'),
        'database': os.getenv('DATABASE_NAME')
    }
    
    conn = psycopg2.connect(**conn_params)
    cur = conn.cursor()
    
    try:
        # Generate 4-letter book codes
        def get_book_code(book_name):
            # Special cases to avoid conflicts
            codes = {
                'Judges': 'JUDG',
                'Judith': 'JUDI',
                'Philippians': 'PHIL',
                'Philemon': 'PHLM',
                'Psalms': 'PSAL',
                'Song of Solomon': 'SONG',
                '1 Esdras': 'ESD1',
                '2 Esdras': 'ESD2',
                'Prayer of Manasseh': 'PMAN',
                'Wisdom of Solomon': 'WISD',
                '1 John': '1JOH',
                '2 John': '2JOH',
                '3 John': '3JOH'
            }
            if book_name in codes:
                return codes[book_name]
            
            # For numbered books
            if book_name[0].isdigit():
                # e.g., "1 Samuel" -> "1SAM"
                return book_name[0] + book_name[2:5].upper()
            else:
                return book_name[:4].upper()
        
        # Insert books
        for i, book in enumerate(bible_data['books'], 1):
            book_code = get_book_code(book['name'])
            total_verses = sum(book['chapters'])
            is_apocryphal = book['canonicalAffiliation'] in ['Catholic', 'Eastern Orthodox', 'NONE']
            
            cur.execute("""
                INSERT INTO books (book_id, book_code, book_name, testament, 
                                 book_group, total_chapters, total_verses, 
                                 canonical_affiliation, is_apocryphal_book, display_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                i, book_code, book['name'], book['testament'],
                book['bookGroup'], len(book['chapters']), total_verses,
                book['canonicalAffiliation'], is_apocryphal, i
            ))
            
            # Insert chapter verse counts
            for chapter_num, verse_count in enumerate(book['chapters'], 1):
                cur.execute("""
                    INSERT INTO chapter_verse_counts (book_id, chapter_number, verse_count)
                    VALUES (%s, %s, %s)
                """, (i, chapter_num, verse_count))
        
        conn.commit()
        print("✅ Bible data populated successfully!")
        
        # Show summary
        cur.execute("SELECT COUNT(*) FROM books")
        book_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM chapter_verse_counts")
        chapter_count = cur.fetchone()[0]
        
        print(f"📚 Inserted {book_count} books")
        print(f"📖 Inserted {chapter_count} chapter records")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error populating Bible data: {str(e)}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    populate_bible_data()