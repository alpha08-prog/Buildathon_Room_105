# CyberSaviour

CyberSaviour is a gamified, agent-driven Security Operations Center prototype built around a Python backend and a React frontend. It ingests security events, runs them through a multi-stage analysis pipeline, and turns the result into alerts, incidents, missions, response actions, memory entries, and live dashboard updates.

This repository also includes two connected cyber-security backends:

- `Cybersleuth_Forensic_Agent` for benchmark-driven PCAP forensic analysis
- `CybORG` for cyber-range simulation experiments

In the main application, both are exposed through the `cyberSaviour` backend so they can be used from the frontend and the API.

## Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Running Main Workflows](#running-main-workflows)
- [API Overview](#api-overview)
- [Development Commands](#development-commands)
- [Troubleshooting](#troubleshooting)
- [Typical Data Flow](#typical-data-flow)
- [Current Limitations](#current-limitations)
- [Roadmap](#roadmap)

## Overview

CyberSaviour brings together:

- a FastAPI backend for pipeline execution, state handling, and live updates
- a React + Vite frontend for dashboard, incident, response, forensic, and simulation views
- a multi-agent pipeline for log triage, correlation, threat reasoning, memory, decisioning, and response shaping
- a game layer that translates security outcomes into missions, XP, achievements, and squad-style workflows

The project is designed to feel like a SOC command center rather than a plain alert dashboard. Real pipeline outputs drive the missions, investigations, and analyst actions shown in the UI.

## Key Features

- Event-to-incident pipeline that turns raw events into frontend-ready SOC entities
- Live WebSocket sync between backend state and the frontend
- Response approval workflow for human-in-the-loop actions
- Forensic analysis of PCAP benchmark events through the integrated Cybersleuth bridge
- CybORG scenario execution through an adapter exposed in the main backend
- Mission, XP, and achievement systems layered on top of security workflows
- Optional Rust orchestrator for pipeline execution outside the main API process

## Architecture

### Main application

The main product lives in two folders:

- `cyberSaviour/`
  Python backend, pipeline logic, integrations, memory layer, and API server
- `frontend/`
  React application for the operator interface

### Backend pipeline

The backend pipeline currently runs through these stages:

1. `LogAgent`
   Detects suspicious patterns from incoming events
2. `CorrelationAgent`
   Correlates security context into incidents
3. `ThreatAgent`
   Adds MITRE-like threat framing and response context
4. `MemoryLayer`
   Adds historical and retrieval-style context
5. `DecisionLayer`
   Chooses a response path
6. `HumanInLoop`
   Marks actions that need approval
7. `ActionLayer`
   Shapes the execution result
8. `ReportAgent`
   Produces report content
9. `ResponseAgent`
   Produces the frontend-facing response payload

The shaping step that maps internal pipeline state into frontend objects is handled in `cyberSaviour/server/pipeline_bridge.py`.

### Integrated external modules

#### Cybersleuth forensic integration

`cyberSaviour/integrations/cybersleuth_bridge.py` analyzes benchmark PCAP files from `Cybersleuth_Forensic_Agent`, extracts metadata with Scapy, adds CVE and service context, and returns CyberSaviour-compatible events and forensic summaries.

#### CybORG integration

`cyberSaviour/integrations/cyborg_bridge.py` exposes CybORG-style scenarios through the main app. In the current integrated mode, it uses a built-in scenario simulator that mirrors the main CybORG scenarios and emits CyberSaviour pipeline events.

This is intentional: the integrated bridge notes that real CybORG runtime dependencies currently conflict with the backend's `numpy`-based stack.

### Frontend surfaces

The frontend includes pages for:

- dashboard / command center
- missions and mission briefing
- incident investigation
- AI agents
- response center
- codex / memory
- CybORG simulation
- forensic analysis

## Repository Layout

```text
.
|-- cyberSaviour/
|   |-- agents/              # Pipeline agents
|   |-- ingestion/           # Log / packet ingestion utilities
|   |-- integrations/        # Cybersleuth + CybORG bridges
|   |-- memory/              # Memory layer
|   |-- orchestrator/        # Optional Rust orchestrator
|   |-- pipeline/            # Decision / action / review pipeline pieces
|   `-- server/              # FastAPI app and API endpoints
|-- frontend/
|   |-- src/components/      # Shared UI and animation components
|   |-- src/pages/           # Main app pages
|   |-- src/store/           # Zustand store
|   `-- package.json
|-- Cybersleuth_Forensic_Agent/
|   |-- data/                # Benchmark PCAPs and tasks
|   |-- src/                 # Standalone forensic agent code
|   `-- README.md
|-- CybORG/
|   |-- CybORG/              # Upstream simulator package
|   |-- demo.py
|   `-- README.md
|-- docs/
|-- requirements.txt         # Root Python dependencies for the main app
`-- README.md
```

## Tech Stack

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- Scapy
- PyShark
- Pandas
- NumPy
- Google GenAI client

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Zustand
- Framer Motion
- Recharts
- D3
- Radix UI / shadcn-style components

### Optional components

- Rust orchestrator in `cyberSaviour/orchestrator`
- standalone Cybersleuth forensic agent
- standalone CybORG package

## Prerequisites

Before running the project, make sure you have:

- Python installed and available on your PATH
- `pip`
- Node.js and `npm`
- PowerShell or another terminal

Recommended:

- a virtual environment for Python dependencies
- a recent Node.js version for the frontend

## Quick Start

### 1. Clone the repository

```powershell
git clone <your-repo-url>
cd Buildathon_Room_105
```

### 2. Set up the Python backend

From the repository root:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install fastapi uvicorn
```

Why the extra install?

- The backend is built around FastAPI and Uvicorn.
- The current root `requirements.txt` does not explicitly include those two packages, so installing them ensures the API server can start.

### 3. Configure the backend environment

Create or update `cyberSaviour/.env` with your Google / Gemini API key:

```env
API=your_api_key_here
```

This key is used by `cyberSaviour/agents/god/llm.py`.

Do not commit real API keys to version control.

### 4. Start the backend

```powershell
cd cyberSaviour
uvicorn server.app:app --reload --port 8000
```

The backend will be available at:

- `http://localhost:8000`

### 5. Start the frontend

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will be available at:

- `http://localhost:8080`

### 6. Open the application

Useful routes:

- `http://localhost:8080/dashboard`
- `http://localhost:8080/cyborg`
- `http://localhost:8080/forensic`
- `http://localhost:8080/response`
- `http://localhost:8080/missions`

## Configuration

### Backend config

The main backend currently reads this environment variable:

- `API`
  Google / Gemini API key used by the LLM wrapper in `cyberSaviour/agents/god/llm.py`

### Frontend config

The frontend uses:

- `VITE_API_BASE_URL`

If not set, it defaults to:

```text
http://localhost:8000
```

You can create a frontend `.env` file such as:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Running Main Workflows

### 1. Run a demo pipeline from the backend

You can POST a set of events directly to the pipeline:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/api/pipeline/run `
  -ContentType "application/json" `
  -Body '{"events":[{"source_ip":"192.168.1.5","event_type":"failed_login","protocol":null,"raw":"Failed password from 192.168.1.5"}]}'
```

### 2. Run a CybORG scenario from the main app

List available scenarios:

```powershell
Invoke-RestMethod http://localhost:8000/api/cyborg/scenarios
```

Run a scenario:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/api/cyborg/run-scenario `
  -ContentType "application/json" `
  -Body '{"scenario_name":"Scenario1","num_steps":20}'
```

You can also run this flow from the frontend at `/cyborg`.

### 3. Run a forensic analysis from the main app

List available benchmark events:

```powershell
Invoke-RestMethod http://localhost:8000/api/forensic/events?benchmark=CFA
```

Analyze a benchmark event:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/api/forensic/analyze `
  -ContentType "application/json" `
  -Body '{"event_id":"0","benchmark":"CFA"}'
```

You can also run this flow from the frontend at `/forensic`.

### 4. Reset demo state

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/api/demo/reset `
  -ContentType "application/json" `
  -Body '{}'
```

This clears in-memory alerts, incidents, missions, responses, and the game layer state.

## API Overview

The main API server is implemented in `cyberSaviour/server/app.py`.

### Health and state

- `GET /health`
- `GET /api/game-state`
- `GET /api/achievements`
- `GET /api/missions`
- `GET /api/alerts`
- `GET /api/incidents`
- `GET /api/agents`
- `GET /api/response-actions`
- `GET /api/memory`
- `GET /api/responses`
- `POST /api/demo/reset`

### Pipeline execution

- `POST /api/pipeline/run`
- `POST /api/pipeline/result`

### Human approval

- `POST /api/response-actions/{action_id}/decision`
- `POST /api/missions/{mission_id}/complete`

### CybORG integration

- `GET /api/cyborg/scenarios`
- `POST /api/cyborg/run-scenario`

### Forensic integration

- `GET /api/forensic/events`
- `POST /api/forensic/analyze`

### Realtime channel

- `WS /ws`

The frontend uses this WebSocket connection to receive state and pipeline updates.

## Development Commands

### Backend

```powershell
cd cyberSaviour
uvicorn server.app:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
npm run build
npm run lint
npm run test
```

### Optional Rust orchestrator

The Rust orchestrator can be found in `cyberSaviour/orchestrator`.

Example commands:

```powershell
cd cyberSaviour\orchestrator
cargo build
cargo run
```

Its job is to run pipeline work and POST shaped results back to the backend through `/api/pipeline/result`.

### Standalone Cybersleuth forensic agent

If you want to run the forensic project independently of the main app:

```powershell
cd Cybersleuth_Forensic_Agent
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd src
Copy-Item .env_example .env
python run_agent.py
```

This standalone mode is separate from the lighter-weight integrated bridge used by CyberSaviour.

### Standalone CybORG

If you want to run the CybORG package independently:

```powershell
cd CybORG
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r Requirements.txt
pip install -e .
python demo.py
```

## Troubleshooting

### `py` or `python` is not recognized

Python is either not installed or not available on your PATH. Install Python first, then reopen the terminal and recreate the virtual environment.

### Backend fails with missing `fastapi` or `uvicorn`

Install them explicitly:

```powershell
pip install fastapi uvicorn
```

### Frontend cannot reach the backend

Check that:

- the backend is running on `http://localhost:8000`
- the frontend is using the correct `VITE_API_BASE_URL`
- no other process is already using ports `8000` or `8080`

### Forensic analysis fails

Check that:

- `scapy` is installed in the active Python environment
- the benchmark data exists under `Cybersleuth_Forensic_Agent/data`
- `cyberSaviour/.env` contains a valid `API` key if you want LLM-generated narrative output

If the LLM call fails, the integration is designed to fall back to a rule-based forensic report.

### CybORG behavior does not match the upstream package

That is expected in the integrated app. The main CyberSaviour backend uses a simulator adapter, not the full live CybORG runtime.

## Typical Data Flow

### Standard pipeline flow

1. Events enter the backend through ingestion or direct API calls.
2. The pipeline processes them through detection, correlation, memory, decision, reporting, and response stages.
3. `pipeline_bridge.py` maps the internal state to frontend-ready objects.
4. The API stores the latest state in memory.
5. The backend broadcasts updates over WebSocket.
6. The frontend updates dashboards, missions, incidents, and response views in real time.

### Forensic flow

1. A user selects a benchmark event from the forensic page.
2. The backend calls the Cybersleuth bridge.
3. The bridge analyzes the PCAP and generates forensic context.
4. The resulting pipeline events are fed into the main CyberSaviour pipeline.
5. The frontend receives both forensic metadata and the normal SOC pipeline result.

### CybORG flow

1. A user starts a scenario from the CybORG page.
2. The CybORG bridge generates scenario events in CyberSaviour event format.
3. Those events are processed by the main pipeline.
4. The resulting incident, mission, and response data are shown in the same frontend used for the rest of the product.

## Current Limitations

- Most application state is stored in memory, so it resets when the backend restarts.
- The pipeline is functional but still prototype-level; some agent stages are lighter than their final intended design.
- The integrated CybORG mode uses a simulator adapter rather than the full upstream runtime.
- The main backend depends on a Google / Gemini API key for LLM-backed report generation.
- Some README and dependency behavior in the subprojects reflects their own upstream context rather than this unified app.
- The root Python requirements currently do not include `fastapi` and `uvicorn`, so they should be installed explicitly.

## Roadmap

Planned next steps for the project include:

- persistent storage for incidents, missions, memory, and response history
- stronger correlation and threat reasoning across event windows
- more realistic orchestration between the agent stages
- deeper integration of model outputs with game systems
- richer mission progression, squad roles, and boss-incident mechanics
- better evaluation and test coverage for both backend and frontend workflows

## Summary

CyberSaviour is not just a UI demo and not just a collection of security scripts. It is a unified SOC prototype that combines event processing, cyber reasoning, simulations, forensic analysis, and a game-like operator experience in one codebase.

If you want the shortest path to seeing it work:

1. start the backend from `cyberSaviour`
2. start the frontend from `frontend`
3. visit `/cyborg` or `/forensic`
4. trigger a scenario or forensic run and watch the dashboard update
