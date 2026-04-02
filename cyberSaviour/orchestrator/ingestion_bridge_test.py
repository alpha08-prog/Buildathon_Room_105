"""
Test ingestion bridge — emits a batch of pseudo events then exits.
Used to exercise the Rust orchestrator without live log files or network.
"""

import sys, os, json, time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PSEUDO_EVENTS = [
    # brute-force from 192.168.1.5
    {"source_ip": "192.168.1.5", "event_type": "failed_login",
     "raw": "Failed password from 192.168.1.5", "protocol": None,
     "timestamp": None, "destination_ip": None, "data": {}, "source": "system"},
    {"source_ip": "192.168.1.5", "event_type": "failed_login",
     "raw": "Failed password from 192.168.1.5", "protocol": None,
     "timestamp": None, "destination_ip": None, "data": {}, "source": "system"},
    {"source_ip": "192.168.1.5", "event_type": "failed_login",
     "raw": "Failed password from 192.168.1.5", "protocol": None,
     "timestamp": None, "destination_ip": None, "data": {}, "source": "system"},
    # recon from 10.0.0.3
    {"source_ip": "10.0.0.3", "event_type": "recon_activity",
     "raw": "nmap scan detected from 10.0.0.3", "protocol": None,
     "timestamp": None, "destination_ip": None, "data": {}, "source": "system"},
    # SQL injection from 192.168.1.1
    {"source_ip": "192.168.1.1", "event_type": "web_request",
     "raw": "GET /login?id=1' or 1=1--", "protocol": None,
     "timestamp": None, "destination_ip": None, "data": {}, "source": "web"},
    # TCP network activity from 192.168.1.5
    {"source_ip": "192.168.1.5", "event_type": "network_activity",
     "raw": "outbound connection from 192.168.1.5", "protocol": "TCP",
     "timestamp": None, "destination_ip": None, "data": {}, "source": "network"},
]

for event in PSEUDO_EVENTS:
    print(json.dumps(event), flush=True)
    time.sleep(0.1)   # slight delay so Rust reads them cleanly

# Exit after emitting — Rust will process the window and shut down
