import json
import logging
import re
import time
from typing import Dict

import requests


class ESVRateLimitError(Exception):
    """Raised when the ESV API rate limit is hit."""

    def __init__(self, wait_seconds: int):
        self.wait_seconds = wait_seconds
        super().__init__(f"ESV API rate limit. Try again in {wait_seconds} seconds")

logger = logging.getLogger(__name__)





class ESVService:
    """Simple wrapper around the ESV API"""

    BASE_URL = "https://api.esv.org/v3/passage/text/"

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
