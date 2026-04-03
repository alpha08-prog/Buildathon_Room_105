"""
Maps the CyberSaviour pipeline output to frontend-compatible data shapes.

Run from cyberSaviour/ so that agents/, pipeline/, memory/ are importable.
"""
import sys
import os
import uuid
from datetime import datetime, timezone

_CYBER_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _CYBER_ROOT not in sys.path:
    sys.path.insert(0, _CYBER_ROOT)

from agents.log_agent.agent import LogAgent
from agents.correlation_agent.agent import CorrelationAgent
from agents.threat_agent.agent import ThreatAgent
from agents.report_agent.agent import ReportAgent
from agents.response_agent.agent import ResponseAgent
from memory.layer import MemoryLayer
from pipeline.action.config import ACTION_DESCRIPTIONS
from pipeline.decision.layer import DecisionLayer
from pipeline.human_in_loop.handler import HumanInLoop
from pipeline.action.layer import ActionLayer


_ALERT_TYPE_MAP = {
    "failed_login":     ("Failed Login Attempt",        "high"),
    "sql_injection":    ("SQL Injection Detected",      "critical"),
    "recon_activity":   ("Recon / Port Scan Detected",  "medium"),
    "network_activity": ("Suspicious Network Activity", "low"),
}

_AGENT_ORDER = [
    "Log_Agent", "Correlation_Agent", "Threat_Agent", "Memory_Layer",
    "Decision_Layer", "Human_In_Loop", "Action_Layer", "Report_Agent", "Response_Agent",
]
_AGENT_TYPES  = {
    "Log_Agent": "Analysis", "Correlation_Agent": "Correlation",
    "Threat_Agent": "Intelligence", "Memory_Layer": "Memory",
    "Decision_Layer": "Decision", "Human_In_Loop": "Review",
    "Action_Layer": "Action", "Report_Agent": "Reporting", "Response_Agent": "Response",
}
_AGENT_ICONS  = {
    "Log_Agent": "FileSearch", "Correlation_Agent": "Network",
    "Threat_Agent": "Shield", "Memory_Layer": "Database",
    "Decision_Layer": "Brain", "Human_In_Loop": "User",
    "Action_Layer": "Zap", "Report_Agent": "FileText", "Response_Agent": "ShieldCheck",
}
_BASE_CONFIDENCE = {
    "Log_Agent": 92, "Correlation_Agent": 87, "Threat_Agent": 91, "Memory_Layer": 95,
    "Decision_Layer": 88, "Human_In_Loop": 100, "Action_Layer": 96,
    "Report_Agent": 85, "Response_Agent": 93,
}
_HIGH_RISK = {"quarantine", "block", "isolate"}
_MED_RISK  = {"throttle", "alert_security", "escalate"}

# ── MITRE tactic → mission phase ──────────────────────────────────────────────
_TACTIC_TO_PHASE = {
    "initial-access":    "Initial Access",
    "discovery":         "Discovery",
    "lateral-movement":  "Lateral Movement",
    "credential-access": "Lateral Movement",
    "exfiltration":      "Containment",
    "impact":            "Containment",
    "execution":         "Initial Access",
    "persistence":       "Discovery",
    "defense-evasion":   "Discovery",
    "command-and-control": "Lateral Movement",
    "collection":        "Containment",
}

_PHASE_ORDER = [
    "Initial Access", "Discovery", "Lateral Movement", "Containment", "Recovery",
]


def _build_pending_action_result(decision: dict) -> dict:
    action = decision.get("action", "log")
    return {
        "action": action,
        "description": ACTION_DESCRIPTIONS.get(action, "Awaiting analyst approval"),
        "priority": decision.get("priority", "low"),
        "ips_acted_on": decision.get("ips_to_act_on", []),
        "executed": [],
        "reasoning": decision.get("reasoning", ""),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "pending_human_review",
    }


def _dedupe_key(parts: list[str]) -> str:
    return "|".join(part for part in parts if part)


def _stable_id(prefix: str, key: str) -> str:
    return f"{prefix}-{uuid.uuid5(uuid.NAMESPACE_URL, key).hex[:8].upper()}"


