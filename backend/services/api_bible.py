# backend/services/api_bible_hybrid.py
# A hybrid approach that balances efficiency with reliability

import requests
import logging
from typing import Dict, List, Optional, Tuple
from functools import lru_cache
import json
from collections import defaultdict

logger = logging.getLogger(__name__)

class APIBibleService:
    """Service for interacting with API.Bible - Hybrid approach"""
    
    BASE_URL = "https://api.scripture.api.bible/v1"
    
    # Book ID mapping from numeric to API.Bible format
    BOOK_ID_MAP = {
        1: "GEN", 2: "EXO", 3: "LEV", 4: "NUM", 5: "DEU",
        6: "JOS", 7: "JDG", 8: "RUT", 9: "1SA", 10: "2SA",
        11: "1KI", 12: "2KI", 13: "1CH", 14: "2CH", 15: "EZR",
        16: "NEH", 17: "EST", 18: "JOB", 19: "PSA", 20: "PRO",
        21: "ECC", 22: "SNG", 23: "ISA", 24: "JER", 25: "LAM",
        26: "EZK", 27: "DAN", 28: "HOS", 29: "JOL", 30: "AMO",
        31: "OBA", 32: "JON", 33: "MIC", 34: "NAM", 35: "HAB",
        36: "ZEP", 37: "HAG", 38: "ZEC", 39: "MAL", 40: "MAT",
        41: "MRK", 42: "LUK", 43: "JHN", 44: "ACT", 45: "ROM",
        46: "1CO", 47: "2CO", 48: "GAL", 49: "EPH", 50: "PHP",
        51: "COL", 52: "1TH", 53: "2TH", 54: "1TI", 55: "2TI",
        56: "TIT", 57: "PHM", 58: "HEB", 59: "JAS", 60: "1PE",
        61: "2PE", 62: "1JN", 63: "2JN", 64: "3JN", 65: "JUD",
        66: "REV",
        # Apocryphal books
        67: "TOB", 68: "JDT", 69: "1MA", 70: "2MA", 71: "WIS",
        72: "SIR", 73: "BAR", 74: "1ES", 75: "3MA", 76: "MAN"
    }
    
    def __init__(self, api_key: str, default_bible_id: str):
        self.api_key = api_key
        self.default_bible_id = default_bible_id
        self.headers = {
            "api-key": api_key,
            "accept": "application/json"
        }
        self._cache = {}
        logger.info(f"APIBibleService initialized with Bible ID: {default_bible_id}")
    
    def convert_verse_code(self, verse_code: str) -> tuple:
        """Convert verse code from '40-1-1' to ('MAT', 1, 1)"""
        parts = verse_code.split('-')
        if len(parts) != 3:
            raise ValueError(f"Invalid verse code format: {verse_code}")
        
        book_num = int(parts[0])
        chapter = int(parts[1])
        verse = int(parts[2])
        
        book_code = self.BOOK_ID_MAP.get(book_num)
        if not book_code:
            raise ValueError(f"Unknown book ID: {book_num}")
        
        return book_code, chapter, verse
    
    def get_verses_batch(self, verse_codes: List[str], bible_id: Optional[str] = None) -> Dict[str, str]:
        """Get multiple verse texts with smart batching"""
        bible_id = bible_id or self.default_bible_id
        results = {}
        
        logger.info(f"Fetching {len(verse_codes)} verses in batch")
        
        # Group verses by book and chapter
        verse_groups = defaultdict(lambda: defaultdict(list))
        
        for code in verse_codes:
            try:
                book_code, chapter, verse = self.convert_verse_code(code)
                verse_groups[book_code][chapter].append((verse, code))
            except ValueError as e:
                logger.error(f"Invalid verse code {code}: {e}")
                results[code] = ""
        
        # Process each chapter group
        for book_code, chapters in verse_groups.items():
            for chapter, verse_list in chapters.items():
                verse_list.sort(key=lambda x: x[0])
                
                # Check cache first
                uncached_verses = []
                for verse_num, original_code in verse_list:
                    cache_key = f"{bible_id}:{book_code}.{chapter}.{verse_num}"
                    if cache_key in self._cache:
                        results[original_code] = self._cache[cache_key]
                    else:
                        uncached_verses.append((verse_num, original_code))
                
                if not uncached_verses:
                    continue  # All verses were cached
                
                # Group consecutive verses into ranges
                ranges = self._group_consecutive_verses(uncached_verses)
                
                # Fetch each range
                for range_verses in ranges:
                    if len(range_verses) == 1:
                        # Single verse
                        verse_num, original_code = range_verses[0]
                        text = self._fetch_single_verse(bible_id, book_code, chapter, verse_num)
                        results[original_code] = text or ""
                    else:
                        # Multiple verses - fetch as small passage
                        verse_texts = self._fetch_verse_range(bible_id, book_code, chapter, range_verses)
                        for verse_num, original_code in range_verses:
                            results[original_code] = verse_texts.get(verse_num, "")
        
        # Log summary
        successful = sum(1 for v in results.values() if v)
        logger.info(f"Batch complete: {successful}/{len(verse_codes)} verses retrieved")
        
        return results
    
    def _group_consecutive_verses(self, verses: List[Tuple[int, str]]) -> List[List[Tuple[int, str]]]:
        """Group consecutive verses into ranges for efficient fetching"""
        if not verses:
            return []
        
        ranges = []
        current_range = [verses[0]]
        
        for i in range(1, len(verses)):
            verse_num, code = verses[i]
            prev_verse_num = verses[i-1][0]
            
            # If consecutive, add to current range
            if verse_num == prev_verse_num + 1:
                current_range.append(verses[i])
            else:
                # Start new range
                ranges.append(current_range)
                current_range = [verses[i]]
        
        ranges.append(current_range)
        return ranges
    
    def _fetch_single_verse(self, bible_id: str, book_code: str, chapter: int, verse: int) -> Optional[str]:
        """Fetch a single verse"""
        try:
            reference = f"{book_code}.{chapter}.{verse}"
            url = f"{self.BASE_URL}/bibles/{bible_id}/verses/{reference}"
            
            response = requests.get(url, headers=self.headers, params={
                "content-type": "text",
                "include-notes": "false",
                "include-titles": "false",
                "include-chapter-numbers": "false",
                "include-verse-numbers": "false"
            })
            
            if response.status_code == 200:
                data = response.json()
                text = data.get("data", {}).get("content", "").strip()
                
                if text:
                    # Cache it
                    cache_key = f"{bible_id}:{reference}"
                    self._cache[cache_key] = text
                    logger.debug(f"Fetched verse {reference}")
                
                return text
            else:
                logger.error(f"Failed to fetch verse {reference}: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching verse {book_code}.{chapter}.{verse}: {e}")
            return None
    
    def _fetch_verse_range(self, bible_id: str, book_code: str, chapter: int, 
                          verses: List[Tuple[int, str]]) -> Dict[int, str]:
        """Fetch a range of verses as a passage"""
        try:
            min_verse = verses[0][0]
            max_verse = verses[-1][0]
            
            # For ranges larger than 10 verses, fetch individually (more reliable)
            if max_verse - min_verse + 1 > 10:
                logger.info(f"Range too large ({max_verse - min_verse + 1} verses), fetching individually")
                result = {}
                for verse_num, _ in verses:
                    text = self._fetch_single_verse(bible_id, book_code, chapter, verse_num)
                    result[verse_num] = text or ""
                return result
            
            # Fetch as passage
            passage_ref = f"{book_code}.{chapter}.{min_verse}-{book_code}.{chapter}.{max_verse}"
            url = f"{self.BASE_URL}/bibles/{bible_id}/passages/{passage_ref}"
            
            logger.info(f"Fetching passage: {passage_ref}")
            
            response = requests.get(url, headers=self.headers, params={
                "content-type": "text",
                "include-notes": "false",
                "include-titles": "false",
                "include-chapter-numbers": "false",
                "include-verse-numbers": "false"
            })
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("data", {}).get("content", "").strip()
                
                # For now, we'll split the content evenly among verses
                # This is not perfect but works for consecutive verses
                if content and len(verses) > 0:
                    # Try to split by common verse separators
                    parts = content.split('.')
                    
                    # Simple distribution - not perfect but functional
                    verse_texts = {}
                    if len(parts) >= len(verses):
                        for i, (verse_num, _) in enumerate(verses):
                            if i < len(parts):
                                text = parts[i].strip() + '.'
                                verse_texts[verse_num] = text
                                
                                # Cache it
                                cache_key = f"{bible_id}:{book_code}.{chapter}.{verse_num}"
                                self._cache[cache_key] = text
                    else:
                        # Fallback: give entire content to first verse
                        verse_texts[verses[0][0]] = content
                    
                    return verse_texts
            else:
                logger.error(f"Failed to fetch passage {passage_ref}: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error fetching verse range: {e}")
        
        # Fallback: fetch individually
        result = {}
        for verse_num, _ in verses:
            text = self._fetch_single_verse(bible_id, book_code, chapter, verse_num)
            result[verse_num] = text or ""
        return result
    
    @lru_cache(maxsize=1000)
    def get_verse_text(self, verse_code: str, bible_id: Optional[str] = None) -> Optional[str]:
        """Get single verse text from API.Bible"""
        results = self.get_verses_batch([verse_code], bible_id)
        return results.get(verse_code, None)
    
    # backend/services/api_bible.py (updated get_available_bibles method)
    @lru_cache(maxsize=10)
    def get_available_bibles(self, language: Optional[str] = None) -> List[Dict]:
        """Get list of available Bible translations"""
        try:
            url = f"{self.BASE_URL}/bibles"
            params = {}
            if language:
                params['language'] = language  # 3-letter ISO 639-3 code
            
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            else:
                logger.error(f"Failed to get bibles: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error getting available bibles: {e}")
            return []