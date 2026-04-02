"""
HumanInLoop — gate between DecisionLayer and ActionLayer.

If decision requires_human:
  - AUTO_APPROVE=True  → auto-approves and logs it (testing / pipeline mode)
  - AUTO_APPROVE=False → prints the decision and waits for terminal input

Output: state["context"]["human_review"]
"""

from agents.god.body import Body
from pipeline.human_in_loop.config import AUTO_APPROVE


class HumanInLoop(Body):
    def __init__(self):
        super().__init__('Human_In_Loop')

    def _present_decision(self, decision: dict) -> str:
        lines = [
            '\n' + '='*60,
            '  ⚠  HUMAN REVIEW REQUIRED',
            '='*60,
            f"  Action    : {decision.get('action', '?').upper()}",
            f"  Priority  : {decision.get('priority', '?').upper()}",
            f"  IPs       : {decision.get('ips_to_act_on', [])}",
            f"  Reasoning : {decision.get('reasoning', '')}",
            '='*60,
        ]
        return '\n'.join(lines)

    def _interactive_review(self, decision: dict) -> dict:
        print(self._present_decision(decision))
        while True:
            choice = input('  Approve? [y]es / [n]o / [m]odify action: ').strip().lower()
            if choice == 'y':
                return {'approved': True, 'action': decision.get('action'), 'modified': False}
            elif choice == 'n':
                return {'approved': False, 'action': None, 'modified': False}
            elif choice == 'm':
                new_action = input('  Enter new action (block/escalate/monitor/log): ').strip().lower()
                return {'approved': True, 'action': new_action, 'modified': True}

    def process(self, state: dict) -> dict:
        decision = state.get('context', {}).get('decision', {})
        requires_human = decision.get('requires_human', False)

        if not requires_human:
            review = {'approved': True, 'action': decision.get('action'), 'modified': False,
                      'note': 'auto-passed (human review not required)'}
        elif AUTO_APPROVE:
            review = {'approved': True, 'action': decision.get('action'), 'modified': False,
                      'note': 'auto-approved (AUTO_APPROVE=True)'}
            print(self._present_decision(decision))
            print(f"  [AUTO-APPROVED] action={review['action']}")
        else:
            review = self._interactive_review(decision)

        state['context']['human_review'] = review
        state['history'].append({'agent': self.name, 'output': review})
        return state
