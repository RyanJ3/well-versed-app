# backend/populate_all_verses.py - Fix book ID mapping
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
        # FIX: Correct mappings for similar books
        'Philippians': 'PHP',
        'Philemon': 'PHM',
        'Hebrews': 'HEB',
        'James': 'JAS',
        'Jude': 'JDE',
        'Titus': 'TIT',
        'Galatians': 'GAL',
        'Ephesians': 'EPH',
        'Colossians': 'COL',
        # Numbered books
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
        # Apocryphal books
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

# backend/app/models.py - Update books table data
# SQL to fix the collision in database:
"""
UPDATE books SET book_code = 'PHP' WHERE book_name = 'Philippians';
UPDATE books SET book_code = 'PHM' WHERE book_name = 'Philemon';
"""

