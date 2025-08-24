import json
import logging
import re
import time
from collections import OrderedDict
from pathlib import Path
from typing import Dict, Tuple, Set

import requests


class ESVRateLimitError(Exception):
    """Raised when the ESV API rate limit is hit."""

    def __init__(self, wait_seconds: int):
        self.wait_seconds = wait_seconds
        super().__init__(f"ESV API rate limit. Try again in {wait_seconds} seconds")

logger = logging.getLogger(__name__)


class VerseCache:
    """LRU cache with a hard limit of 500 verses and half-book caps."""

    def __init__(self, max_size: int = 500, ttl: int = 60 * 60 * 24):
        self.max_size = max_size
        self.ttl = ttl
        self.cache: "OrderedDict[str, tuple[str, float, str, int]]" = OrderedDict()
        # Track per book -> OrderedDict of chapter -> None for LRU eviction
        self.book_chapter_lru: Dict[str, OrderedDict[int, None]] = {}
        # Mapping of (book, chapter) -> set of verse references stored
        self.chapter_refs: Dict[Tuple[str, int], Set[str]] = {}
        # Book -> chapter cache limit (half the number of chapters)
        self.book_limits = self._load_book_limits()

    def _load_book_limits(self) -> Dict[str, int]:
        """Load half-book chapter limits from bible_base_data.json."""
        limits: Dict[str, int] = {}
        try:
            # Try multiple paths to find the file
            possible_paths = [
                Path(__file__).resolve().parents[1] / "bible_base_data.json",  # In Docker container
                Path(__file__).resolve().parents[2] / "sql_setup" / "bible_base_data.json",  # Development
            ]
            
            path = None
            for p in possible_paths:
                if p.exists():
                    path = p
                    break
            
            if not path:
                raise FileNotFoundError(f"bible_base_data.json not found in any of: {possible_paths}")
                
            with open(path) as f:
                data = json.load(f)
            for book in data.get("books", []):
                chapters = book.get("chapters", [])
                limits[book.get("name")] = len(chapters) // 2
        except Exception as e:
            logger.error("Failed to load book chapter counts: %s", e)
        return limits

    def _parse_book_chapter(self, reference: str) -> Tuple[str, int]:
        """Return the book name and chapter number for a reference."""
        try:
            book_part, rest = reference.rsplit(" ", 1)
            chapter_str = rest.split(":", 1)[0]
            return book_part, int(chapter_str)
        except Exception:
            return reference, 0

    def _evict(self, reference: str) -> None:
        """Remove a single verse from the cache."""
        text, ts, book, chapter = self.cache.pop(reference)
        refs = self.chapter_refs.get((book, chapter))
        if refs:
            refs.discard(reference)
            if not refs:
                self.chapter_refs.pop((book, chapter), None)
                lru = self.book_chapter_lru.get(book)
                if lru and chapter in lru:
                    lru.pop(chapter, None)

    def _evict_chapter(self, book: str, chapter: int) -> None:
        """Evict all verses for a given chapter."""
        refs = list(self.chapter_refs.get((book, chapter), []))
        for ref in refs:
            if ref in self.cache:
                self._evict(ref)

    def _prune_expired(self) -> None:
        now = time.time()
        to_remove = [ref for ref, (_, ts, _, _) in self.cache.items() if now - ts > self.ttl]
        for ref in to_remove:
            self._evict(ref)

    def get(self, reference: str) -> str | None:
        self._prune_expired()
        entry = self.cache.get(reference)
        if not entry:
            return None
        text, ts, book, chapter = entry
        if time.time() - ts > self.ttl:
            self._evict(reference)
            return None
        self.cache.move_to_end(reference)
        lru = self.book_chapter_lru.setdefault(book, OrderedDict())
        if chapter in lru:
            lru.move_to_end(chapter)
        return text

    def set(self, reference: str, text: str) -> None:
        self._prune_expired()
        book, chapter = self._parse_book_chapter(reference)
        limit = self.book_limits.get(book, self.max_size)
        if limit <= 0:
            return

        if reference in self.cache:
            self.cache.move_to_end(reference)
            lru = self.book_chapter_lru.setdefault(book, OrderedDict())
            if chapter in lru:
                lru.move_to_end(chapter)
            return

        while len(self.cache) >= self.max_size:
            self._evict(next(iter(self.cache)))

        self.cache[reference] = (text, time.time(), book, chapter)
        refs = self.chapter_refs.setdefault((book, chapter), set())
        refs.add(reference)

        lru = self.book_chapter_lru.setdefault(book, OrderedDict())
        if chapter in lru:
            lru.move_to_end(chapter)
        else:
            lru[chapter] = None

        while len(lru) > limit:
            old_chap, _ = lru.popitem(last=False)
            self._evict_chapter(book, old_chap)



class ESVService:
    """Simple wrapper around the ESV API"""

    BASE_URL = "https://api.esv.org/v3/passage/text/"

    _cache = VerseCache()

    def __init__(self, token: str):
        self.token = token
        self.headers = {"Authorization": f"Token {token}"}
        # Track when the next request is allowed
        self._next_allowed_time = 0.0

    def _check_rate_limit(self) -> None:
        """Raise if we are still within the throttle period."""
        now = time.time()
        if now < self._next_allowed_time:
            wait = int(self._next_allowed_time - now)
            raise ESVRateLimitError(wait)

    def _parse_retry_after(self, detail: str) -> int:
        """Parse the retry delay from the API's error message."""
        match = re.search(r"in\s+(\d+)\s+second", detail)
        if match:
            return int(match.group(1))
        return 1

    def get_verse_text(self, reference: str) -> str:
        cached = self._cache.get(reference)
        if cached is not None:
            return cached

        params = {
            "q": reference,
            "include-headings": False,
            "include-footnotes": False,
            "include-verse-numbers": False,
            "include-short-copyright": False,
            "include-passage-references": False,
        }
        try:
            self._check_rate_limit()
            response = requests.get(self.BASE_URL, params=params, headers=self.headers)
            if response.status_code == 200:
                self._next_allowed_time = time.time()
                data = response.json()
                passages = data.get("passages", [])
                if passages:
                    text = passages[0].strip()
                    text = re.sub(r"<[^>]+>", "", text).strip()
                    self._cache.set(reference, text)
                    return text
                logger.error("No passages returned for %s", reference)
                return ""
            if response.status_code == 429:
                try:
                    detail = response.json().get("detail", "")
                except Exception:
                    detail = response.text
                wait = self._parse_retry_after(detail)
                self._next_allowed_time = time.time() + wait
                logger.warning("ESV API throttled; wait %s seconds", wait)
                raise ESVRateLimitError(wait)
            logger.error("ESV API error %s: %s", response.status_code, response.text)
        except ESVRateLimitError:
            raise
        except Exception as e:
            logger.error("Failed to fetch verse from ESV API: %s", e)
        return ""

    def get_verses_batch(self, references: Dict[str, str]) -> Dict[str, str]:
        """Fetch multiple verses while respecting rate limits."""
        results: Dict[str, str] = {}
        for code, ref in references.items():
            results[code] = self.get_verse_text(ref)
        return results
