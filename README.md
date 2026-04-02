# Generative AI for SOCs

`Generative AI for SOCs` is an agentic Security Operations Center prototype that combines:

- a Python-based ingestion and detection pipeline
- a React/Vite frontend for investigation and response workflows
- an emerging multi-agent architecture for alerting, correlation, memory, and response
- a planned gamified analyst experience built on top of real SOC actions

The current repo already has the right product shape:

- live-style ingestion from web, system, alert, and network sources
- rule-based alert extraction
- incident, response, agent, and memory views in the frontend
- a strong cyber-ops visual identity that can support a high-energy gamified layer

The next step is to turn this into a real-time, game-like SOC command center where the analyst handles missions, attack waves, squad agents, boss incidents, and response decisions driven by model outputs.

## Repository structure

```text
.
|-- cyberSaviour/
|   |-- agents/
|   |   |-- god/
|   |   |-- logAgent/
|   |   `-- correlation_agent/
|   `-- ingestion/
|-- frontend/
|   `-- src/
|       |-- components/
|       |-- data/
|       |-- pages/
|       `-- store/
|-- docs/
|-- requirements.txt
`-- README.md
```

## Current architecture

### Backend

The backend is centered around event ingestion and agent processing.

- `cyberSaviour/ingestion/live.py`
  Watches log directories and captures network packets from an interface.
- `cyberSaviour/ingestion/parse.py`
  Normalizes raw data into a common event shape.
- `cyberSaviour/ingestion/ingest.py`
  Pushes normalized events into a queue for downstream processing.
- `cyberSaviour/agents/logAgent/agent.py`
  Performs lightweight rule-based detection and emits alerts.
- `cyberSaviour/agents/correlation_agent/agent.py`
  Intended to correlate alerts/events into incidents, but currently only exists as a stub.
- `cyberSaviour/agents/god/llm.py`
  Thin wrapper around a Gemini model call.

### Frontend

The frontend already has the product surfaces needed for a gamified SOC experience.

- `Dashboard`
  Real-time threat overview, alert stream, charts, attack visualization.
- `Incident Investigation`
  Attack chain view, summary, timeline, evidence.
- `AI Agents`
  Agent activity and reasoning panel.
- `Response Center`
  Analyst approval workflow for suggested actions.
- `Memory`
  Retrieval-style view over past incidents and similar cases.

## Tech stack

### Backend

- Python
- `watchdog` for file monitoring
- `pyshark` / `scapy` for network-related ingestion
- `google-genai` for model access
- `pydantic`, `pandas`, `numpy`, `PyYAML`

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand
- React Query
- Recharts
- D3
- shadcn/ui + Radix

## Product vision

The frontend should evolve from a dashboard demo into a gamified SOC control room.

### Recommended gamification layer

- Incidents become missions with phases such as Initial Access, Discovery, Lateral Movement, Containment, and Recovery.
- Major attacks become boss fights with visible progress, urgency, and branching consequences.
- Agents become squad members with specialties, trust, cooldowns, and unlockable upgrades.
- Response decisions create score multipliers, streaks, XP, and mission outcomes.
- Memory becomes a codex of unlocked tactics, prior campaigns, and reusable playbooks.
- The dashboard becomes a live command screen with threat momentum, defense score, active objectives, and cinematic alerting.

This gamified layer should not be cosmetic only. It should be driven by real model outputs and real event/state transitions.

## Data ingestion today

The backend currently ingests four main source types:

### 1. Web logs

Source path:

- `logs/web`

Example raw input:

```text
192.168.1.1 GET /login?id=1
```

Normalized fields produced:

```json
{
  "timestamp": null,
  "source_ip": "192.168.1.1",
  "destination_ip": null,
  "event_type": "web_request",
  "protocol": null,
  "data": {
    "method": "GET",
    "url": "192.168.1.1 GET /login?id=1"
  },
  "raw": "192.168.1.1 GET /login?id=1"
}
```

### 2. System/authentication logs

Source path:

- `logs/system`

Example raw input:

```text
Failed password from 192.168.1.5
```

Normalized fields produced:

```json
{
  "timestamp": null,
  "source_ip": "192.168.1.5",
  "destination_ip": null,
  "event_type": "failed_login",
  "protocol": null,
  "data": {
    "message": "Failed password from 192.168.1.5"
  },
  "raw": "Failed password from 192.168.1.5"
}
```

### 3. Alert feed JSON

Source path:

- `logs/alerts`

Example raw input:

```json
{"severity":"high","source_ip":"192.168.1.10"}
```

Normalized fields produced:

```json
{
  "timestamp": null,
  "source_ip": "192.168.1.10",
  "destination_ip": null,
  "event_type": "alert",
  "protocol": null,
  "data": {
    "severity": "high",
    "source_ip": "192.168.1.10"
  },
  "raw": "{\"severity\":\"high\",\"source_ip\":\"192.168.1.10\"}"
}
```

### 4. Live network packets

Source:

- a live network interface, currently configured as `wlan0`

Normalized fields produced:

```json
{
  "timestamp": "2026-04-02T12:34:56",
  "source_ip": "10.0.0.5",
  "destination_ip": "8.8.8.8",
  "protocol": "TCP",
  "event_type": "network",
  "data": {},
  "raw": "<packet object>"
}
```

## Current backend event contract

All normalized events should follow this common envelope:

```json
{
  "timestamp": "string | null",
  "source_ip": "string | null",
  "destination_ip": "string | null",
  "event_type": "string",
  "protocol": "string | null",
  "data": {},
  "raw": "any"
}
```

## Model input design

To make the models useful for both security workflows and the planned gamified frontend, define the model-facing inputs in layers.

### Layer 1: Raw event input

This is the lowest-level input that arrives from ingestion.

```json
{
  "event_id": "evt-123",
  "timestamp": "2026-04-02T12:34:56Z",
  "source_type": "web | system | alert | network",
  "source_ip": "10.0.0.5",
  "destination_ip": "8.8.8.8",
  "protocol": "TCP",
  "event_type": "failed_login",
  "data": {},
  "raw": "original raw payload"
}
```

Use this input for:

- event classification
- severity estimation
- MITRE mapping
- IOC extraction
- short explanations

### Layer 2: Correlation window input

This is the key input for your correlation and incident-generation models.

```json
{
  "window_id": "win-001",
  "window_seconds": 300,
  "events": [],
  "alerts": [],
  "entities": {
    "ips": [],
    "hosts": [],
    "users": [],
    "processes": [],
    "urls": [],
    "domains": []
  },
  "historical_matches": [],
  "active_incidents": []
}
```

Use this input for:

- grouping alerts into incidents
- building attack chains
- identifying campaign phases
- estimating escalation risk
- generating recommended actions

### Layer 3: Incident state input

This is what should drive the investigation screen and mission progression.

```json
{
  "incident_id": "INC-001",
  "title": "Possible lateral movement campaign",
  "severity": "critical",
  "status": "investigating",
  "attack_type": "Lateral Movement",
  "timeline": [],
  "affected_systems": [],
  "entities": {
    "users": [],
    "hosts": [],
    "ips": []
  },
  "evidence": [],
  "response_candidates": [],
  "memory_matches": []
}
```

Use this input for:

- incident summaries
- investigation guidance
- next-best-action suggestions
- mission phase generation
- boss-fight style progression states

### Layer 4: Frontend gameplay state input

This layer is not ingested from logs. It is generated by the frontend and should be sent back to models if you want a truly gamified system.

```json
{
  "user_id": "analyst-01",
  "session_id": "sess-001",
  "active_missions": [],
  "current_incident_id": "INC-001",
  "squad_state": {
    "selected_agents": [],
    "cooldowns": {},
    "trust_levels": {}
  },
  "analyst_actions": [
    {
      "timestamp": "2026-04-02T12:40:00Z",
      "action_type": "approve_response",
      "target_id": "RA-001",
      "latency_ms": 4200
    }
  ],
  "score_state": {
    "xp": 240,
    "streak": 4,
    "combo_multiplier": 2,
    "rank": "Tier-2 Analyst"
  }
}
```

Use this input for:

- adaptive mission difficulty
- achievement generation
- squad commentary
- dynamic challenge pacing
- personalized coaching and debriefs

## Recommended model outputs

Your models should return strict structured data, not only prose.

### 1. Triage output

```json
{
  "severity": "critical",
  "confidence": 0.94,
  "summary": "Brute-force authentication behavior detected",
  "mitre_ids": ["T1110"],
  "tags": ["auth", "bruteforce"],
  "entities": {
    "ips": ["192.168.1.5"],
    "users": [],
    "hosts": []
  },
  "evidence": []
}
```

### 2. Correlation output

```json
{
  "incident_id": "INC-001",
  "campaign_name": "Northbound Lateral Movement",
  "phase": "Lateral Movement",
  "confidence": 0.87,
  "timeline": [],
  "graph_edges": [],
  "affected_systems": [],
  "recommended_actions": [],
  "narrative_banner": "Threat wave escalating across core systems"
}
```

### 3. Response output

```json
{
  "actions": [
    {
      "action": "Block IP",
      "target": "185.220.101.34",
      "risk_level": "low",
      "reason": "Known C2 traffic source",
      "requires_human_approval": true
    }
  ]
}
```

### 4. Gamification output

```json
{
  "mission_type": "boss_incident",
  "xp_reward": 120,
  "combo_opportunity": true,
  "achievement_candidate": "Cut The C2 Chain",
  "agent_voice_line": "Correlation Agent has locked the attack path. Strike now."
}
```

## Frontend inputs you should plan for

If you want the models to support the frontend well, the frontend should eventually send these input categories:

- analyst action events
  - opened incident
  - viewed evidence
  - approved or rejected response
  - time taken to act
  - switched agent view
  - searched memory/codex
- UI context
  - current page
  - selected incident
  - selected mission
  - filters and search state
- game state
  - XP
  - streak
  - rank
  - unlocked achievements
  - active objectives
  - squad composition
- outcome feedback
  - whether a recommended action helped
  - whether an alert became a real incident
  - false positive / true positive confirmation

## Suggested data contracts by product area

### Dashboard

Inputs needed:

- streaming alerts
- threat counts by severity
- active mission list
- threat momentum over time
- current squad/agent states

### Incident Investigation

Inputs needed:

- incident summary
- correlated event timeline
- attack graph nodes and edges
- evidence snippets
- phase progression
- affected assets and entities

### Response Center

Inputs needed:

- recommended actions
- risk level
- confidence
- human approval requirement
- expected impact
- action outcome after execution

### Memory / Codex

Inputs needed:

- embeddings or similarity matches
- past incident summaries
- playbook resolution steps
- reusable patterns and tags

## Immediate implementation priorities

Before the full gamified experience, the project should prioritize:

1. finish the correlation agent
2. expose backend data through APIs or sockets
3. replace mock frontend data with live incident state
4. formalize JSON schemas for model inputs and outputs
5. add persistent storage for incidents, actions, memory, and gameplay state

## Development notes

- The frontend is currently the fastest place to prototype the mission, XP, squad, and boss-fight experience.
- The backend needs a real correlation/orchestration layer before the gamified loop can be fully model-driven.
- The best long-term path is to keep security reasoning and game-state generation as separate but connected model outputs.

## Status

Current state:

- ingestion exists
- basic alert extraction exists
- frontend UX shell exists
- correlation/orchestration is incomplete
- most frontend data is mocked
- model contracts are not yet formalized

Target state:

- real-time SOC gameplay powered by structured cyber events, correlation, memory retrieval, and explainable model-driven response recommendations
