"""
CybORG Bridge — Converts CybORG network simulation observations into
CyberSaviour pipeline events.

CybORG (gym==0.23.1) is incompatible with numpy>=2.0 which cyberSaviour
requires, so this module ships a built-in scenario simulator that mirrors
CybORG's three canonical scenarios (Scenario1, Scenario1b, Scenario2) and
produces identical event shapes.

If CybORG is ever made compatible, swap _run_simulated_scenario() for the
real CybORG calls — the rest of the adapter stays unchanged.
"""

import random
import uuid
from datetime import datetime, timezone
from ipaddress import IPv4Address

# ── Scenario definitions ─────────────────────────────────────────────────────

SCENARIOS = {
    "Scenario1": {
        "description": "Basic red-vs-blue: brute-force SSH login attempts on a private network.",
        "hosts": ["Attacker", "Defender", "Enterprise0", "User0"],
        "subnets": ["Attacker_Network", "Defender_Network", "Private_Network"],
        "red_actions": ["SSHLoginExploit", "DiscoverRemoteSystems", "PrivilegeEscalate"],
        "blue_actions": ["GetProcessList", "VelociraptorPoll", "RestoreFromBackup"],
        "difficulty": "easy",
        "steps": 20,
    },
    "Scenario1b": {
        "description": "Extended scenario: lateral movement across enterprise subnets after initial SSH compromise.",
        "hosts": ["Attacker", "Defender", "Enterprise0", "Enterprise1", "Enterprise2",
                  "User0", "User1", "User2", "Op_Server0"],
        "subnets": ["Attacker_Network", "Defender_Network", "Enterprise_Network",
                    "Op_Network", "User_Network"],
        "red_actions": ["SSHLoginExploit", "MS17_010_PSExec", "DiscoverNetworkServices",
                        "PrivilegeEscalate", "Impact"],
        "blue_actions": ["GetProcessList", "VelociraptorPoll", "RemoveOtherSessions",
                         "RestoreFromBackup", "GetFileInfo"],
        "difficulty": "normal",
        "steps": 30,
    },
    "Scenario2": {
        "description": "Advanced persistent threat: multi-stage attack with C2 beacon, data exfiltration, and ransomware.",
        "hosts": ["Attacker", "Defender", "Enterprise0", "Enterprise1", "Enterprise2",
                  "User0", "User1", "User2", "Op_Server0", "Op_Host0", "Op_Host1"],
        "subnets": ["Attacker_Network", "Defender_Network", "Enterprise_Network",
                    "Op_Network", "User_Network"],
        "red_actions": ["SSHLoginExploit", "MS17_010_PSExec", "DiscoverNetworkServices",
                        "PrivilegeEscalate", "Impact", "BlockTraffic", "FloodBandwidth"],
        "blue_actions": ["GetProcessList", "VelociraptorPoll", "RemoveOtherSessions",
                         "RestoreFromBackup", "GetFileInfo", "AllowTraffic"],
        "difficulty": "hard",
        "steps": 50,
    },
}

# ── Action → event_type mapping ───────────────────────────────────────────────

ACTION_EVENT_MAP = {
    "SSHLoginExploit":        ("failed_login",      "SSH brute-force exploit attempt"),
    "MS17_010_PSExec":        ("network_activity",  "MS17-010 EternalBlue exploit (PSExec)"),
    "DiscoverRemoteSystems":  ("recon_activity",    "Network reconnaissance — host discovery"),
    "DiscoverNetworkServices":("recon_activity",    "Port scan — service discovery"),
    "PrivilegeEscalate":      ("network_activity",  "Privilege escalation attempt"),
    "Impact":                 ("network_activity",  "Ransomware / data destruction impact"),
    "BlockTraffic":           ("network_activity",  "Attacker blocking defender traffic"),
    "FloodBandwidth":         ("network_activity",  "Bandwidth flood / DoS attempt"),
    "GetProcessList":         ("network_activity",  "Blue: process enumeration for IOC scan"),
    "VelociraptorPoll":       ("network_activity",  "Blue: Velociraptor EDR polling"),
    "RemoveOtherSessions":    ("network_activity",  "Blue: removing attacker sessions"),
    "RestoreFromBackup":      ("network_activity",  "Blue: restoring host from backup"),
    "GetFileInfo":            ("network_activity",  "Blue: collecting file integrity info"),
    "AllowTraffic":           ("network_activity",  "Blue: re-enabling blocked traffic"),
    "Sleep":                  ("network_activity",  "Agent idle / observation only"),
}

# ── IP generation ─────────────────────────────────────────────────────────────

SUBNET_RANGES = {
    "Attacker_Network":  "10.0.0.",
    "Defender_Network":  "10.0.1.",
    "Enterprise_Network":"192.168.1.",
    "Op_Network":        "192.168.2.",
    "User_Network":      "172.16.0.",
    "Private_Network":   "192.168.0.",
}

def _host_ip(host: str, subnets: list[str]) -> str:
    """Deterministically assign an IP to a host based on its index."""
    prefix = SUBNET_RANGES.get(subnets[0], "10.0.0.")
    idx = abs(hash(host)) % 254 + 1
    return f"{prefix}{idx}"


