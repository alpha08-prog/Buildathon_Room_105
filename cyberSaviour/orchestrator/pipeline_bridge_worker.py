"""
Bridge pipeline worker — single-shot process.

Like pipeline_worker.py but returns full frontend-shaped data
(alerts, incident, agents, response_actions, memory_entries)
instead of just the minimal response dict.

The Rust orchestrator spawns one of these per event window,
reads the JSON output, and POSTs it to the FastAPI server.

Run from cyberSaviour/:
    echo '[...]' | python orchestrator/pipeline_bridge_worker.py
"""

import sys
import os
import json

# Ensure cyberSaviour/ is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.pipeline_bridge import run_pipeline

if __name__ == "__main__":
    raw    = sys.stdin.read()
    events = json.loads(raw)
    result = run_pipeline(events)
    print(json.dumps(result, default=str))