def run_pipeline(events: list) -> dict:
    """Run the full CyberSaviour pipeline and return frontend-shaped data."""
    state = {"events": events, "alerts": [], "context": {}, "history": []}

    log_agent = LogAgent()
    original = state["events"]
    for i in range(len(original)):
        state["events"] = original[: i + 1]
        state = log_agent.process(state)
    state["events"] = original

    state = CorrelationAgent().process(state)
    state = ThreatAgent().process(state)
    state = MemoryLayer().process(state)
    state = DecisionLayer().process(state)
    decision = state.get("context", {}).get("decision", {})

    if decision.get("requires_human"):
        review = {
            "approved": False,
            "action": decision.get("action"),
            "modified": False,
            "note": "awaiting frontend approval",
            "pending": True,
        }
        state["context"]["human_review"] = review
        state["context"]["action_result"] = _build_pending_action_result(decision)
        state["history"].append({"agent": "Human_In_Loop", "output": review})
    else:
        state = HumanInLoop().process(state)
        state = ActionLayer().process(state)
    state = ReportAgent().process(state)
    state = ResponseAgent().process(state)

    return _shape(state, events)


# ── Mapping helpers ───────────────────────────────────────────────────────────

def _map_priority(priority: str) -> str:
    p = (priority or "").upper()
    return {"CRITICAL": "critical", "HIGH": "high", "MEDIUM": "medium"}.get(p, "low")

def _action_risk(action: str) -> str:
    if action in _HIGH_RISK: return "high"
    if action in _MED_RISK:  return "medium"
    return "low"

def _tactic_to_phase(tactic: str) -> str:
    key = (tactic or "").lower().replace(" ", "-")
    return _TACTIC_TO_PHASE.get(key, "Initial Access")


