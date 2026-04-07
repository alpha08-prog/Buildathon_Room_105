# 🛡️ CyberSaviour — Agentic AI for SOCs

> **"Turning Security Analysts into Cyber Warriors."**
---

## 🚀 Overview

**CyberSaviour** is an **agentic AI-powered Security Operations Center (SOC)** designed to transform overwhelming security data into **actionable intelligence and immersive workflows**.

It combines:

- ⚡ Real-time analysis
- 🧠 Multi-agent AI reasoning
- 🎮 Gamified analyst experience

The result: **faster detection, smarter response, and reduced analyst fatigue.**

---

## 🎯 Problem Statement

Security analysts today face:

- Alert fatigue from massive log streams
- Fragmented tools and workflows
- Slow manual triage and response

---

## 💡 Solution

CyberSaviour introduces a **multi-agent AI pipeline + interactive UI** that:

- Automates threat detection & correlation
- Converts incidents into **missions & tasks**
- Provides **real-time visualization + insights**
- Keeps human analysts **in control of decisions**

---

## 🔥 Key Features

### 🧠 Multi-Agent AI System

| Agent | Role |
|---|---|
| Detection Agent | Identifies threats from raw data |
| Correlation Agent | Links related events across sources |
| Threat Intelligence Agent | Enriches alerts with external context |
| Memory Agent | Retains historical incident knowledge |
| Decision Agent | Recommends response actions |
| Action Agent | Executes approved countermeasures |

### 🎮 Gamified SOC Dashboard

- Mission-based workflows
- XP & achievement system
- Squad-based progress tracking

### 🔍 Forensic Analysis Engine

- PCAP parsing using Scapy
- CVE extraction & service mapping
- Attack flow reconstruction

### ⚔️ Cyber Simulation (CybORG)

- Run attack-defense simulations
- Train analysts on real-world scenarios

### 📖 Knowledge Memory Layer

- Stores historical incidents
- Suggests similar past attacks
- Recommends response playbooks

### 📊 Executive Insights

- Risk reduction metrics
- Time saved analytics
- Business impact summaries

---

## 🏗️ Architecture Overview

```
                ┌──────────────────────────┐
                │      Frontend (UI)       │
                │ React + TS + Three.js    │
                └────────────┬─────────────┘
                             │
                    WebSockets + REST
                             │
                ┌────────────▼────────────┐
                │    FastAPI Backend      │
                │  Async APIs + Routing   │
                └────────────┬────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
 ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
 │  AI Agents  │     │  Memory DB  │     │  Forensics  │
 │ Multi-Agent │     │   SQLite    │     │   Scapy     │
 └─────────────┘     └─────────────┘     └─────────────┘
                             │
                     ┌───────▼───────┐
                     │  Gemini LLM   │
                     │  Reasoning    │
                     └───────────────┘
```

---

## 📁 Project Structure

```
.
├── 🛡️  cyberSaviour/
│   ├── agents/               # Multi-agent AI system
│   ├── ingestion/            # Log & data ingestion
│   ├── integrations/         # External tool connectors
│   ├── memory/               # Incident memory layer
│   └── server/               # FastAPI app & routing
├── 💻  frontend/
│   ├── src/components/       # Reusable UI components
│   ├── src/pages/            # Route-level pages
│   └── src/store/            # Zustand global state
├── 🕵️  Cybersleuth_Forensic/ # Forensic analysis engine
└── 🌐  CybORG/               # Attack-defense simulation
```

---

## 🛠️ Tech Stack

### ⚙️ Backend — Real-time Analysis Engine

| Technology | Purpose |
|---|---|
| **Rust** | High-performance agent orchestration |
| **Python 3.11 + FastAPI** | Async REST APIs (22+ endpoints) |
| **Gemini 1.5 Flash** | LLM-based reasoning with retry/backoff |
| **SQLite** (`incidents.db`) | Persistent memory layer |
| **WebSocket Broadcast** | Real-time updates to clients |
| **Scapy** | Network packet inspection & analysis |

### 🎨 Frontend — Analyst Experience

| Technology | Purpose |
|---|---|
| **React 18 + TypeScript** | Scalable UI architecture |
| **Vite** | Fast dev server with HMR |
| **Zustand** | Lightweight global state management |
| **Three.js** | 3D threat visualization |
| **D3 + Recharts** | Graphs & analytics |
| **Framer Motion** | Animations & UI transitions |

---

## ⚡ Getting Started

### 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd Buildathon_Room_105
```

### 2️⃣ Backend Setup

```bash
cd cyberSaviour

# Create environment file
echo "API=your_gemini_api_key" > .env

