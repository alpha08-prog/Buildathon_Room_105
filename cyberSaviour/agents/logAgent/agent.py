from agents.god.body import Body


class LogAgent(Body):
    def __init__(self):
        super().__init__('Log_Agent')

    def process(self, state):

        event = state["events"][-1]  
        raw = str(event.get("raw", "")).lower()
        ip = event.get("source_ip")

        alerts = []

        if "failed password" in raw:
            alerts.append(self.inter_agent_comms({
                "type": "failed_login",
                "ip": ip
            }))

        if any(x in raw for x in ["' or 1=1", "union select", "drop table"]):
            alerts.append(self.inter_agent_comms({
                "type": "sql_injection",
                "ip": ip
            }))

        if "nmap" in raw or "scan" in raw:
            alerts.append(self.inter_agent_comms({
                "type": "recon_activity",
                "ip": ip
            }))

        if event.get("protocol") == "TCP" and ip:
            alerts.append(self.inter_agent_comms({
                "type": "network_activity",
                "ip": ip
            }))

        state["alerts"].extend(alerts)

        state["history"].append({
            "agent": self.name,
            "alerts_generated": alerts
        })

        return state
