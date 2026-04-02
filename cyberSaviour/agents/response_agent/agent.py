"""
ResponseAgent — final node in the pipeline.

Consolidates the incident report + action result into a single
SOC analyst briefing that can be surfaced to a dashboard or operator.

Input:  state["context"]["report"]        (from ReportAgent)
        state["context"]["action_result"] (from ActionLayer)
Output: state["context"]["response"]      (final output)
"""

from agents.god.body import Body


class ResponseAgent(Body):
    def __init__(self):
        super().__init__('Response_Agent')

    def process(self, state: dict) -> dict:
        report        = state.get('context', {}).get('report', {})
        action_result = state.get('context', {}).get('action_result', {})
        decision      = state.get('context', {}).get('decision', {})
        threat_intel  = state.get('context', {}).get('threat_intel', {})

        response = {
            'status':        'complete',
            'priority':      decision.get('priority', 'unknown'),
            'action_taken':  action_result.get('action', 'none'),
            'ips_acted_on':  action_result.get('ips_acted_on', []),
            'action_status': action_result.get('status', 'unknown'),
            'mitre':         threat_intel.get('mitre_anchor', {}),
            'report':        report.get('text', ''),
            'timestamp':     report.get('timestamp', ''),
            'pipeline_steps': [h['agent'] for h in state.get('history', [])],
        }

        state['context']['response'] = response
        state['history'].append({'agent': self.name, 'output': {
            'status':   response['status'],
            'priority': response['priority'],
            'action':   response['action_taken'],
        }})

        return state
