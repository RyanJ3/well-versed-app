def get_apocryphal_book_ids():
    """Return a list of all apocryphal book IDs"""
    return [
        'SIR',  # Sirach / Ecclesiasticus
        'TOB',  # Tobit
        'JDT',  # Judith
        'WIS',  # Wisdom of Solomon
        '1MA',  # 1 Maccabees
        '2MA',  # 2 Maccabees
        '3MA',  # 3 Maccabees
        '4MA',  # 4 Maccabees
        'BAR',  # Baruch
        'PS151', # Psalm 151
        'PAM',  # Prayer of Manasseh
        '1ES',  # 1 Esdras
        '2ES',  # 2 Esdras
    ]

def is_apocryphal_book(book_id: str) -> bool:
    """Check if a book ID belongs to an apocryphal book"""
    # Extract the book portion from a verse_id if needed
    if "-" in book_id:
        book_id = book_id.split("-")[0]
        
    return book_id in get_apocryphal_book_ids()