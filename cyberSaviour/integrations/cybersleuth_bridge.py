"""
Cybersleuth Forensic Bridge — Analyses PCAP files from the CFA benchmark
and produces CyberSaviour-compatible forensic results.

How it works:
  1. Scapy extracts network metadata from the PCAP (IPs, ports, protocols,
     flow sizes, packet counts, timing).
  2. CVE/service metadata is looked up from the CFA benchmark data.json.
  3. Gemini LLM enriches the findings with a forensic narrative (falls back
     to a rule-based report if the quota is exhausted).
  4. Results are shaped into CyberSaviour incidents, alerts, and missions.

No tshark, no langgraph, no OpenAI key required.
"""

import json
import os
import uuid
import warnings
from datetime import datetime, timezone
from pathlib import Path

warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────────────────────

_ROOT   = Path(__file__).resolve().parents[2]   # repo root
_SLEUTH = _ROOT / "Cybersleuth_Forensic_Agent"
_CFA    = _SLEUTH / "data" / "CFA-benchmark"
_TEST   = _SLEUTH / "data" / "TestSet_benchmark"

# ── CVE severity knowledge base ───────────────────────────────────────────────

CVE_SEVERITY: dict[str, str] = {
    "CVE-2021-44228": "critical",   # Log4Shell
    "CVE-2022-24706": "critical",   # CouchDB RCE
    "CVE-2024-23897": "critical",   # Jenkins arbitrary read
    "CVE-2021-43798": "high",       # Grafana path traversal
    "CVE-2021-41773": "critical",   # Apache path traversal RCE
    "CVE-2021-42013": "critical",   # Apache RCE
    "CVE-2023-23752": "high",       # Joomla info disclosure
    "CVE-2016-5734":  "critical",   # phpMyAdmin RCE
    "CVE-2018-12613": "critical",   # phpMyAdmin LFI
    "CVE-2022-46169": "critical",   # Cacti RCE
    "CVE-2020-11981": "critical",   # Airflow RCE
    "CVE-2020-11651": "critical",   # SaltStack auth bypass
    "CVE-2021-45232": "critical",   # APISIX dashboard bypass
    "CVE-2017-15709": "medium",     # ActiveMQ info disclosure
    "CVE-2021-22205": "critical",   # GitLab RCE
    "CVE-2025-32433": "critical",   # Erlang/OTP SSH
    "CVE-2025-29927": "critical",   # Next.js middleware
    "CVE-2024-53677": "critical",   # Struts file upload
    "CVE-2025-30066": "critical",   # GitHub Actions supply chain
}

CVE_DESCRIPTION: dict[str, str] = {
    "CVE-2021-44228": "Apache Log4j2 JNDI injection — remote code execution via crafted log messages.",
    "CVE-2022-24706": "CouchDB cluster HTTP API exposed without auth — RCE via Erlang cookie.",
    "CVE-2024-23897": "Jenkins CLI arbitrary file read enabling credential/key extraction.",
    "CVE-2021-43798": "Grafana path traversal allowing unauthenticated access to arbitrary files.",
    "CVE-2021-41773": "Apache HTTP Server path traversal and RCE via mod_cgi on affected configs.",
    "CVE-2021-42013": "Apache HTTP Server RCE extension of CVE-2021-41773 after initial patch.",
    "CVE-2023-23752": "Joomla improper access check exposing database credentials via REST API.",
    "CVE-2016-5734": "phpMyAdmin remote code execution through crafted table name in SELECT.",
    "CVE-2018-12613": "phpMyAdmin local file inclusion via bb parameter on index.php.",
    "CVE-2022-46169": "Cacti unauthenticated command injection in pollers via HTTP header.",
    "CVE-2020-11981": "Apache Airflow command injection via Celery executor configuration.",
    "CVE-2020-11651": "SaltStack authentication bypass allowing arbitrary command execution as root.",
    "CVE-2021-45232": "Apache APISIX dashboard default token bypassing authentication.",
    "CVE-2017-15709": "ActiveMQ OpenWire protocol header exposes broker internal info.",
    "CVE-2021-22205": "GitLab CE/EE unauthenticated RCE via ExifTool image parsing.",
    "CVE-2025-32433": "Erlang/OTP SSH pre-auth RCE via crafted SSH message before authentication.",
    "CVE-2025-29927": "Next.js middleware bypass via x-middleware-subrequest header.",
    "CVE-2024-53677": "Apache Struts file upload path traversal leading to RCE.",
    "CVE-2025-30066": "tj-actions/changed-files GitHub Action supply chain compromise.",
}

