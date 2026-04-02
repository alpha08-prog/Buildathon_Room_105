"""
Ingestion bridge — long-running process.

Starts the Python ingestion engine and writes each normalized event
as a single JSON line to stdout.  The Rust orchestrator reads from
this process's stdout via a pipe.

Run from cyberSaviour/:
    python orchestrator/ingestion_bridge.py
"""

import sys
import os
import json

# Ensure cyberSaviour/ is on the path regardless of cwd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ingestion.ingest import ingestEngine

engine = ingestEngine()
queue  = engine.startIngestion()

while True:
    event = queue.get()
    print(json.dumps(event, default=str), flush=True)
