"""
Long-term memory — SQLite-backed persistent store.

Incidents are written here and survive across runs, giving the
decision layer historical context (e.g. "this IP attacked us 3 days ago").
"""

import sqlite3
import json
from memory.config import DB_PATH, RECALL_LIMIT
from memory.schema import Incident


_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS incidents (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   TEXT    NOT NULL,
    ip          TEXT    NOT NULL,
    attack_type TEXT    NOT NULL,
    mitre_id    TEXT    NOT NULL,
    mitre_tactic TEXT   NOT NULL,
    severity    TEXT    NOT NULL,
    summary     TEXT    NOT NULL,
    recommendation TEXT NOT NULL,
    cve         TEXT    NOT NULL   -- JSON array stored as string
);
"""

_CREATE_INDEX = """
CREATE INDEX IF NOT EXISTS idx_ip ON incidents (ip);
"""


class LongTermMemory:
    def __init__(self, db_path: str = DB_PATH):
        self._db_path = db_path
        self._init_db()

    def _connect(self):
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._connect() as conn:
            conn.execute(_CREATE_TABLE)
            conn.execute(_CREATE_INDEX)

    # ------------------------------------------------------------------

    def write(self, incident: Incident):
        sql = """
        INSERT INTO incidents
            (timestamp, ip, attack_type, mitre_id, mitre_tactic,
             severity, summary, recommendation, cve)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        with self._connect() as conn:
            conn.execute(sql, (
                incident.timestamp,
                incident.ip,
                incident.attack_type,
                incident.mitre_id,
                incident.mitre_tactic,
                incident.severity,
                incident.summary,
                incident.recommendation,
                json.dumps(incident.cve),
            ))

    def recall_recent(self, limit: int = RECALL_LIMIT) -> list[Incident]:
        """Fetch the N most recent incidents across all IPs."""
        sql = "SELECT * FROM incidents ORDER BY timestamp DESC LIMIT ?"
        with self._connect() as conn:
            rows = conn.execute(sql, (limit,)).fetchall()
        return [self._row_to_incident(r) for r in rows]

    def recall_by_ip(self, ip: str, limit: int = RECALL_LIMIT) -> list[Incident]:
        """Fetch past incidents for a specific IP."""
        sql = "SELECT * FROM incidents WHERE ip = ? ORDER BY timestamp DESC LIMIT ?"
        with self._connect() as conn:
            rows = conn.execute(sql, (ip, limit)).fetchall()
        return [self._row_to_incident(r) for r in rows]

    def recall_by_severity(self, severity: str, limit: int = RECALL_LIMIT) -> list[Incident]:
        sql = "SELECT * FROM incidents WHERE severity = ? ORDER BY timestamp DESC LIMIT ?"
        with self._connect() as conn:
            rows = conn.execute(sql, (severity, limit)).fetchall()
        return [self._row_to_incident(r) for r in rows]

    def count_by_ip(self, ip: str) -> int:
        """How many times has this IP appeared in past incidents?"""
        sql = "SELECT COUNT(*) FROM incidents WHERE ip = ?"
        with self._connect() as conn:
            return conn.execute(sql, (ip,)).fetchone()[0]

    # ------------------------------------------------------------------

    @staticmethod
    def _row_to_incident(row: sqlite3.Row) -> Incident:
        return Incident(
            timestamp     = row["timestamp"],
            ip            = row["ip"],
            attack_type   = row["attack_type"],
            mitre_id      = row["mitre_id"],
            mitre_tactic  = row["mitre_tactic"],
            severity      = row["severity"],
            summary       = row["summary"],
            recommendation= row["recommendation"],
            cve           = json.loads(row["cve"]),
        )
