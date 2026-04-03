# 🛡️ CyberSaviour — Agentic AI for SOCs

> **"Turning Security Analysts into Cyber Warriors."**

🎥 **Demo Video:** [Watch on Google Drive](https://drive.google.com/file/d/10ComO-U821NwsR17WvOrGK55NNjZITuM/view?usp=sharing)

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

## 👨‍💻 Team

| Role | Responsibility |
|---|---|
| 🧑‍🏫 Mentor / Professor | Guidance & oversight |
| 👨‍💻 Team Lead (Web Developer) | Architecture & backend |
| 📱 App Developer | Mobile & integrations |
| 🌐 Web Developer | Frontend & UI |

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
