"""
Pipeline worker — single-shot process.

Reads a JSON array of events from stdin, runs the full agent pipeline,
writes the JSON response to stdout, then exits.

The Rust orchestrator spawns one of these per event window.
Memory for the entire pipeline is released when this process exits.

Run from cyberSaviour/:
    echo '[...]' | python orchestrator/pipeline_worker.py
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.log_agent.agent       import LogAgent
from agents.correlation_agent.agent import CorrelationAgent
from agents.threat_agent.agent    import ThreatAgent
from agents.report_agent.agent    import ReportAgent
from agents.response_agent.agent  import ResponseAgent
from memory.layer                 import MemoryLayer
from pipeline.decision.layer      import DecisionLayer
from pipeline.human_in_loop.handler import HumanInLoop
from pipeline.action.layer        import ActionLayer


def run_pipeline(events: list) -> dict:
    state = {'events': events, 'alerts': [], 'context': {}, 'history': []}

    # LogAgent processes one event at a time
    log_agent = LogAgent()
    original  = state['events']
    for i in range(len(original)):
        state['events'] = original[:i + 1]
        state = log_agent.process(state)
    state['events'] = original

    state = CorrelationAgent().process(state)
    state = ThreatAgent().process(state)
    state = MemoryLayer().process(state)
    state = DecisionLayer().process(state)
    state = HumanInLoop().process(state)
    state = ActionLayer().process(state)
    state = ReportAgent().process(state)
    state = ResponseAgent().process(state)

    return state.get('context', {}).get('response', {})


if __name__ == '__main__':
    raw    = sys.stdin.read()
    events = json.loads(raw)
    result = run_pipeline(events)
    print(json.dumps(result, default=str))
