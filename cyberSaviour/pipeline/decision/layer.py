"""
DecisionLayer — decides what action the SOC should take.

Input:  state["context"]["memory"]      (from MemoryLayer)
        state["context"]["threat_intel"] (from ThreatAgent)
Output: state["context"]["decision"]
"""

import json
import re
import yaml
from agents.god.body import Body
from agents.god.llm import deployLLM
from pipeline.decision.config import MODEL, HUMAN_REQUIRED_SEVERITIES, REPEAT_OFFENDER_THRESHOLD

with open('agents/god/prompts.yaml', 'r') as f:
    _prompt = yaml.safe_load(f).get('decision')


class DecisionLayer(Body):
    def __init__(self):
        super().__init__('Decision_Layer')

    def _extract_json(self, text: str) -> dict:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return {}

    def _build_threat_summary(self, threat_intel: dict) -> str:
        anchor = threat_intel.get('mitre_anchor', {})
        llm_raw = threat_intel.get('llm_enrichment', '')
        llm_data = self._extract_json(llm_raw) if isinstance(llm_raw, str) else {}
        scored_ips = threat_intel.get('scored_ips', {})

        lines = [
            f"attack_type  : {llm_data.get('attack_type', anchor.get('technique', 'unknown'))}",
            f"mitre_id     : {llm_data.get('mitre_id', anchor.get('id', 'T0000'))}",
            f"severity     : {llm_data.get('severity', 'unknown')}",
            f"impact       : {llm_data.get('impact', 'unknown')}",
            f"cve          : {llm_data.get('cve', [])}",
            "scored_ips   :",
        ]
        for ip, data in scored_ips.items():
            lines.append(f"  {ip} → score={data.get('score')} severity={data.get('severity')} types={data.get('types')}")
        return '\n'.join(lines)

    def _build_memory_summary(self, memory: dict) -> str:
        repeat = memory.get('repeat_offenders', {})
        historical = memory.get('historical_incidents', [])
        lines = ['Repeat offender counts:']
        for ip, count in repeat.items():
            lines.append(f"  {ip} → seen {count} time(s)")
        lines.append(f"Historical incidents in DB: {len(historical)}")
        return '\n'.join(lines)

    def _force_decision(self, threat_intel: dict, memory: dict) -> dict | None:
        """Apply hard rules before calling the LLM."""
        repeat = memory.get('repeat_offenders', {})
        scored_ips = threat_intel.get('scored_ips', {})

        repeat_ips = [ip for ip, count in repeat.items() if count >= REPEAT_OFFENDER_THRESHOLD]
        if repeat_ips:
            return {
                'action': 'block',
                'reasoning': f'Repeat offender(s) {repeat_ips} exceeded threshold of {REPEAT_OFFENDER_THRESHOLD} incidents.',
                'requires_human': True,
                'ips_to_act_on': repeat_ips,
                'priority': 'critical',
            }

        for ip, data in scored_ips.items():
            if 'sql_injection' in data.get('types', {}):
                return {
                    'action': 'block',
                    'reasoning': f'Direct SQL injection attempt detected from {ip}.',
                    'requires_human': True,
                    'ips_to_act_on': [ip],
                    'priority': 'high',
                }
        return None

    def process(self, state: dict) -> dict:
        threat_intel = state.get('context', {}).get('threat_intel', {})
        memory       = state.get('context', {}).get('memory', {})

        if not threat_intel:
            return state

        decision = self._force_decision(threat_intel, memory)

        if not decision:
            threat_summary = self._build_threat_summary(threat_intel)
            memory_summary = self._build_memory_summary(memory)
            filled_prompt  = _prompt.format(
                threat_summary=threat_summary,
                memory_summary=memory_summary,
            )
            try:
                raw = deployLLM(MODEL, filled_prompt)
                decision = self._extract_json(raw)
                if not decision:
                    decision = {'action': 'log', 'reasoning': raw,
                                'requires_human': False, 'ips_to_act_on': [], 'priority': 'low'}
            except Exception as e:
                decision = {'action': 'log', 'reasoning': f'LLM failed: {e}',
                            'requires_human': False, 'ips_to_act_on': [], 'priority': 'low'}

        if decision.get('priority') in HUMAN_REQUIRED_SEVERITIES:
            decision['requires_human'] = True

        state['context']['decision'] = decision
        state['alerts'].append(self.inter_agent_comms(decision))
        state['history'].append({'agent': self.name, 'output': decision})
        return state
