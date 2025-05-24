a# data/populate_apocryphal_content.py
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(parent_dir, '.env'))

# Known apocryphal content in Protestant canonical books
APOCRYPHAL_CONTENT = [
    # Daniel additions
    {'book': 'Daniel', 'chapter': 3, 'verse_start': 24, 'verse_end': 90, 
     'description': 'Prayer of Azariah and Song of the Three Young Men'},
    {'book': 'Daniel', 'chapter': 13, 'verse_start': 1, 'verse_end': 64, 
     'description': 'Susanna'},
    {'book': 'Daniel', 'chapter': 14, 'verse_start': 1, 'verse_end': 42, 
     'description': 'Bel and the Dragon'},
    
    # Esther additions (Greek)
    {'book': 'Esther', 'chapter': 10, 'verse_start': 4, 'verse_end': 16, 
     'description': 'Greek additions'},
    {'book': 'Esther', 'chapter': 11, 'verse_start': 1, 'verse_end': 12, 
     'description': 'Greek additions'},
    {'book': 'Esther', 'chapter': 12, 'verse_start': 1, 'verse_end': 6, 
     'description': 'Greek additions'},
    {'book': 'Esther', 'chapter': 13, 'verse_start': 1, 'verse_end': 18, 
     'description': 'Greek additions'},
    {'book': 'Esther', 'chapter': 14, 'verse_start': 1, 'verse_end': 19, 
     'description': 'Greek additions'},
    {'book': 'Esther', 'chapter': 15, 'verse_start': 1, 'verse_end': 16, 
     'description': 'Greek additions'},
    {'book': 'Esther', 'chapter': 16, 'verse_start': 1, 'verse_end': 24, 
     'description': 'Greek additions'},
]

def populate_apocryphal_content():
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
        for content in APOCRYPHAL_CONTENT:
            # Get book_id
            cur.execute("SELECT book_id FROM books WHERE book_name = %s", (content['book'],))
            result = cur.fetchone()
            
            if result:
                book_id = result[0]
                cur.execute("""
                    INSERT INTO apocryphal_content 
                    (book_id, chapter_number, verse_start, verse_end, description)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    book_id, content['chapter'], content.get('verse_start'),
                    content.get('verse_end'), content['description']
                ))
        
        conn.commit()
        print("✅ Apocryphal content markers populated successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error populating apocryphal content: {str(e)}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    populate_apocryphal_content()