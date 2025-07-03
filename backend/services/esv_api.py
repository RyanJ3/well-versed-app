import json
import logging
import re
import time
from collections import OrderedDict
from pathlib import Path
from typing import Dict

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
        self.cache: "OrderedDict[str, tuple[str, float, str]]" = OrderedDict()
        self.book_counts: Dict[str, int] = {}
        self.book_limits = self._load_book_limits()

    def _load_book_limits(self) -> Dict[str, int]:
        """Load half-book verse limits from bible_base_data.json."""
        limits: Dict[str, int] = {}
        try:
            path = Path(__file__).resolve().parents[2] / "sql_setup" / "bible_base_data.json"
            with open(path) as f:
                data = json.load(f)
            for book in data.get("books", []):
                total = sum(book.get("chapters", []))
                limits[book.get("name")] = total // 2
        except Exception as e:
            logger.error("Failed to load book verse counts: %s", e)
        return limits

    def _parse_book(self, reference: str) -> str:
        try:
            book, _ = reference.rsplit(" ", 1)
            return book
        except ValueError:
            return reference

    def _evict(self, reference: str) -> None:
        text, ts, book = self.cache.pop(reference)
        count = self.book_counts.get(book, 1)
        if count <= 1:
            self.book_counts.pop(book, None)
        else:
            self.book_counts[book] = count - 1

    def _prune_expired(self) -> None:
        now = time.time()
        to_remove = [ref for ref, (_, ts, _) in self.cache.items() if now - ts > self.ttl]
        for ref in to_remove:
            self._evict(ref)

    def get(self, reference: str) -> str | None:
        self._prune_expired()
        entry = self.cache.get(reference)
        if not entry:
            return None
        text, ts, book = entry
        if time.time() - ts > self.ttl:
            self._evict(reference)
            return None
        self.cache.move_to_end(reference)
        return text

    def set(self, reference: str, text: str) -> None:
        self._prune_expired()
        book = self._parse_book(reference)
        limit = self.book_limits.get(book, self.max_size)
        if self.book_counts.get(book, 0) >= limit:
            return
        if reference in self.cache:
            self.cache.move_to_end(reference)
            return
        while len(self.cache) >= self.max_size:
            self._evict(next(iter(self.cache)))
        self.cache[reference] = (text, time.time(), book)
        self.book_counts[book] = self.book_counts.get(book, 0) + 1



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