def _shape(state: dict, raw_events: list) -> dict:
    now           = datetime.now(timezone.utc).isoformat()
    ctx           = state.get("context", {})
    response      = ctx.get("response", {})
    action_result = ctx.get("action_result", {})
    decision      = ctx.get("decision", {})
    threat_intel  = ctx.get("threat_intel", {})
    memory_ctx    = ctx.get("memory", {})
    correlation   = ctx.get("correlation", {})

    priority  = response.get("priority") or decision.get("priority", "low")
    mitre     = response.get("mitre") or threat_intel.get("mitre_anchor", {})
    attack    = mitre.get("technique", "Unknown Attack")
    tactic    = mitre.get("tactic", "Unknown Tactic")
    mitre_id  = mitre.get("id", "T0000")
    src_ips   = sorted({e.get("source_ip") for e in raw_events if e.get("source_ip")})
    inc_id    = f"INC-{uuid.uuid4().hex[:6].upper()}"
    action_key = (action_result.get("action") or decision.get("action") or "log").lower()
    incident_key = _dedupe_key([mitre_id, tactic.lower(), priority.lower(), ",".join(src_ips)])

    # ── Alerts ────────────────────────────────────────────────────────────────
    alerts = []
    for msg in state.get("alerts", []):
        content = msg.get("message", {}) if isinstance(msg, dict) else {}
        if not isinstance(content, dict):
            continue
        atype = content.get("type", "")
        ip    = content.get("ip", "unknown")
        if atype not in _ALERT_TYPE_MAP:
            continue
        title, severity = _ALERT_TYPE_MAP[atype]
        alerts.append({
            "id":          f"ALT-{uuid.uuid4().hex[:8].upper()}",
            "title":       title,
            "severity":    severity,
            "source":      ip,
            "timestamp":   now,
            "status":      "new",
            "description": f"{title} from {ip}",
        })

    # ── Incident ──────────────────────────────────────────────────────────────
    inc_status = "investigating" if action_result.get("status") == "success" else "open"
    # Use canonical steps (built below) — build incident events from _AGENT_ORDER
    # to avoid duplicates. We derive ran_agents here for the incident events.
    _ran_for_events = {h["agent"] for h in state.get("history", [])}
    _steps_for_events: list[str] = []
    _seen_ev: set[str] = set()
    for _n in _AGENT_ORDER:
        if _n in _ran_for_events or _n == "Response_Agent" or (
            _n == "Action_Layer" and decision.get("requires_human")
        ):
            if _n not in _seen_ev:
                _seen_ev.add(_n)
                _steps_for_events.append(_n)
    inc_events = [
        {
            "id":          f"E-{uuid.uuid4().hex[:6]}",
            "timestamp":   now,
            "type":        step,
            "description": f"{step.replace('_', ' ')} completed",
            "source":      "Pipeline",
        }
        for step in _steps_for_events
    ]
    incident = {
        "id":              inc_id,
        "dedupeKey":       incident_key,
        "title":           f"{attack} — Priority {priority.upper()}",
        "severity":        _map_priority(priority),
        "status":          inc_status,
        "assignedAgent":   "Correlation Agent",
        "createdAt":       now,
        "updatedAt":       now,
        "attackType":      f"{tactic} ({mitre_id})",
        "affectedSystems": src_ips,
        "summary":         response.get("report", "No report generated."),
        "events":          inc_events,
    }

    # ── Agents ────────────────────────────────────────────────────────────────
    ran = {h["agent"] for h in state.get("history", [])}
    agents = [
        {
            "id":         f"agent-{i + 1}",
            "name":       name.replace("_", " "),
            "type":       _AGENT_TYPES.get(name, "Unknown"),
            "status":     "active" if name in ran else "idle",
            "confidence": _BASE_CONFIDENCE.get(name, 80),
            "lastAction": _last_action(name, state),
            "reasoning":  _reasoning(name, state),
            "icon":       _AGENT_ICONS.get(name, "Circle"),
        }
        for i, name in enumerate(_AGENT_ORDER)
    ]

    # ── Response actions ──────────────────────────────────────────────────────
    action = action_result.get("action", "")
    # ── Canonical pipeline steps: ordered, deduplicated, always complete ─────
    ran_agents = {h["agent"] for h in state.get("history", [])}
    # Response_Agent always runs last; Action_Layer shown even when pending
    canonical_steps = [
        name for name in _AGENT_ORDER
        if name in ran_agents
        or name == "Response_Agent"
        or (name == "Action_Layer" and decision.get("requires_human"))
    ]
    # Remove duplicates while preserving order (Log_Agent loop fix)
    seen: set[str] = set()
    pipeline_steps: list[str] = []
    for s in canonical_steps:
        if s not in seen:
            seen.add(s)
            pipeline_steps.append(s)

    response_payload = {
        "id":                    f"RESP-{uuid.uuid4().hex[:8].upper()}",
        "incidentId":            inc_id,
        "dedupeKey":             incident_key,
        "priority":              _map_priority(priority),
        "actionTaken":           response.get("action_taken", action or "none"),
        "actionStatus":          response.get("action_status", action_result.get("status", "unknown")),
        "ipsActedOn":            response.get("ips_acted_on", action_result.get("ips_acted_on", [])),
        "report":                response.get("report", "No report generated."),
        "timestamp":             response.get("timestamp", now),
        "pipelineSteps":         pipeline_steps,
        "requiresHumanApproval": bool(decision.get("requires_human")),
    }
    response_actions = []
    pending_action_contexts = {}

    if action and action != "rejected" and action_result.get("executed"):
        for ex in action_result.get("executed", []):
            action_identity = _dedupe_key([incident_key, action_key, ex.get("ip", "unknown")])
            response_actions.append({
                "id":                    _stable_id("RA", action_identity),
                "dedupeKey":             action_identity,
                "action":                action.replace("_", " ").title(),
                "target":                ex.get("ip", "unknown"),
                "riskLevel":             _action_risk(action),
                "explanation":           ex.get("detail", ""),
                "status":                "executed" if ex.get("status") == "executed" else "pending",
                "suggestedBy":           "Response Agent",
                "incidentId":            inc_id,
                "actionStatus":          action_result.get("status", "unknown"),
                "pipelineSteps":         pipeline_steps,
                "priority":              _map_priority(priority),
                "report":                response.get("report", "No report generated."),
                "requiresHumanApproval": False,
                "timestamp":             response.get("timestamp", now),
            })
    elif action and action != "rejected" and decision.get("requires_human"):
        targets = decision.get("ips_to_act_on") or src_ips or ["unknown"]
        for target in targets:
            action_identity = _dedupe_key([incident_key, action_key, target])
            action_id = _stable_id("RA", action_identity)
            response_actions.append({
                "id":                    action_id,
                "dedupeKey":             action_identity,
                "action":                action.replace("_", " ").title(),
                "target":                target,
                "riskLevel":             _action_risk(action),
                "explanation":           decision.get("reasoning", "Awaiting analyst approval"),
                "status":                "pending",
                "suggestedBy":           "Response Agent",
                "incidentId":            inc_id,
                "actionStatus":          "pending_human_review",
                "pipelineSteps":         pipeline_steps,
                "priority":              _map_priority(priority),
                "report":                response.get("report", "No report generated."),
                "requiresHumanApproval": True,
                "timestamp":             response.get("timestamp", now),
            })
            pending_action_contexts[action_id] = {
                "action": action,
                "incident_id": inc_id,
                "priority": priority,
                "reasoning": decision.get("reasoning", ""),
                "report": response.get("report", "No report generated."),
                "response_id": response_payload["id"],
                "target_ip": target,
                "pipeline_steps": response.get("pipeline_steps", []),
            }

    # ── Memory entries — from REAL long-term SQLite history ───────────────────
    memory_entries = _map_memory_entries(memory_ctx, attack)

    # ── Mission — created when pipeline needs human review ────────────────────
    mission = None
    if decision.get("requires_human"):
        mission = _build_mission(
            inc_id, incident["title"], tactic, priority,
            decision, action_result, src_ips, now
        )
        mission["dedupeKey"] = incident_key

    return {
        "alerts":           alerts,
        "incident":         incident,
        "agents":           agents,
        "response":         response_payload,
        "response_actions": response_actions,
        "memory_entries":   memory_entries,
        "mission":          mission,          # None if no human review needed
        "raw_response":     response,
        "_pending_action_contexts": pending_action_contexts,
        # Internal context passed to GameStore.apply_pipeline_result()
        "_memory_ctx":      memory_ctx,
        "_threat_ctx":      threat_intel,
        "_decision_ctx":    decision,
    }