# ── Core simulator ────────────────────────────────────────────────────────────

def _run_simulated_scenario(scenario_name: str, num_steps: int) -> dict:
    """
    Run a simulated CybORG scenario and return a dict of raw events.

    Returns
    -------
    {
        "scenario": str,
        "steps_run": int,
        "events": [{"source_ip", "event_type", "raw", "protocol", "target_host",
                    "action", "step", "success"}],
        "compromised_hosts": [str],
        "ip_map": {host: ip},
    }
    """
    if scenario_name not in SCENARIOS:
        raise ValueError(f"Unknown scenario '{scenario_name}'. Available: {list(SCENARIOS)}")

    cfg = SCENARIOS[scenario_name]
    actual_steps = min(num_steps, cfg["steps"])
    rng = random.Random(42)  # reproducible

    # build ip_map
    ip_map = {h: _host_ip(h, cfg["subnets"]) for h in cfg["hosts"]}
    attacker_ip = ip_map.get("Attacker", "10.0.0.1")

    events: list[dict] = []
    compromised: set[str] = set()
    defender_detections = 0

    for step in range(actual_steps):
        # Red agent picks an action probabilistically
        red_action = rng.choice(cfg["red_actions"])
        event_type, raw_desc = ACTION_EVENT_MAP.get(
            red_action, ("network_activity", red_action)
        )

        # Pick a target host (not Attacker/Defender)
        candidates = [h for h in cfg["hosts"] if h not in ("Attacker", "Defender")]
        target_host = rng.choice(candidates) if candidates else "Enterprise0"
        target_ip = ip_map.get(target_host, "192.168.1.10")

        # Determine success: harder actions fail more often
        high_risk = red_action in ("MS17_010_PSExec", "PrivilegeEscalate", "Impact")
        success = rng.random() > (0.4 if high_risk else 0.2)

        if success and red_action not in ("DiscoverRemoteSystems", "DiscoverNetworkServices"):
            compromised.add(target_host)

        protocol = "TCP" if event_type in ("failed_login", "network_activity") else None

        events.append({
            "source_ip":   attacker_ip,
            "event_type":  event_type,
            "raw":         f"[CybORG:{scenario_name}] step={step+1} action={red_action} "
                           f"target={target_host}({target_ip}) success={success} — {raw_desc}",
            "protocol":    protocol,
            "target_host": target_host,
            "action":      red_action,
            "step":        step + 1,
            "success":     success,
        })

        # Blue agent occasionally detects and resets
        blue_action = rng.choice(cfg["blue_actions"])
        if blue_action in ("RemoveOtherSessions", "RestoreFromBackup"):
            if target_host in compromised:
                compromised.discard(target_host)
                defender_detections += 1

    return {
        "scenario":          scenario_name,
        "description":       cfg["description"],
        "difficulty":        cfg["difficulty"],
        "steps_run":         actual_steps,
        "events":            events,
        "compromised_hosts": sorted(compromised),
        "defender_detections": defender_detections,
        "ip_map":            ip_map,
    }


# ── Public API ────────────────────────────────────────────────────────────────

def run_cyborg_scenario(scenario_name: str, num_steps: int = 20) -> dict:
    """
    Run a CybORG scenario and return CyberSaviour-compatible pipeline events.

    Returns
    -------
    {
        "scenario": str,
        "description": str,
        "difficulty": str,
        "steps_run": int,
        "pipeline_events": [{"source_ip", "event_type", "raw", "protocol"}],
        "compromised_hosts": [str],
        "defender_detections": int,
        "ip_map": {host: ip},
        "summary": str,
    }
    """
    sim = _run_simulated_scenario(scenario_name, num_steps)

    # Strip CybORG-internal fields to produce clean pipeline events
    pipeline_events = [
        {
            "source_ip":  e["source_ip"],
            "event_type": e["event_type"],
            "raw":        e["raw"],
            "protocol":   e["protocol"],
        }
        for e in sim["events"]
    ]

    n_compromised  = len(sim["compromised_hosts"])
    n_total        = len(SCENARIOS[scenario_name]["hosts"])
    compromise_pct = int(n_compromised / n_total * 100) if n_total else 0

    summary = (
        f"CybORG {scenario_name} — {sim['steps_run']} steps simulated. "
        f"Hosts compromised: {n_compromised}/{n_total} ({compromise_pct}%). "
        f"Blue detections: {sim['defender_detections']}. "
        f"Events generated: {len(pipeline_events)}."
    )

    return {
        "scenario":            sim["scenario"],
        "description":         sim["description"],
        "difficulty":          sim["difficulty"],
        "steps_run":           sim["steps_run"],
        "pipeline_events":     pipeline_events,
        "compromised_hosts":   sim["compromised_hosts"],
        "defender_detections": sim["defender_detections"],
        "ip_map":              sim["ip_map"],
        "summary":             summary,
    }


def list_scenarios() -> list[dict]:
    """Return metadata for all available scenarios."""
    return [
        {
            "name":        name,
            "description": cfg["description"],
            "difficulty":  cfg["difficulty"],
            "max_steps":   cfg["steps"],
            "hosts":       len(cfg["hosts"]),
        }
        for name, cfg in SCENARIOS.items()
    ]
