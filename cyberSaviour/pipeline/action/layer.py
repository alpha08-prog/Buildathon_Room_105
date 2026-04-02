"""
ActionLayer — executes the approved decision.

In a real SOC this would call firewall APIs, SIEM ticketing, etc.
Here each action is simulated with a structured execution log.

Input:  state["context"]["human_review"]  (approved action)
        state["context"]["decision"]       (IPs, priority, reasoning)
Output: state["context"]["action_result"]
"""

from datetime import datetime, timezone
from agents.god.body import Body
from pipeline.action.config import ACTION_DESCRIPTIONS


class ActionLayer(Body):
    def __init__(self):
        super().__init__('Action_Layer')

    def _execute(self, action: str, ips: list, priority: str, reasoning: str) -> dict:
        description = ACTION_DESCRIPTIONS.get(action, 'Unknown action')
        executed = [
            {'ip': ip, 'action': action, 'status': 'executed',
             'detail': f'{description} — {ip}'}
            for ip in ips
        ]
        return {
            'action':       action,
            'description':  description,
            'priority':     priority,
            'ips_acted_on': ips,
            'executed':     executed,
            'reasoning':    reasoning,
            'timestamp':    datetime.now(timezone.utc).isoformat(),
            'status':       'success' if executed else 'no_ips',
        }

    def process(self, state: dict) -> dict:
        review   = state.get('context', {}).get('human_review', {})
        decision = state.get('context', {}).get('decision', {})

        if not review.get('approved', False):
            result = {
                'action':    'rejected',
                'status':    'rejected_by_human',
                'executed':  [],
                'timestamp': datetime.now(timezone.utc).isoformat(),
            }
        else:
            action    = review.get('action') or decision.get('action', 'log')
            ips       = decision.get('ips_to_act_on', [])
            priority  = decision.get('priority', 'low')
            reasoning = decision.get('reasoning', '')
            result    = self._execute(action, ips, priority, reasoning)

        state['context']['action_result'] = result
        state['alerts'].append(self.inter_agent_comms(result))
        state['history'].append({'agent': self.name, 'output': result})
        return state
