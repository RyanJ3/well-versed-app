# backend/app/models/enums.py
from enum import Enum

class TestamentType(str, Enum):
    OLD = "Old Testament"
    NEW = "New Testament"

class CanonicalType(str, Enum):
    ALL = "All"
    CATHOLIC = "Catholic"
    EASTERN_ORTHODOX = "Eastern Orthodox"
    PROTESTANT = "Protestant"
    NONE = "NONE"

class BookGroupType(str, Enum):
    TORAH = "Torah"
    HISTORICAL = "Historical"
    WISDOM = "Wisdom"
    MAJOR_PROPHETS = "Major Prophets"
    MINOR_PROPHETS = "Minor Prophets"
    GOSPELS = "Gospels"
    MODERN_HISTORICAL = "Modern Historical"
    PAULINE_EPISTLES = "Pauline Epistles"
    GENERAL_EPISTLES = "General Epistles"
    APOCALYPTIC = "Apocalyptic"

class BibleTranslation(str, Enum):
    KJV = "KJV"
    NIV = "NIV"
    ESV = "ESV"
    NASB = "NASB"
    NLT = "NLT"
    CSB = "CSB"
    NKJV = "NKJV"
    RSV = "RSV"
    MSG = "MSG"
    AMP = "AMP"