# ── Real memory entry mapper ──────────────────────────────────────────────────

def _map_memory_entries(memory_ctx: dict, current_attack: str) -> list:
    """
    Build MemoryEntry list from the pipeline's real historical_incidents
    (SQLite long-term memory) plus repeat-offender data.
    """
    entries = []
    repeat_offenders = memory_ctx.get("repeat_offenders", {})

    for incident in memory_ctx.get("historical_incidents", []):
        ip           = incident.get("ip", "unknown")
        attack_type  = incident.get("attack_type", "Unknown")
        mitre_id     = incident.get("mitre_id", "T0000")
        mitre_tactic = incident.get("mitre_tactic", "unknown")
        severity     = incident.get("severity", "low")
        recommendation = incident.get("recommendation", "No recommendation")
        timestamp    = incident.get("timestamp", "")[:10]
        cve          = incident.get("cve", [])
        repeat_count = repeat_offenders.get(ip, 1)

        # Similarity score: higher for repeat offenders and matching attack type
        same_type = 1.0 if attack_type.lower() == current_attack.lower() else 0.6
        similarity = min(0.99, same_type * (0.5 + min(repeat_count, 5) * 0.09))

        tags = [
            attack_type.lower().replace(" ", "-"),
            mitre_tactic.lower().replace(" ", "-"),
            severity,
        ]
        if cve:
            tags.append("cve")
        if repeat_count > 1:
            tags.append("repeat-offender")

        entries.append({
            "id":             f"MEM-{uuid.uuid4().hex[:8].upper()}",
            "incidentTitle":  f"{attack_type} from {ip}",
            "date":           timestamp,
            "similarity":     round(similarity, 2),
            "attackType":     attack_type,
            "resolution":     recommendation,
            "tags":           tags,
        })

    return entries


# ── Mission builder ───────────────────────────────────────────────────────────

