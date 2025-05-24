# data/populate_bible_verses.py
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(parent_dir, '.env'))

def populate_bible_verses():
    """Populate bible_verses table with all possible verses"""
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
        # Get all books with their chapter counts
        cur.execute("""
            SELECT b.book_id, b.book_code, c.chapter_number, c.verse_count
            FROM books b
            JOIN chapter_verse_counts c ON b.book_id = c.book_id
            ORDER BY b.book_id, c.chapter_number
        """)
        
        chapters = cur.fetchall()
        total_verses = 0
        
        print("Populating bible_verses table...")
        
        # Insert verses for each chapter
        for book_id, book_code, chapter_number, verse_count in chapters:
            for verse_number in range(1, verse_count + 1):
                cur.execute("""
                    INSERT INTO bible_verses (book_id, chapter_number, verse_number)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (book_id, chapter_number, verse_number) DO NOTHING
                """, (book_id, chapter_number, verse_number))
                total_verses += 1
        
        conn.commit()
        
        # Verify
        cur.execute("SELECT COUNT(*) FROM bible_verses")
        actual_count = cur.fetchone()[0]
        
        print(f"✅ Successfully populated {actual_count} verses")
        print(f"📊 Expected {total_verses} verses total")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error populating bible_verses: {str(e)}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    populate_bible_verses()