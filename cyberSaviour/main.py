"""
Full pipeline:
  LogAgent → CorrelationAgent → ThreatAgent → MemoryLayer
  → DecisionLayer → HumanInLoop → ActionLayer
  → ReportAgent → ResponseAgent

Run from cyberSaviour/:
    python main.py
"""

import json
from agents.log_agent.agent import LogAgent
from agents.correlation_agent.agent import CorrelationAgent
from agents.threat_agent.agent import ThreatAgent
from agents.report_agent.agent import ReportAgent
from agents.response_agent.agent import ResponseAgent
from memory.layer import MemoryLayer
from pipeline.decision.layer import DecisionLayer
from pipeline.human_in_loop.handler import HumanInLoop
from pipeline.action.layer import ActionLayer

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
    return MemoryLayer().process(state)

def run_decision_layer(state):
    return DecisionLayer().process(state)

def run_human_in_loop(state):
    return HumanInLoop().process(state)

def run_action_layer(state):
    return ActionLayer().process(state)

def run_report_agent(state):
    return ReportAgent().process(state)

def run_response_agent(state):
    return ResponseAgent().process(state)

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
    print("CyberSaviour — Full Pipeline")
    print(f"  events fed in : {len(SAMPLE_EVENTS)}")

    state = build_initial_state(SAMPLE_EVENTS)

    # --- Stage 1: LogAgent ---
    print("\n[1/8] LogAgent ...")
    state = run_log_agent(state)
    pretty("LogAgent — alerts", state["alerts"])

    # --- Stage 2: CorrelationAgent ---
    print("\n[2/8] CorrelationAgent ...")
    state = run_correlation_agent(state)
    correlation = state["context"].get("correlation", {})
    pretty("Scored IPs", correlation.get("scored_ips", {}))
    pretty("Correlation Analysis", correlation.get("analysis", ""))

    # --- Stage 3: ThreatAgent ---
    print("\n[3/8] ThreatAgent ...")
    state = run_threat_agent(state)
    threat = state["context"].get("threat_intel", {})
    pretty("MITRE Anchor", threat.get("mitre_anchor", {}))
    pretty("Threat Intel (LLM)", threat.get("llm_enrichment", ""))

    # --- Stage 4: MemoryLayer ---
    print("\n[4/8] MemoryLayer ...")
    state = run_memory_layer(state)
    memory = state["context"].get("memory", {})
    pretty("Repeat Offenders", memory.get("repeat_offenders", {}))

    # --- Stage 5: DecisionLayer ---
    print("\n[5/8] DecisionLayer ...")
    state = run_decision_layer(state)
    pretty("Decision", state["context"].get("decision", {}))

    # --- Stage 6: HumanInLoop ---
    print("\n[6/8] HumanInLoop ...")
    state = run_human_in_loop(state)
    pretty("Human Review", state["context"].get("human_review", {}))

    # --- Stage 7: ActionLayer ---
    print("\n[7/8] ActionLayer ...")
    state = run_action_layer(state)
    pretty("Action Result", state["context"].get("action_result", {}))

    # --- Stage 8: ReportAgent + ResponseAgent ---
    print("\n[8/8] ReportAgent + ResponseAgent ...")
    state = run_report_agent(state)
    state = run_response_agent(state)

    response = state["context"].get("response", {})
    pretty("FINAL RESPONSE", {k: v for k, v in response.items() if k != "report"})
    pretty("INCIDENT REPORT", response.get("report", ""))
    pretty("Pipeline trace", response.get("pipeline_steps", []))
