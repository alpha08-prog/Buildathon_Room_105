from agents.god.body import Body
from agents.god.llm import deployLLM
from agents.threat_agent.config import MODEL, TOKEN_BUDGET, MITRE_MAP
import yaml

with open('agents/god/prompts.yaml', 'r') as f:
    prompt = yaml.safe_load(f).get('threat')


class ThreatAgent(Body):
    def __init__(self):
        super().__init__('Threat_Agent')

    def _dominant_type(self, scored_ips):
        """Return the alert type with the highest total weight across all IPs."""
        type_totals = {}
        for ip_data in scored_ips.values():
            for alert_type, count in ip_data.get("types", {}).items():
                type_totals[alert_type] = type_totals.get(alert_type, 0) + count
        if not type_totals:
            return "unknown"
        return max(type_totals, key=type_totals.get)

    def _static_mitre(self, scored_ips):
        """Fast rule-based MITRE mapping as a grounding signal for the LLM."""
        dominant = self._dominant_type(scored_ips)
        return MITRE_MAP.get(dominant, MITRE_MAP["unknown"])

    def process(self, state):
        correlation = state.get("context", {}).get("correlation")

        if not correlation:
            return state

        summary  = correlation.get("summary", "")
        analysis = correlation.get("analysis", "")
        scored_ips = correlation.get("scored_ips", {})

        # Rule-based grounding — gives the LLM an anchor
        mitre_id, tactic, technique = self._static_mitre(scored_ips)

        correlation_summary = (
            f"{summary}\n\n"
            f"LLM correlation analysis:\n{analysis}\n\n"
            f"Rule-based MITRE anchor: {mitre_id} — {technique} ({tactic})"
        )

        filled_prompt = prompt.format(correlation_summary=correlation_summary)

        try:
            llm_response = deployLLM(MODEL, filled_prompt)
        except Exception as e:
            llm_response = f"LLM call failed: {e}"

        threat_intel = {
            "mitre_anchor": {
                "id":      mitre_id,
                "tactic":  tactic,
                "technique": technique,
            },
            "llm_enrichment": llm_response,
            "scored_ips": scored_ips,
        }

        state["context"]["threat_intel"] = threat_intel
        state["alerts"].append(
            self.inter_agent_comms(threat_intel)
        )
        state["history"].append({
            "agent":  self.name,
            "output": threat_intel,
        })

        return state
