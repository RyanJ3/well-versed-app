from typing import List, Dict, Set
import asyncio
from collections import defaultdict
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class VerseTextBatcher:
    """Batches verse text requests to reduce API calls."""

    def __init__(self, api_service, batch_size: int = 50, wait_time_ms: int = 50):
        self.api_service = api_service
        self.batch_size = batch_size
        self.wait_time_ms = wait_time_ms
        self.pending_requests: Dict[str, List[asyncio.Future]] = defaultdict(list)
        self.processing = False
        self._cache: Dict[str, str] = {}
        self._cache_expiry: Dict[str, datetime] = {}
        self._cache_ttl = timedelta(hours=24)

    async def get_verse_texts(self, verse_codes: List[str], bible_id: str) -> Dict[str, str]:
        now = datetime.now()
        cached_results = {}
        uncached_codes = []
        for code in verse_codes:
            if code in self._cache and self._cache_expiry.get(code, now) > now:
                cached_results[code] = self._cache[code]
            else:
                uncached_codes.append(code)
        if not uncached_codes:
            return cached_results
        future = asyncio.Future()
        for code in uncached_codes:
            self.pending_requests[f"{bible_id}:{code}"].append(future)
        if not self.processing:
            asyncio.create_task(self._process_batch(bible_id))
        try:
            results = await asyncio.wait_for(future, timeout=5.0)
            expiry = now + self._cache_ttl
            for code, text in results.items():
                self._cache[code] = text
                self._cache_expiry[code] = expiry
            final_results = {**cached_results}
            for code in uncached_codes:
                if code in results:
                    final_results[code] = results[code]
            return final_results
        except asyncio.TimeoutError:
            logger.error("Timeout waiting for verse texts")
            return cached_results

    async def _process_batch(self, bible_id: str):
        self.processing = True
        try:
            await asyncio.sleep(self.wait_time_ms / 1000.0)
            all_requests = {}
            for key, futures in list(self.pending_requests.items()):
                if key.startswith(f"{bible_id}:"):
                    verse_code = key.split(":", 1)[1]
                    all_requests[verse_code] = futures
            if not all_requests:
                return
            for code in all_requests:
                del self.pending_requests[f"{bible_id}:{code}"]
            verse_codes = list(all_requests.keys())
            chunks = [verse_codes[i:i+self.batch_size] for i in range(0, len(verse_codes), self.batch_size)]
            all_results = {}
            for chunk in chunks:
                try:
                    chunk_results = self.api_service.get_verses_batch(chunk, bible_id)
                    all_results.update(chunk_results)
                except Exception as e:
                    logger.error(f"Error fetching verse chunk: {e}")
            for code, futures in all_requests.items():
                result = {code: all_results.get(code, "")}
                for future in futures:
                    if not future.done():
                        future.set_result(result)
        finally:
            self.processing = False
            if self.pending_requests:
                asyncio.create_task(self._process_batch(bible_id))

    def clear_cache(self):
        self._cache.clear()
        self._cache_expiry.clear()