def _build_mission(
    inc_id: str, title: str, tactic: str, priority: str,
    decision: dict, action_result: dict, src_ips: list, now: str
) -> dict:
    """
    Build a Mission when the pipeline's DecisionLayer set requires_human=True.
    Phase, difficulty, objectives, and boss-fight flag all come from real data.
    """
    phase      = _tactic_to_phase(tactic)
    is_critical = priority.lower() == "critical"
    is_boss     = is_critical and bool(decision.get("ips_to_act_on"))

    difficulty_map = {"critical": "nightmare", "high": "hard", "medium": "normal", "low": "easy"}
    difficulty     = difficulty_map.get(priority.lower(), "normal")
    xp_reward      = {"critical": 750, "high": 350, "medium": 200, "low": 100}.get(priority.lower(), 200)

    action   = decision.get("action", "log")
    ips      = decision.get("ips_to_act_on", src_ips)
    reasoning= decision.get("reasoning", "Threat detected — manual review required.")

    # One objective per IP to act on, plus one for the recommended action
    objectives = []
    for ip in ips[:3]:
        objectives.append({
            "id":          f"OBJ-{uuid.uuid4().hex[:6]}",
            "description": f"Investigate and {action} traffic from {ip}",
            "completed":   action_result.get("status") == "success",
            "xpBonus":     int(xp_reward * 0.3),
        })
    objectives.append({
        "id":          f"OBJ-{uuid.uuid4().hex[:6]}",
        "description": f"Execute recommended action: {action.upper()}",
        "completed":   action_result.get("status") == "success",
        "xpBonus":     int(xp_reward * 0.4),
    })

    phase_idx = _PHASE_ORDER.index(phase) if phase in _PHASE_ORDER else 0
    phase_progress = min(90, 20 + phase_idx * 15)

    return {
        "id":            f"MISS-{uuid.uuid4().hex[:6].upper()}",
        "incidentId":    inc_id,
        "title":         f"{'⚔ BOSS: ' if is_boss else ''}{title}",
        "description":   reasoning[:200],
        "phase":         phase,
        "phaseProgress": phase_progress,
        "difficulty":    difficulty,
        "xpReward":      xp_reward,
        "bossFight":     is_boss,
        "status":        "active",
        "objectives":    objectives,
        "squadVoiceLine": _squad_voice(tactic, priority),
    }


def _squad_voice(tactic: str, priority: str) -> str:
    lines = {
        "initial-access":    "They're in. Find the entry point before they go deeper.",
        "discovery":         "The adversary is mapping our network — watch every probe.",
        "lateral-movement":  "They're moving. Cut the path before they reach critical assets.",
        "credential-access": "Credentials are at risk. Rotate and isolate immediately.",
        "exfiltration":      "Data is leaving the building. Block every egress point.",
        "impact":            "They're causing damage. Contain now — recovery later.",
    }
    key = (tactic or "").lower().replace(" ", "-")
    base = lines.get(key, f"Priority {priority.upper()} threat detected. Respond immediately.")
    return base


# ── Per-agent detail helpers ──────────────────────────────────────────────────

def _last_action(name: str, state: dict) -> str:
    for h in reversed(state.get("history", [])):
        if h.get("agent") == name:
            out = h.get("output", {})
            if isinstance(out, dict):
                if "alerts_generated" in out:
                    return f"Generated {len(out['alerts_generated'])} alert(s)"
                if "action" in out:
                    return f"Executed: {out['action']}"
            return str(out)[:80]
    return "Idle"


def _reasoning(name: str, state: dict) -> list:
    ctx = state.get("context", {})
    if name == "Log_Agent":
        msgs = [a for a in state.get("alerts", [])
                if isinstance(a, dict) and a.get("agent") == name]
        return [f"Detected {m['message'].get('type','')} from {m['message'].get('ip','')}"
                for m in msgs[:5]] or ["Processed log events"]
    if name == "Correlation_Agent":
        scored = ctx.get("correlation", {}).get("scored_ips", {})
        return [f"{ip}: score={d.get('score')}, severity={d.get('severity')}"
                for ip, d in scored.items()] or ["No correlations"]
    if name == "Threat_Agent":
        m = ctx.get("threat_intel", {}).get("mitre_anchor", {})
        return [f"MITRE: {m.get('tactic','?')} / {m.get('technique','?')} ({m.get('id','?')})"]
    if name == "Decision_Layer":
        d = ctx.get("decision", {})
        return [
            f"Priority: {d.get('priority','?')}",
            f"Action: {d.get('action','?')}",
            f"Human required: {d.get('requires_human', False)}",
            (d.get("reasoning", "") or "")[:120],
        ]
    if name == "Memory_Layer":
        mem = ctx.get("memory", {})
        repeat = mem.get("repeat_offenders", {})
        historical = len(mem.get("historical_incidents", []))
        lines = [f"Historical incidents recalled: {historical}"]
        for ip, count in repeat.items():
            lines.append(f"Repeat offender: {ip} ({count}×)")
        return lines or ["No memory context"]
    return ["Processing complete"]
