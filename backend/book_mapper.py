# backend/book_mapper.py
"""Map 3-char book IDs from frontend to 4-char database IDs"""

BOOK_ID_MAP = {
    'GEN': 'GENE',
    'EXO': 'EXOD', 
    'LEV': 'LEVI',
    'NUM': 'NUMB',
    'DEU': 'DEUT',
    'JOS': 'JOSH',
    'JDG': 'JUDG',
    'RUT': 'RUTH',
    '1SA': '1SAM',
    '2SA': '2SAM',
    '1KI': '1KIN',
    '2KI': '2KIN',
    '1CH': '1CHR',
    '2CH': '2CHR',
    'EZR': 'EZRA',
    'NEH': 'NEHE',
    'EST': 'ESTH',
    'JOB': 'JOBB',
    'PSA': 'PSAL',
    'PRO': 'PROV',
    'ECC': 'ECCL',
    'SOS': 'SONG',
    'ISA': 'ISAI',
    'JER': 'JERE',
    'LAM': 'LAME',
    'EZE': 'EZEK',
    'DAN': 'DANI',
    'HOS': 'HOSE',
    'JOE': 'JOEL',
    'AMO': 'AMOS',
    'OBA': 'OBAD',
    'JON': 'JONA',
    'MIC': 'MICA',
    'NAH': 'NAHU',
    'HAB': 'HABA',
    'ZEP': 'ZEPH',
    'HAG': 'HAGG',
    'ZEC': 'ZECH',
    'MAL': 'MALA',
    'MAT': 'MATT',
    'MRK': 'MARK',
    'LUK': 'LUKE',
    'JHN': 'JOHN',
    'ACT': 'ACTS',
    'ROM': 'ROMA',
    '1CO': '1COR',
    '2CO': '2COR',
    'GAL': 'GALA',
    'EPH': 'EPHE',
    'PHP': 'PHIL',
    'COL': 'COLO',
    '1TH': '1THE',
    '2TH': '2THE',
    '1TI': '1TIM',
    '2TI': '2TIM',
    'TIT': 'TITU',
    'PHM': 'PHLM',
    'HEB': 'HEBR',
    'JAS': 'JAME',
    '1PE': '1PET',
    '2PE': '2PET',
    '1JN': '1JOH',
    '2JN': '2JOH',
    '3JN': '3JOH',
    'JDE': 'JUDE',
    'REV': 'REVE'
}

def normalize_verse_code(verse_code: str) -> str:
    """Convert frontend verse code to database format"""
    parts = verse_code.split('-')
    if len(parts) != 3:
        return verse_code
    
    book_id, chapter, verse = parts
    # Map 3-char to 4-char book ID
    book_id_mapped = BOOK_ID_MAP.get(book_id, book_id)
    
    # Pad chapter and verse numbers
    try:
        chapter_num = int(chapter)
        verse_num = int(verse)
        return f"{book_id_mapped}-{chapter_num:03d}-{verse_num:03d}"
    except ValueError:
        return verse_code