# ── Load benchmark metadata ───────────────────────────────────────────────────

def _load_tasks(benchmark: str = "CFA") -> list[dict]:
    base = _CFA if benchmark == "CFA" else _TEST
    data_file = base / "tasks" / "data.json"
    if not data_file.exists():
        return []
    raw = json.loads(data_file.read_text(encoding="utf-8"))
    return raw.get("tasks", raw) if isinstance(raw, dict) else raw


def list_events(benchmark: str = "CFA") -> list[dict]:
    """Return all available forensic events with their metadata."""
    tasks = _load_tasks(benchmark)
    base  = _CFA if benchmark == "CFA" else _TEST
    result = []
    for t in tasks:
        eid      = str(t.get("event", t.get("event_id", "0")))
        raw_dir  = base / "raw" / f"eventID_{eid}"
        pcaps    = list(raw_dir.glob("*.pcap")) if raw_dir.exists() else []
        result.append({
            "event_id":  eid,
            "cve":       t.get("cve", "unknown"),
            "service":   t.get("service", "unknown"),
            "success":   t.get("success", False),
            "vulnerable": t.get("vulnerable", False),
            "severity":  CVE_SEVERITY.get(t.get("cve", ""), "high"),
            "pcap_available": bool(pcaps),
            "pcap_name": pcaps[0].name if pcaps else None,
            "benchmark": benchmark,
        })
    return result


# ── PCAP analysis via Scapy ───────────────────────────────────────────────────

def _analyse_pcap(pcap_path: Path) -> dict:
    """Extract network metadata from a PCAP using scapy."""
    try:
        from scapy.all import rdpcap, IP, TCP, UDP, Raw
    except ImportError:
        return {"error": "scapy not installed"}

    try:
        pkts = rdpcap(str(pcap_path))
    except Exception as e:
        return {"error": f"PCAP read failed: {e}"}

    src_ips: dict[str, int]   = {}
    dst_ips: dict[str, int]   = {}
    dst_ports: dict[int, int] = {}
    protocols: set[str]       = set()
    flows: dict[tuple, int]   = {}
    first_ts = last_ts = None
    payload_bytes = 0
    suspicious_payloads: list[str] = []

    for pkt in pkts:
        ts = float(pkt.time)
        if first_ts is None:
            first_ts = ts
        last_ts = ts

        if IP not in pkt:
            continue
        src = pkt[IP].src
        dst = pkt[IP].dst
        src_ips[src] = src_ips.get(src, 0) + 1
        dst_ips[dst] = dst_ips.get(dst, 0) + 1

        if TCP in pkt:
            protocols.add("TCP")
            sport = pkt[TCP].sport
            dport = pkt[TCP].dport
            dst_ports[dport] = dst_ports.get(dport, 0) + 1
            flow_key = (src, dst, dport)
            flows[flow_key] = flows.get(flow_key, 0) + 1
            if Raw in pkt:
                raw = bytes(pkt[Raw].load)
                payload_bytes += len(raw)
                # Hunt for suspicious patterns in payload
                decoded = raw.decode("utf-8", errors="ignore").lower()
                if any(p in decoded for p in ("jndi:", "ldap://", "passwd", "shadow",
                                               "/etc/", "cmd.exe", "powershell",
                                               "${", "eval(", "exec(")):
                    snippet = decoded[:120].replace("\n", " ")
                    if snippet not in suspicious_payloads:
                        suspicious_payloads.append(snippet)
        elif UDP in pkt:
            protocols.add("UDP")

    # Attacker heuristic: highest src packet count that isn't the top dst
    top_src_by_pkts = sorted(src_ips.items(), key=lambda x: x[1], reverse=True)
    top_dst_by_pkts = sorted(dst_ips.items(), key=lambda x: x[1], reverse=True)
    attacker_ip = top_src_by_pkts[0][0] if top_src_by_pkts else "unknown"
    victim_ip   = top_dst_by_pkts[0][0] if top_dst_by_pkts else "unknown"
    top_ports   = sorted(dst_ports.items(), key=lambda x: x[1], reverse=True)[:5]
    duration_s  = round(last_ts - first_ts, 2) if first_ts and last_ts else 0

    return {
        "packet_count":       len(pkts),
        "duration_seconds":   duration_s,
        "unique_src_ips":     len(src_ips),
        "unique_dst_ips":     len(dst_ips),
        "attacker_ip":        attacker_ip,
        "victim_ip":          victim_ip,
        "protocols":          sorted(protocols),
        "top_dst_ports":      [{"port": p, "count": c} for p, c in top_ports],
        "total_flows":        len(flows),
        "payload_bytes":      payload_bytes,
        "suspicious_snippets": suspicious_payloads[:3],
    }


