"""
Short-term memory — session-scoped FIFO queue.

Holds the N most recent incidents in memory so downstream agents
(decision layer, report agent) can access the current session's context
without hitting the database.
"""

from collections import deque
from memory.config import SHORT_TERM_SIZE
from memory.schema import Incident


class ShortTermMemory:
    def __init__(self, maxsize: int = SHORT_TERM_SIZE):
        self._queue: deque[Incident] = deque(maxlen=maxsize)

    def write(self, incident: Incident):
        self._queue.append(incident)

    def read_all(self) -> list[Incident]:
        """Return all incidents in chronological order."""
        return list(self._queue)

    def read_recent(self, n: int) -> list[Incident]:
        """Return the n most recent incidents."""
        items = list(self._queue)
        return items[-n:] if len(items) >= n else items

    def search_by_ip(self, ip: str) -> list[Incident]:
        return [i for i in self._queue if i.ip == ip]

    def search_by_severity(self, severity: str) -> list[Incident]:
        return [i for i in self._queue if i.severity == severity]

    def clear(self):
        self._queue.clear()

    def __len__(self):
        return len(self._queue)
