import os
import json
import asyncio
import aiofiles
import logging
import time
from dataclasses import dataclass, field
from typing import Any

from config import settings

logger = logging.getLogger(__name__)

@dataclass
class Stats:
    submitted: int = 0
    succeeded: int = 0
    failed: int = 0
    started_at: float = field(default_factory=time.time)

    @property
    def elapsed(self) -> float:
        return time.time() - self.started_at

    def log_summary(self):
        logger.info(
            f"📊 Stats | Submitted: {self.submitted} | "
            f"Succeeded: {self.succeeded} | Failed: {self.failed} | "
            f"Elapsed: {self.elapsed:.2f}s"
        )

class CheckpointManager:
    """Handles atomic writes of completed jobs to prevent corruption."""
    def __init__(self):
        self.completed: set[str] = set()
        self.failed: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()
        self._writes_since_save = 0

    def load(self):
        if os.path.exists(settings.progress_file):
            try:
                with open(settings.progress_file, 'r', encoding='utf-8') as f:
                    self.completed = set(json.load(f))
            except json.JSONDecodeError:
                logger.warning("Progress file corrupted. Starting fresh.")
                self.completed = set()
                    
        if os.path.exists(settings.failed_file):
            try:
                with open(settings.failed_file, 'r', encoding='utf-8') as f:
                    self.failed = json.load(f)
            except json.JSONDecodeError:
                self.failed = {}

    async def mark_completed(self, job_id: str):
        async with self._lock:
            self.completed.add(job_id)
            self._writes_since_save += 1
            if self._writes_since_save >= settings.checkpoint_interval:
                await self._flush()
                self._writes_since_save = 0

    async def mark_failed(self, job_id: str, error: str):
        async with self._lock:
            self.failed[job_id] = {"error": error, "timestamp": time.time()}
            await self._flush_failed()

    async def _flush(self):
        """Atomic write to disk."""
        tmp_path = settings.progress_file + ".tmp"
        data = sorted(list(self.completed))
        
        async with aiofiles.open(tmp_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(data, indent=2))
            
        os.replace(tmp_path, settings.progress_file)  # Atomic on POSIX and Windows

    async def _flush_failed(self):
        tmp_path = settings.failed_file + ".tmp"
        async with aiofiles.open(tmp_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(self.failed, indent=2))
        os.replace(tmp_path, settings.failed_file)

    async def shutdown(self):
        async with self._lock:
            await self._flush()
            await self._flush_failed()

class JobTracker:
    """Appends scraped results to results.jsonl asynchronously."""
    def __init__(self):
        self._lock = asyncio.Lock()

    async def save_result(self, job_id: str, data: list[dict[str, Any]]):
        async with self._lock, aiofiles.open(settings.results_file, 'a', encoding='utf-8') as f:
            for lead in data:
                record = {"internal_id": job_id, **lead}
                await f.write(json.dumps(record, ensure_ascii=False) + "\n")
