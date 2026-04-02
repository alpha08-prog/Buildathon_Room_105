"""
Pipeline test: LogAgent → CorrelationAgent → ThreatAgent → MemoryLayer

Run from cyberSaviour/:
    python main.py
"""

import json
from agents.logAgent.agent import LogAgent
from agents.correlation_agent.agent import CorrelationAgent
from agents.threat_agent.agent import ThreatAgent
from memory.layer import MemoryLayer

# ---------------------------------------------------------------------------
# Synthetic events that mimic what ingestion/parse.py produces
# ---------------------------------------------------------------------------
SAMPLE_EVENTS = [
    # brute-force from 192.168.1.5
    {"source_ip": "192.168.1.5", "event_type": "failed_login",
     "raw": "Failed password from 192.168.1.5", "protocol": None},
    {"source_ip": "192.168.1.5", "event_type": "failed_login",
     "raw": "Failed password from 192.168.1.5", "protocol": None},
    {"source_ip": "192.168.1.5", "event_type": "failed_login",
     "raw": "Failed password from 192.168.1.5", "protocol": None},
    # recon from 10.0.0.3
    {"source_ip": "10.0.0.3", "event_type": "recon_activity",
     "raw": "nmap scan detected from 10.0.0.3", "protocol": None},
    # SQL injection attempt from 192.168.1.1
    {"source_ip": "192.168.1.1", "event_type": "web_request",
     "raw": "GET /login?id=1' or 1=1--", "protocol": None},
    # TCP network activity from 192.168.1.5 (post brute-force)
    {"source_ip": "192.168.1.5", "event_type": "network_activity",
     "raw": "outbound connection from 192.168.1.5", "protocol": "TCP"},
]

# ---------------------------------------------------------------------------

def build_initial_state(events):
    return {
        "events":  events,
        "alerts":  [],
        "context": {},
        "history": [],
    }

def run_log_agent(state):
    agent = LogAgent()
    # LogAgent reads state["events"][-1], so feed one event at a time.
    # Keep original_events fixed — reassigning state would truncate it.
    original_events = state["events"]
    for i in range(len(original_events)):
        state["events"] = original_events[:i + 1]
        state = agent.process(state)
    state["events"] = original_events   # restore full list
    return state

def run_correlation_agent(state):
    agent = CorrelationAgent()
    return agent.process(state)

def run_threat_agent(state):
    agent = ThreatAgent()
    return agent.process(state)

def run_memory_layer(state):
    layer = MemoryLayer()
    return layer.process(state)

def pretty(label, data):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print('='*60)
    if isinstance(data, str):
        print(data)
    else:
        print(json.dumps(data, indent=2, default=str))

# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("CyberSaviour Pipeline Test")
    print(f"  events fed in : {len(SAMPLE_EVENTS)}")

    state = build_initial_state(SAMPLE_EVENTS)

    # --- Stage 1: LogAgent ---
    print("\n[1/3] Running LogAgent ...")
    state = run_log_agent(state)
    pretty("LogAgent — alerts generated", state["alerts"])

    # --- Stage 2: CorrelationAgent ---
    print("\n[2/3] Running CorrelationAgent ...")
    state = run_correlation_agent(state)

    correlation = state["context"].get("correlation", {})
    pretty("Scored IPs", correlation.get("scored_ips", {}))
    pretty("Event summary sent to LLM", correlation.get("summary", ""))
    pretty("Correlation Analysis", correlation.get("analysis", ""))

    # --- Stage 3: ThreatAgent ---
    print("\n[3/3] Running ThreatAgent ...")
    state = run_threat_agent(state)

    threat = state["context"].get("threat_intel", {})
    pretty("MITRE Anchor (rule-based)", threat.get("mitre_anchor", {}))
    pretty("Threat Intelligence (LLM enrichment)", threat.get("llm_enrichment", ""))

    # --- Stage 4: MemoryLayer ---
    print("\n[4/4] Running MemoryLayer ...")
    state = run_memory_layer(state)

    memory = state["context"].get("memory", {})
    pretty("Repeat Offenders (historical hit count)", memory.get("repeat_offenders", {}))
    pretty("Session Incidents (short-term)", memory.get("session_incidents", []))
    pretty("Historical Incidents (SQLite recall)", memory.get("historical_incidents", []))
