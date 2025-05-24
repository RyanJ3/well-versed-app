#!/usr/bin/env python3
# /data/populate_chapter_counts.py
# Populates chapter_verse_counts from bible_base_data.json

import json
import psycopg2
import os

# Book code mapping
BOOK_CODES = {
    'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
    'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
    '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
    '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
    'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO',
    'Ecclesiastes': 'ECC', 'Song of Solomon': 'SOS', 'Isaiah': 'ISA',
    'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
    'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA',
    'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB',
    'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
    'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
    'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
    'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
    '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI',
    '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
    'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN',
    '2 John': '2JN', '3 John': '3JN', 'Jude': 'JDE', 'Revelation': 'REV',
    # Apocryphal books
    'Tobit': 'TOB', 'Judith': 'JDT', 'Wisdom of Solomon': 'WIS', 'Sirach': 'SIR',
    'Baruch': 'BAR', '1 Maccabees': '1MA', '2 Maccabees': '2MA', '1 Esdras': '1ES',
    '3 Maccabees': '3MA', '4 Maccabees': '4MA', 'Prayer of Manasseh': 'PAM'
}

def main():
    # Database connection
    conn = psycopg2.connect(
        host=os.getenv('DATABASE_HOST', 'localhost'),
        database=os.getenv('DATABASE_NAME', 'wellversed01DEV'),
        user=os.getenv('DATABASE_USER', 'postgres'),
        password=os.getenv('DATABASE_PASSWORD', 'postgres')
    )
    cur = conn.cursor()
    
    # Load Bible data
    with open('bible_base_data.json', 'r') as f:
        bible_data = json.load(f)
    
    # Get book ID mapping
    cur.execute("SELECT book_code, book_id FROM books")
    book_ids = {row[0]: row[1] for row in cur.fetchall()}
    
    # Process each book
    for book in bible_data['books']:
        if book['canonicalAffiliation'] == 'NONE':
            continue
            
        book_code = BOOK_CODES.get(book['name'])
        if not book_code or book_code not in book_ids:
            print(f"Skipping {book['name']} - no mapping found")
            continue
        
        book_id = book_ids[book_code]
        
        # Insert chapter verse counts
        for chapter_num, verse_count in enumerate(book['chapters'], 1):
            cur.execute("""
                INSERT INTO chapter_verse_counts (book_id, chapter_number, verse_count)
                VALUES (%s, %s, %s)
                ON CONFLICT (book_id, chapter_number) DO UPDATE 
                SET verse_count = EXCLUDED.verse_count
            """, (book_id, chapter_num, verse_count))
    
    conn.commit()
    print(f"Populated {cur.rowcount} chapter verse counts")
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()