# ── LLM enrichment ────────────────────────────────────────────────────────────

def _llm_forensic_report(pcap_stats: dict, cve: str, service: str,
                          severity: str, success: bool) -> str:
    """Ask Gemini to generate a forensic narrative. Falls back gracefully."""
    try:
        import sys
        sys.path.insert(0, str(_ROOT / "cyberSaviour"))
        from agents.god.llm import deployLLM

        prompt = f"""You are a senior forensic analyst. Analyse this PCAP evidence and write a
concise forensic report (max 250 words).

CVE        : {cve}
Service    : {service}
Severity   : {severity}
Attack succeeded: {success}

PCAP Statistics:
- Packets captured: {pcap_stats.get('packet_count', 'N/A')}
- Duration: {pcap_stats.get('duration_seconds', 'N/A')} seconds
- Attacker IP: {pcap_stats.get('attacker_ip', 'N/A')}
- Victim IP: {pcap_stats.get('victim_ip', 'N/A')}
- Protocols: {', '.join(pcap_stats.get('protocols', []))}
- Top destination ports: {pcap_stats.get('top_dst_ports', [])}
- Suspicious payload snippets found: {len(pcap_stats.get('suspicious_snippets', []))}

Include: attack technique, indicators of compromise, recommended remediation."""

        return deployLLM("gemini-1.5-flash", prompt)

    except Exception:
        # Rule-based fallback
        snippets = pcap_stats.get("suspicious_snippets", [])
        desc     = CVE_DESCRIPTION.get(cve, f"Exploitation of {service} via {cve}.")
        ports    = [str(p["port"]) for p in pcap_stats.get("top_dst_ports", [])]
        return (
            f"FORENSIC REPORT — {cve} ({service.upper()})\n"
            f"{'='*50}\n"
            f"Severity   : {severity.upper()}\n"
            f"Vulnerability: {desc}\n"
            f"Attacker IP: {pcap_stats.get('attacker_ip', 'N/A')}\n"
            f"Victim IP  : {pcap_stats.get('victim_ip', 'N/A')}\n"
            f"Packets    : {pcap_stats.get('packet_count', 'N/A')}\n"
            f"Duration   : {pcap_stats.get('duration_seconds', 'N/A')}s\n"
            f"Protocols  : {', '.join(pcap_stats.get('protocols', []))}\n"
            f"Ports      : {', '.join(ports)}\n"
            f"Suspicious payloads found: {len(snippets)}\n"
            + (f"  Sample: ...{snippets[0][:80]}...\n" if snippets else "")
            + f"Attack succeeded: {success}\n"
            f"Remediation: Patch {service} immediately. Block attacker IP at perimeter. "
            f"Rotate all credentials. Review access logs for lateral movement.\n"
            f"{'='*50}"
        )


