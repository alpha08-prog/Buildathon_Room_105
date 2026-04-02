from agents.god.body import Body
from agents.god.llm import deployLLM
from agents.correlation_agent.config import MODEL,TOKEN_BUDGET,WINDOW_SECONDS,SCORE_THRESHOLDS,SCORE_WEIGHTS
from collections import defaultdict
import json
import time
import yaml

with open('agents/god/prompts.yaml' ,'r') as f:
    prompt=yaml.safe_load(f).get('correlation')

class CorrelationAgent(Body):
    def __init__(self):
        super().__init__('Correlation_Agent')
        self._ip_buckets=defaultdict(list)

    def _ingest_alerts(self,alerts,now):
        for alert in alerts:
            msg     = alert.get("message", {})
            ip      = msg.get("ip") or "unknown"
            a_type  = msg.get("type", "unknown")
            self._ip_buckets[ip].append({
                "type":      a_type,
                "timestamp": now,
                "raw":       msg,
            })

    def _filter_expired(self, now):
        cutoff = now - WINDOW_SECONDS
        for ip in list(self._ip_buckets.keys()):
            self._ip_buckets[ip] = [
                e for e in self._ip_buckets[ip]
                if e["timestamp"] >= cutoff
            ]
            if not self._ip_buckets[ip]:
                del self._ip_buckets[ip]

    def _score_ip(self, ip):
        score = 0
        for entry in self._ip_buckets[ip]:
            score += SCORE_WEIGHTS.get(entry["type"], 0)
        return score

    def _classify_severity(self, score):
        if score >= SCORE_THRESHOLDS["critical"]:
            return "critical"
        if score >= SCORE_THRESHOLDS["high"]:
            return "high"
        if score >= SCORE_THRESHOLDS["medium"]:
            return "medium"
        return "low"

    def _build_summary(self):
        lines = []
        for ip, entries in self._ip_buckets.items():
            score    = self._score_ip(ip)
            severity = self._classify_severity(score)
            type_counts = defaultdict(int)
            for e in entries:
                type_counts[e["type"]] += 1
            lines.append(
                f"IP: {ip} | severity={severity} | score={score} | "
                f"events={len(entries)} | types={dict(type_counts)}"
            )
        return "\n".join(lines) if lines else "No suspicious activity detected."

    def process(self, state):
        now    = time.time()
        alerts = state.get("alerts", [])

        # only process alerts from log_agent that haven't been correlated yet
        new_alerts = [
            a for a in alerts
            if isinstance(a, dict) and a.get("agent") == "Log_Agent"
        ]

        if not new_alerts:
            return state

        self._ingest_alerts(new_alerts, now)
        self._filter_expired(now)

        summary      = self._build_summary()
        filled_prompt = prompt.format(event_summary=summary)

        try:
            llm_response = deployLLM(MODEL, filled_prompt)
        except Exception as e:
            llm_response = f"LLM call failed: {e}"

        from collections import defaultdict as _dd
        def _type_counts(entries):
            tc = _dd(int)
            for e in entries:
                tc[e["type"]] += 1
            return dict(tc)

        correlation_result = {
            "summary":  summary,
            "analysis": llm_response,
            "scored_ips": {
                ip: {
                    "score":    self._score_ip(ip),
                    "severity": self._classify_severity(self._score_ip(ip)),
                    "count":    len(entries),
                    "types":    _type_counts(entries),
                }
                for ip, entries in self._ip_buckets.items()
            },
        }

        state["context"]["correlation"] = correlation_result
        state["alerts"].append(
            self.inter_agent_comms(correlation_result)
        )
        state["history"].append({
            "agent":  self.name,
            "output": correlation_result,
        })

        return state
