import requests
import logging
import re
from functools import lru_cache
from typing import Dict

logger = logging.getLogger(__name__)

class ESVService:
    """Simple wrapper around the ESV API"""

    BASE_URL = "https://api.esv.org/v3/passage/text/"

    def __init__(self, token: str):
        self.token = token
        self.headers = {"Authorization": f"Token {token}"}

    @lru_cache(maxsize=1000)
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
            response = requests.get(self.BASE_URL, params=params, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                passages = data.get("passages", [])
                if passages:
                    text = passages[0].strip()
                    text = re.sub(r"<[^>]+>", "", text).strip()
                    return text
                logger.error("No passages returned for %s", reference)
            else:
                logger.error("ESV API error %s: %s", response.status_code, response.text)
        except Exception as e:
            logger.error("Failed to fetch verse from ESV API: %s", e)
        return ""

    def get_verses_batch(self, references: Dict[str, str]) -> Dict[str, str]:
        results: Dict[str, str] = {}
        for code, ref in references.items():
            results[code] = self.get_verse_text(ref)
        return results