# Install dependencies
pip install -r ../requirements.txt

# Run server
uvicorn server.app:app --reload --port 8000
```

### 3️⃣ Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

### 🌐 Access the Application

| Module | URL |
|---|---|
| Dashboard | http://localhost:8080/dashboard |
| Simulation | http://localhost:8080/cyborg |
| Forensics | http://localhost:8080/forensic |

---

## 📊 Evaluation Metrics

| Metric | Impact |
|---|---|
| Squad Coordination | Reduced manual analyst effort |
| Blast Radius Reduction | Faster threat containment |
| Risk Prevention | Earlier threat detection |

---

## 🔮 Roadmap

- [ ] PostgreSQL integration (scalable memory)
- [ ] Advanced "Boss-Level" incidents
- [ ] SIEM integrations (Splunk, Sentinel)
- [ ] Multi-tenant SOC support
- [ ] Role-based access control

---

## 🧪 Future Enhancements

- AI-driven auto-remediation
- Real-time anomaly detection models
- Cross-org threat intelligence sharing

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repo, then:
git checkout -b feature-name
git commit -m "Added feature"
git push origin feature-name
```

Open a pull request and the team will review it.

---

## 📜 License

This project was built for **Buildathon 2026** and is intended for educational and innovation purposes.

---

## 💬 Support

For queries, contact the **CyberSaviour Dev Team**.

---

> ⭐ CyberSaviour is not just a tool — it is a next-generation SOC experience combining AI, visualization, and human intelligence.
>
> *Made with dedication for Buildathon 2026.*

---

## Demo Setup on a Separate PC/Laptop

This section is for running the demo on a fresh machine without changing the project code.

### Hardware Requirements

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 64-bit dual-core processor | 64-bit quad-core Intel i5 / Ryzen 5 or better |
| RAM | 8 GB | 16 GB |
| Storage | 5 GB free disk space | 10 GB+ free disk space |
| Network | Internet connection for dependency install | Stable broadband connection |
| GPU | Not required | Not required |

### Software Requirements

- **Operating System:** Windows 10/11, macOS, or Linux
- **Git:** Required to clone the repository
- **Python:** **3.11**
- **Node.js:** **20.x or newer**
- **npm:** Comes with Node.js
- **Browser:** Latest Chrome / Edge / Firefox
- **Gemini API key:** Recommended for the full AI-assisted experience (`API` value in `.env`)

### Ports Used by the Demo

- `8000` -> FastAPI backend
- `8080` -> Vite frontend

Make sure these ports are free on the machine before starting the demo.

### Fresh Machine Installation

#### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Buildathon_Room_105
```

#### 2. Create and activate a Python virtual environment

**Windows PowerShell**

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

**macOS / Linux**

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

#### 3. Install backend dependencies

```bash
pip install -r requirements.txt
pip install fastapi uvicorn
```

Note: `fastapi` and `uvicorn` are required to run the backend demo server.

#### 4. Create the backend environment file

Create `cyberSaviour/.env` with:

```env
API=your_gemini_api_key
```

Note:

- The demo can still use rule-based fallbacks in some flows if the Gemini API is unavailable.
- For the full intended multi-agent AI demo, providing the Gemini API key is strongly recommended.

#### 5. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### How to Run the Demo

Use **two terminals** on the separate PC/laptop.

#### Terminal 1 -> Start backend

```bash
cd cyberSaviour
..\.venv\Scripts\python -m uvicorn server.app:app --reload --port 8000
```

If you are not on Windows PowerShell, you can also use:

```bash
cd cyberSaviour
python -m uvicorn server.app:app --reload --port 8000
```

#### Terminal 2 -> Start frontend

```bash
cd frontend
npm run dev
```

### URLs to Open During the Demo

| Module | URL |
|---|---|
| Main dashboard | http://localhost:8080/dashboard |
| CybORG simulation | http://localhost:8080/cyborg |
| Forensic analysis | http://localhost:8080/forensic |
| System status | http://localhost:8080/status |
| Backend health check | http://localhost:8000/health |

### Demo Readiness Checklist

- Backend starts successfully on `http://localhost:8000`
- Frontend starts successfully on `http://localhost:8080`
- `cyberSaviour/.env` exists
- Python virtual environment is activated
- Dependencies are installed with `pip install -r requirements.txt` and `npm install`
- Ports `8000` and `8080` are not blocked

### Notes for Demo Day

- The frontend defaults to calling `http://localhost:8000`, so run frontend and backend on the same machine unless you intentionally reconfigure the API base URL.
- The repo already contains bundled benchmark/sample data for the CybORG and forensic demo flows.
- No dedicated GPU is required for the demo.
