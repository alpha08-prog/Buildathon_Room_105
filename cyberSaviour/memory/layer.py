"""
MemoryLayer — Body subclass that sits between ThreatAgent and DecisionLayer.

Responsibilities:
  1. Parse threat_intel from state["context"]["threat_intel"]
  2. Normalise it into Incident objects
  3. Write to ShortTermMemory (FIFO) + LongTermMemory (SQLite)
  4. Inject memory context into state for DecisionLayer
"""

import json
import re
from agents.god.body import Body
from memory.schema import Incident
from memory.short_term import ShortTermMemory
from memory.long_term import LongTermMemory
from memory.config import RECALL_LIMIT


class MemoryLayer(Body):
    def __init__(self):
        super().__init__("Memory_Layer")
        self.short_term = ShortTermMemory()
        self.long_term  = LongTermMemory()

    # ------------------------------------------------------------------
    # Parsing helpers
    # ------------------------------------------------------------------

    def _extract_json(self, text: str) -> dict:
        """Pull the first JSON object out of the LLM response string."""
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return {}

    def _parse_threat_intel(self, threat_intel: dict, scored_ips: dict) -> list[Incident]:
        """
        Convert threat_agent output → list of Incident objects.
        One incident per IP found in scored_ips, enriched with LLM fields.
        """
        llm_raw  = threat_intel.get("llm_enrichment", "")
        llm_data = self._extract_json(llm_raw) if isinstance(llm_raw, str) else {}
        anchor   = threat_intel.get("mitre_anchor", {})

        attack_type    = llm_data.get("attack_type",  anchor.get("technique", "unknown"))
        mitre_id       = llm_data.get("mitre_id",     anchor.get("id",        "T0000"))
        mitre_tactic   = llm_data.get("mitre_tactic", anchor.get("tactic",    "unknown"))
        severity       = llm_data.get("severity",     "low")
        impact         = llm_data.get("impact",       "")
        recommendation = llm_data.get("recommendation", "")
        cve            = llm_data.get("cve",          [])

        incidents = []
        for ip, ip_data in scored_ips.items():
            incidents.append(Incident(
                ip            = ip,
                attack_type   = attack_type,
                mitre_id      = mitre_id,
                mitre_tactic  = mitre_tactic,
                severity      = ip_data.get("severity", severity),
                summary       = (
                    f"{attack_type} from {ip} | "
                    f"score={ip_data.get('score',0)} | "
                    f"types={ip_data.get('types',{})} | "
                    f"impact: {impact}"
                ),
                recommendation = recommendation,
                cve            = cve,
            ))
        return incidents

    # ------------------------------------------------------------------

    def process(self, state: dict) -> dict:
        threat_intel = state.get("context", {}).get("threat_intel")

        if not threat_intel:
            return state

        scored_ips = threat_intel.get("scored_ips", {})
        incidents  = self._parse_threat_intel(threat_intel, scored_ips)

        for incident in incidents:
            self.short_term.write(incident)
            self.long_term.write(incident)

        # Build memory context for the DecisionLayer
        recent_short = [i.to_dict() for i in self.short_term.read_recent(RECALL_LIMIT)]
        recent_long  = [i.to_dict() for i in self.long_term.recall_recent(RECALL_LIMIT)]

        # Repeat-offender check — has any current IP been seen before?
        repeat_offenders = {
            ip: self.long_term.count_by_ip(ip)
            for ip in scored_ips
        }

        memory_context = {
            "session_incidents":    recent_short,
            "historical_incidents": recent_long,
            "repeat_offenders":     repeat_offenders,
            "total_stored":         len(incidents),
        }

        state["context"]["memory"] = memory_context
        state["history"].append({
            "agent":  self.name,
            "output": memory_context,
        })

        return state
