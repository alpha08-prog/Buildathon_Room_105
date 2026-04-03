# 🛡️ Agentic AI for SOCs (CyberSaviour) 🛡️

![CyberSaviour Banner](cybersaviour_banner.png)

> **"Turning Security Analysts into Cyber Warriors."**

**Agentic AI for SOCs (CyberSaviour)** is an elite, multi-agent automated Security Operations Center (SOC) designed to bridge the gap between complex security data and actionable analyst workflows. Built on a powerful Python/FastAPI backend and a high-fidelity React frontend, it transforms raw security events into immersive "Missions," "Incidents," and "Tactical Responses."

---

## 🚀 Vision

In a world where security analysts are overwhelmed by alert fatigue, **Agentic AI for SOCs (CyberSaviour)** brings order to the chaos by:
1. **Automated Triage**: A multi-agent AI pipeline (Log, Correlation, Threat agents) handles the heavy lifting of reasoning.
2. **Gamified Workflows**: Dry security tickets are translated into engaging missions with XP, achievements, and squad-based progression.
3. **Closing the Loop**: Human-in-the-loop response actions give analysts full control without the manual drudgery.

---

## 🔥 Key Pillars & Features

| Feature | Description |
| :--- | :--- |
| **🧠 Multi-Agent Pipeline** | 10+ specialized agents (Detection, Correlation, Threat, Memory, Decision, Action) operating in concert. |
| **🎮 Gamified Dashboard** | A cinematic "Command Center" featuring mission briefings, squad status, and real-time XP tracking. |
| **🔍 Forensic Bridge** | Integrated `Cybersleuth` logic for PCAP analysis, automatically extracting CVE and service context. |
| **⚔️ CybORG Integration** | Run complex cyber-range simulations from the dashboard to train analysts on multi-stage attack scenarios. |
| **📖 Knowledge Codex** | A memory layer that surfaces similar past incidents and recommended playbooks based on historical context. |
| **📊 Executive Summary** | One-click report generation highlighting business impact metrics (time saved, risk prevented). |

---

## 🏗️ Technical Architecture

### 📁 Repository Structure

```text
.
├── 🛡️ cyberSaviour/          # Core Backend (FastAPI, AI Agents, Pipeline)
│   ├── agents/               # Specialized AI reasoning units (Log, Correlation, God-Level Orchestration)
│   ├── ingestion/            # Raw data & log handlers
│   ├── integrations/         # Cybersleuth & CybORG adapters
│   ├── memory/               # Historical context engine
│   └── server/               # WebSocket & REST API
├── 💻 frontend/              # High-Fidelity UI (React + Vite + Framer Motion)
│   ├── src/components/       # Modular UI with cyberpunk aesthetics
│   ├── src/pages/           # Mission Control, Forensic, Sim, Dashboard
│   └── src/store/           # Centralized Zustand state
├── 🕵️ Cybersleuth_Forensic/  # Standalone Forensic Analysis Module
└── 🌐 CybORG/                 # Cyber Operations Research Gym (Simulator)
```

---

## 🛠️ Tech Stack & Dependencies

### **Backend**
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) 
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Scapy](https://img.shields.io/badge/Scapy-EE1F26?style=for-the-badge&logo=scapy&logoColor=white)

### **Frontend**
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

---

## ⚡ Quick Start

### 1️⃣ Clone & Initialize
```bash
git clone <your-repo-url>
cd Buildathon_Room_105
```

### 2️⃣ Backend Setup
```bash
cd cyberSaviour
# Create your .env file
echo "API=your_gemini_api_key" > .env
# Install & Run
pip install -r ../requirements.txt 
uvicorn server.app:app --reload --port 8000
```

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

> **Access points:**
> - Dashboard: `http://localhost:8080/dashboard`
> - Simulation: `http://localhost:8080/cyborg`
> - Forensic: `http://localhost:8080/forensic`

---

## 📈 Evaluation & Metrics (Judges Info)

- **Squad Coordination Score**: Multi-agent reasoning reduces analysis overhead significantly compared to manual triage.
- **Blast Radius Reduction**: Proactive isolation and response actions prevent lateral movement in seconds.
- **Risk Prevention**: Proactive hunting and correlation catch threats before they escalate.

---

## 🔮 Roadmap

- [ ] **Persistent Database**: PostgreSQL migration for long-term state.
- [ ] **Advanced Boss-Incidents**: Narrative-driven elite threats.
- [ ] **SIEM Hooking**: Direct ingest from industry tools (Splunk, Sentinel).

---

## 🤝 Support

For any questions, reach out to the **Agentic AI for SOCs (CyberSaviour) Dev Team** during the Buildathon!

---

*Made with ❤️ for the Buildathon 2026*
