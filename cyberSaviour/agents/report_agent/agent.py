"""
ReportAgent — generates a structured incident report from the full pipeline context.

Input:  state["context"] (correlation, threat_intel, memory, decision, action_result)
Output: state["context"]["report"]
"""

import json
import yaml
from datetime import datetime, timezone
from agents.god.body import Body
from agents.god.llm import deployLLM

MODEL = "gemini-2.5-flash"

with open('agents/god/prompts.yaml', 'r') as f:
    _prompt = yaml.safe_load(f).get('report')


class ReportAgent(Body):
    def __init__(self):
        super().__init__('Report_Agent')

    def _build_pipeline_context(self, state: dict) -> str:
        ctx = state.get('context', {})
        sections = {}

        correlation = ctx.get('correlation', {})
        if correlation:
            sections['correlation'] = {
                'summary':    correlation.get('summary', ''),
                'scored_ips': correlation.get('scored_ips', {}),
            }

        threat = ctx.get('threat_intel', {})
        if threat:
            sections['threat_intel'] = {
                'mitre_anchor':  threat.get('mitre_anchor', {}),
                'llm_enrichment': threat.get('llm_enrichment', ''),
            }

        memory = ctx.get('memory', {})
        if memory:
            sections['memory'] = {
                'repeat_offenders': memory.get('repeat_offenders', {}),
                'total_stored':     memory.get('total_stored', 0),
            }

        decision = ctx.get('decision', {})
        if decision:
            sections['decision'] = decision

        action = ctx.get('action_result', {})
        if action:
            sections['action_result'] = action

        return json.dumps(sections, indent=2, default=str)

    def process(self, state: dict) -> dict:
        pipeline_context = self._build_pipeline_context(state)
        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')

        filled_prompt = _prompt.format(
            timestamp=timestamp,
            pipeline_context=pipeline_context,
        )

        try:
            report_text = deployLLM(MODEL, filled_prompt)
        except Exception as e:
            report_text = f"Report generation failed: {e}"

        state['context']['report'] = {
            'text':      report_text,
            'timestamp': timestamp,
        }
        state['history'].append({'agent': self.name, 'output': {'report_length': len(report_text)}})

        return state
