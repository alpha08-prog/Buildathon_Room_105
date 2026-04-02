"""
Incident schema — the unit of storage for the memory layer.

Every agent output that reaches the memory layer is normalised
into this structure before being written to short-term or long-term memory.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone


@dataclass
class Incident:
    ip:          str
    attack_type: str
    mitre_id:    str
    mitre_tactic: str
    severity:    str
    summary:     str
    recommendation: str
    cve:         list = field(default_factory=list)
    timestamp:   str  = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self):
        return asdict(self)

    @staticmethod
    def from_dict(d: dict) -> "Incident":
        return Incident(
            ip            = d.get("ip", "unknown"),
            attack_type   = d.get("attack_type", "unknown"),
            mitre_id      = d.get("mitre_id", "T0000"),
            mitre_tactic  = d.get("mitre_tactic", "unknown"),
            severity      = d.get("severity", "low"),
            summary       = d.get("summary", ""),
            recommendation= d.get("recommendation", ""),
            cve           = d.get("cve", []),
            timestamp     = d.get("timestamp", datetime.now(timezone.utc).isoformat()),
        )