# ── Public API ────────────────────────────────────────────────────────────────

def run_forensic_analysis(event_id: str, benchmark: str = "CFA") -> dict:
    """
    Run forensic analysis on a benchmark PCAP event.

    Returns
    -------
    {
        "event_id": str,
        "cve": str,
        "service": str,
        "severity": str,
        "success": bool,
        "vulnerable": bool,
        "pcap_stats": dict,
        "forensic_report": str,
        "indicators_of_compromise": [str],
        "pipeline_events": [{"source_ip", "event_type", "raw", "protocol"}],
        "summary": str,
    }
    """
    tasks = _load_tasks(benchmark)
    task  = next((t for t in tasks if str(t.get("event", t.get("event_id"))) == str(event_id)), None)
    if not task:
        raise ValueError(f"Event '{event_id}' not found in {benchmark} benchmark")

    cve       = task.get("cve", "unknown")
    service   = task.get("service", "unknown")
    success   = task.get("success", False)
    vulnerable = task.get("vulnerable", False)
    severity  = CVE_SEVERITY.get(cve, "high")

    base     = _CFA if benchmark == "CFA" else _TEST
    raw_dir  = base / "raw" / f"eventID_{event_id}"
    pcaps    = list(raw_dir.glob("*.pcap")) if raw_dir.exists() else []

    if not pcaps:
        raise FileNotFoundError(f"No PCAP found for event {event_id} in {benchmark}")

    pcap_path = pcaps[0]
    pcap_stats = _analyse_pcap(pcap_path)

    forensic_report = _llm_forensic_report(pcap_stats, cve, service, severity, success)

    # Build IOCs from PCAP stats
    iocs: list[str] = []
    attacker = pcap_stats.get("attacker_ip")
    if attacker and attacker != "unknown":
        iocs.append(f"IP: {attacker} (attacker)")
    victim = pcap_stats.get("victim_ip")
    if victim and victim != "unknown":
        iocs.append(f"IP: {victim} (victim/target)")
    for port_info in pcap_stats.get("top_dst_ports", [])[:3]:
        iocs.append(f"Port: {port_info['port']}/TCP")
    for snippet in pcap_stats.get("suspicious_snippets", [])[:2]:
        iocs.append(f"Payload pattern: {snippet[:60]}...")

    # Build CyberSaviour pipeline events
    pipeline_events: list[dict] = []
    if attacker and attacker != "unknown":
        pipeline_events.append({
            "source_ip":  attacker,
            "event_type": "network_activity",
            "raw": f"[Forensic:{cve}] {service} exploitation traffic from {attacker} to {victim}. "
                   f"{pcap_stats.get('packet_count', 0)} packets, "
                   f"{len(pcap_stats.get('suspicious_snippets', []))} suspicious payloads.",
            "protocol": "TCP",
        })
        if success:
            pipeline_events.append({
                "source_ip":  attacker,
                "event_type": "network_activity",
                "raw": f"[Forensic:{cve}] Successful exploitation confirmed. Service: {service}. "
                       f"Attacker achieved code execution / data access.",
                "protocol": "TCP",
            })

    summary = (
        f"Forensic analysis of {cve} ({service}) — "
        f"severity={severity}, attack_succeeded={success}, "
        f"packets={pcap_stats.get('packet_count', '?')}, "
        f"iocs={len(iocs)}, "
        f"duration={pcap_stats.get('duration_seconds', '?')}s."
    )

    return {
        "event_id":                str(event_id),
        "cve":                     cve,
        "service":                 service,
        "severity":                severity,
        "success":                 success,
        "vulnerable":              vulnerable,
        "cve_description":         CVE_DESCRIPTION.get(cve, f"{cve} exploitation."),
        "pcap_file":               pcap_path.name,
        "pcap_stats":              pcap_stats,
        "forensic_report":         forensic_report,
        "indicators_of_compromise": iocs,
        "pipeline_events":         pipeline_events,
        "summary":                 summary,
        "timestamp":               datetime.now(timezone.utc).isoformat(),
    }
