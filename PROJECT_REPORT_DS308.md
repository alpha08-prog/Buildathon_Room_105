# Project Report

## CyberSaviour: Agentic AI for Security Operations, Forensic Analysis, and Privacy-Aware Incident Response

### Submitted For

**Course Name:** Data Security and Privacy  
**Course Code:** DS308  
**Professor:** Dr. Girish Revadigar  
**Institute:** IIIT Dharwad  

### Submitted By

| Team Member | Roll Number |
|---|---|
| Atharva Agrawal | 23BDS010 |
| Savya Sanchi Sharma | 23BDS052 |
| Shivansh Shukla | 23BDS054 |
| Vaibhav Sharma | 23BDS066 |

---

## Abstract

CyberSaviour is a multi-agent, AI-assisted Security Operations Center (SOC) platform designed to improve cyber threat monitoring, incident investigation, and response. The project combines real-time log ingestion, correlation analysis, threat intelligence enrichment, persistent incident memory, human-in-the-loop decision making, automated response suggestions, forensic PCAP analysis, and attack-defense simulation. The platform is supported by a FastAPI backend, a React and TypeScript frontend, a persistent SQLite memory layer, Scapy-based packet inspection, and simulation bridges for CybORG and benchmark forensic datasets.

The primary motivation behind the project is the growing difficulty of managing modern security operations using fragmented tools and manual workflows. Analysts often face alert fatigue, delayed responses, and incomplete visibility across systems. CyberSaviour addresses these issues by structuring the workflow into cooperating agents that transform raw events into actionable incident reports and recommended containment steps. The system also includes a gamified dashboard to improve analyst engagement and training outcomes.

From the perspective of Data Security and Privacy, the project is strongly aligned with secure monitoring, attack detection, privacy-aware handling of telemetry, auditable decision making, and controlled automation. The resulting platform demonstrates how AI can be used responsibly in cyber defense while maintaining human oversight for high-impact security decisions.

**Keywords:** SOC automation, data security, privacy, multi-agent systems, digital forensics, incident response, cyber simulation, threat intelligence

---

## 1. Introduction

Modern organizations generate large volumes of security-relevant data from authentication systems, web servers, endpoints, network devices, and cloud services. While this data is essential for security monitoring, it also creates a practical challenge: analysts must quickly distinguish benign events from real attacks. Traditional monitoring environments often rely on multiple disconnected tools, requiring considerable manual effort for triage, context gathering, and response.

CyberSaviour was developed as a unified platform to reduce this operational burden. The system integrates agentic AI reasoning with structured security workflows so that suspicious events can be processed in stages: detection, correlation, enrichment, memory lookup, decision support, approval, action, and reporting. In addition, the project extends beyond standard SOC functions by incorporating forensic traffic analysis and adversarial cyber-range simulation, making it useful both for incident handling and cybersecurity education.

This project is especially relevant for the course Data Security and Privacy because it addresses core themes such as threat detection, incident containment, secure storage of security records, privacy-aware telemetry usage, controlled access to sensitive operational data, and responsible AI-assisted decision making.

---

## 2. Problem Statement

Security teams face several persistent challenges:

1. Large volumes of logs create alert fatigue and reduce analyst efficiency.
2. Important attack indicators may be distributed across multiple sources and remain uncorrelated.
3. Manual response workflows delay containment during active attacks.
4. Security tools often lack historical memory of previous incidents and repeat offenders.
5. Forensic investigation is time-consuming and difficult to integrate into live response workflows.
6. Security training environments are often separate from operational monitoring systems.
7. Automated response without oversight may introduce privacy, safety, and governance risks.

The core problem addressed in this project is how to design an intelligent, integrated SOC platform that improves detection and response speed while preserving analyst control and privacy-aware handling of security telemetry.

---

## 3. Objectives

The major objectives of CyberSaviour are:

1. To build a multi-agent SOC pipeline capable of transforming raw events into actionable incident intelligence.
2. To support real-time monitoring and dashboard visualization through REST APIs and WebSockets.
3. To maintain short-term and long-term incident memory for repeat-offender detection and historical recall.
4. To integrate threat intelligence reasoning and MITRE ATT&CK-aligned categorization.
5. To include human approval for sensitive response actions.
6. To support forensic analysis of benchmark PCAP datasets using packet-level metadata.
7. To incorporate cyber-range style scenario simulation using CybORG-inspired workflows.
8. To improve usability and learning through a gamified analyst interface.
9. To align the system with security and privacy principles relevant to DS308.

---

## 4. System Overview

CyberSaviour is organized as a layered platform with four major functional blocks:

1. **Data ingestion and event processing**
   Raw events from authentication logs, web logs, system alerts, simulated attack scenarios, and forensic datasets are converted into a normalized internal state.

2. **Multi-agent reasoning pipeline**
   A sequence of agents analyzes the events, correlates suspicious behavior, enriches findings, references historical memory, recommends actions, and produces a structured response.

3. **Interactive SOC dashboard**
   A frontend dashboard displays alerts, incidents, agents, response actions, memory entries, mission progress, and system status with real-time synchronization.

4. **Training and investigation modules**
   The platform includes a forensic module for benchmark PCAP analysis and a simulation module for attack-defense scenario generation.

### High-Level Architecture

```text
Frontend Dashboard (React + TypeScript)
        |
        | REST + WebSocket
        v
FastAPI Backend
        |
        +--> Multi-Agent Pipeline
        |     Log Agent
        |     Correlation Agent
        |     Threat Agent
        |     Memory Layer
        |     Decision Layer
        |     Human-in-the-Loop
        |     Action Layer
        |     Report Agent
        |     Response Agent
        |
        +--> SQLite Long-Term Memory
        |
        +--> Forensic Analysis Bridge (Scapy + benchmark PCAPs)
        |
        +--> CybORG Scenario Bridge (simulated attack-defense pipeline)
```

---

## 5. Detailed Design and Methodology

## 5.1 Log Ingestion and Event Parsing

The system accepts structured and semi-structured events such as:

- failed authentication attempts
- suspicious web requests
- reconnaissance activity such as scans
- TCP-based network activity
- simulation-generated security events
- forensic events derived from PCAP benchmarks

The first layer of the pipeline standardizes these observations into a shared state object. This gives downstream agents a consistent representation of events and helps reduce tool fragmentation.

## 5.2 Log Agent

The Log Agent is the first decision-making component in the pipeline. It examines incoming events and converts recognizable patterns into internal alerts. Examples include:

- failed password patterns mapped to brute-force attempts
- SQL injection strings mapped to web attack alerts
- scan or nmap patterns mapped to reconnaissance alerts
- TCP protocol activity mapped to network activity alerts

This stage acts as an initial filtering and detection layer.

## 5.3 Correlation Agent

The Correlation Agent groups alerts by source IP, maintains short temporal windows, assigns threat scores, and estimates severity. It performs two important functions:

1. It reduces noise by looking at grouped behavior rather than isolated events.
2. It creates a higher-level summary that can be passed to later reasoning stages.

This is a critical improvement over naive alert-based systems because repeated low-level events may collectively indicate a serious threat campaign.

## 5.4 Threat Agent

The Threat Agent enriches correlated findings with a higher-level threat interpretation. It uses rule-based MITRE ATT&CK grounding and LLM-backed enrichment. The objective of this stage is to answer questions such as:

- What kind of attack is taking place?
- Which tactic and technique does it resemble?
- How severe is the threat likely to be?
- What impact and remediation steps are relevant?

The use of a static MITRE anchor before LLM enrichment improves consistency and reduces hallucination risk.

## 5.5 Memory Layer

One of the most important features of the project is the incident memory subsystem. The memory layer contains:

- **Short-term memory** for recent in-session incident context
- **Long-term memory** stored in SQLite for persistent historical recall

The memory layer writes normalized incidents into the database and supports recall by recency and by source IP. This enables the system to detect repeat offenders and use historical context during decision making. From a data security standpoint, this also demonstrates secure record maintenance and the importance of auditability.

## 5.6 Decision Layer

The Decision Layer uses threat context and memory context to recommend a suitable response. The system includes both hard rules and LLM-based decision support. For example:

- repeat offenders can trigger stricter handling
- SQL injection attempts can directly escalate action priority
- low-risk events may only require monitoring or logging

The output includes:

- suggested action
- reasoning
- whether human approval is required
- target IPs
- priority level

## 5.7 Human-in-the-Loop Control

The human approval stage is a major privacy and safety feature. Instead of blindly applying automated containment, CyberSaviour inserts a review gate before high-impact actions. This is important because:

- security actions can affect legitimate users or systems
- over-automation can create availability issues
- sensitive operational decisions require accountability

This design reflects responsible AI principles and is strongly aligned with the governance concerns discussed in Data Security and Privacy.

## 5.8 Action Layer

The Action Layer simulates or records the execution of approved actions such as block, isolate, escalate, or monitor. Even in prototype form, this layer is useful because it structures response logic in a form that can later be connected to real firewalls, ticketing systems, or EDR platforms.

## 5.9 Report and Response Agents

The final stages generate structured incident output for analysts and dashboards. These agents consolidate:

- threat summary
- MITRE mapping
- action taken
- affected IPs
- response status
- pipeline trace

This provides transparency and traceability, both of which are important in secure and privacy-sensitive environments.

## 5.10 Forensic Analysis Module

The forensic integration uses benchmark PCAP datasets and Scapy-based parsing to extract packet counts, protocols, ports, suspected attacker IPs, victim IPs, and suspicious payload snippets. These findings are then converted into:

- enriched forensic reports
- CyberSaviour-compatible incident data
- alert and mission artifacts for dashboard display

This module demonstrates digital evidence handling and incident reconstruction, which strengthens the practical relevance of the project.

## 5.11 CybORG Simulation Module

CyberSaviour includes a simulation bridge inspired by CybORG scenarios. Since dependency compatibility issues may arise with the original environment, the project uses a built-in scenario simulator that mirrors common attack-defense workflows such as:

- brute-force exploitation
- service discovery
- privilege escalation
- impact and disruption
- defender recovery actions

This allows the system to generate realistic event streams for training, testing, and demonstration.

## 5.12 Frontend Dashboard

The frontend is built with React, TypeScript, Vite, and supporting UI libraries. It exposes multiple views such as:

- dashboard
- missions
- incident investigation
- squad and agents
- response center
- codex or memory view
- CybORG simulation page
- forensic analysis page
- system status page

The dashboard communicates with the backend using REST APIs and WebSockets, enabling live updates for alerts, achievements, incidents, and response actions.

---

## 6. Relevance to Data Security and Privacy

This project is directly relevant to the course in the following ways:

### 6.1 Data Security

- The platform is designed to detect malicious activity that threatens confidentiality, integrity, and availability.
- It supports containment decisions such as blocking or isolating suspicious sources.
- It stores historical security intelligence in a persistent memory system.
- It aligns alerts with recognized attack frameworks such as MITRE ATT&CK.
- It supports forensic evidence interpretation using packet-level analysis.

### 6.2 Privacy Considerations

- Security telemetry may contain sensitive identifiers such as IP addresses, request paths, and traffic metadata.
- The project uses structured storage rather than uncontrolled logging, which supports better governance.
- Human approval is retained for high-risk actions, reducing the chance of privacy-intrusive or unsafe automation.
- The design can be extended with data minimization, retention limits, masking, and role-based access control.

### 6.3 Responsible AI in Security

CyberSaviour does not rely solely on opaque AI outputs. Instead, it combines:

- rule-based reasoning
- LLM enrichment
- historical memory
- human review
- structured reports

This hybrid design is important because security and privacy systems must be explainable, auditable, and operationally safe.

---

## 7. Technology Stack

| Layer | Technologies Used |
|---|---|
| Backend API | Python, FastAPI, Uvicorn |
| Agent pipeline | Python-based multi-agent architecture |
| Persistent memory | SQLite |
| Packet analysis | Scapy, PyShark support, benchmark PCAP datasets |
| AI enrichment | Gemini-based LLM integration with fallback logic |
| Frontend | React 18, TypeScript, Vite |
| State and UI | Zustand, component-based UI architecture |
| Visualization | 3D and graph-oriented frontend components |
| Simulation | CybORG-inspired scenario bridge |
| Real-time communication | WebSockets |

The backend currently exposes more than twenty API and WebSocket endpoints covering alerts, incidents, missions, response actions, game state, system status, pipeline execution, CybORG scenarios, and forensic jobs.

---

## 8. Working Flow of the System

The operational workflow of CyberSaviour can be summarized as follows:

1. Raw security events are ingested from logs, simulated attacks, or forensic sources.
2. The Log Agent identifies suspicious patterns and generates alerts.
3. The Correlation Agent groups events and computes severity scores.
4. The Threat Agent enriches the attack with MITRE and contextual intelligence.
5. The Memory Layer stores the incident and checks for repeat offenders.
6. The Decision Layer recommends an action based on threat and memory context.
7. If the action is sensitive, human approval is requested.
8. The Action Layer records the approved response.
9. The Report Agent generates a structured incident report.
10. The Response Agent produces the final analyst-facing output.
11. The backend pushes results to the frontend through APIs and WebSockets.

---

## 9. Demonstration Scenarios and Observations

The repository includes multiple practical scenarios that show how the system behaves in realistic settings.

### 9.1 Brute-Force Login Detection

Repeated failed password events from the same source IP are converted into alerts, correlated into a single suspicious actor, enriched with higher-level threat reasoning, and used to recommend blocking or monitoring actions depending on severity and history.

### 9.2 SQL Injection Attempt

Suspicious web query payloads such as tautology-based injection strings are detected by the Log Agent and escalated by the Decision Layer. This is a strong example of how the system maps low-level log evidence to security-relevant decisions.

### 9.3 Reconnaissance and Network Activity

Events indicating scans or network probing are correlated with later TCP activity, allowing the system to infer attack progression rather than treating each event independently.

### 9.4 Forensic PCAP Analysis

The forensic module processes benchmark events that include known CVEs, packet captures, and service metadata. The resulting reports help analysts understand likely attacker and victim systems, suspicious payloads, and appropriate remediation measures.

### 9.5 Attack-Defense Scenario Simulation

The simulation module generates structured attack flows inspired by CybORG scenarios such as initial access, lateral movement, and impact. These scenarios provide a controlled environment for demonstrating detection and response logic.

### Observed Strengths

- clear separation of pipeline responsibilities
- historical memory improves context awareness
- human approval improves trust and governance
- forensic and simulation modules expand practical usefulness
- gamified visualization improves usability and training appeal

---

## 10. Security and Privacy Analysis

CyberSaviour improves security operations in several ways:

1. It shortens the path from raw telemetry to response recommendation.
2. It preserves a record of incidents for audit and repeat-offender analysis.
3. It supports defense-in-depth by combining logs, memory, forensics, and simulation.
4. It prevents fully blind automation by retaining human control for impactful actions.

At the same time, the project surfaces important privacy responsibilities:

1. Stored security data may include personally or operationally sensitive metadata.
2. Long-term memory storage must be governed by retention and access policies.
3. LLM-driven enrichment should avoid unnecessary disclosure of raw sensitive inputs.
4. Any future real-world deployment should include authentication, authorization, encryption, and log redaction.

Thus, the project not only addresses data security, but also highlights how privacy must be considered in defensive monitoring systems.

---

## 11. Challenges Faced

The main implementation challenges in this project include:

1. Integrating diverse modules such as SOC workflows, forensics, simulation, and visualization into a single platform.
2. Designing a pipeline that remains useful even when external AI services fail or quotas are exhausted.
3. Balancing automation with analyst oversight.
4. Maintaining compatibility between cybersecurity tooling ecosystems with differing dependency requirements.
5. Presenting technically complex workflows in a dashboard that remains understandable for users.

These challenges are typical of real security engineering problems and make the project academically meaningful.

---

## 12. Limitations

Although the system is functional and conceptually strong, the current version has some limitations:

1. The response layer is still a prototype and does not yet connect to production firewalls or enterprise security tools.
2. Authentication and role-based access control for multi-user deployment are not yet fully implemented.
3. Privacy-preserving storage features such as masking and configurable retention are future extensions.
4. Quantitative benchmark evaluation is limited compared to full production SOC tooling.
5. Some simulation behavior is adapted through a compatibility bridge rather than direct execution of every upstream dependency.

These limitations are natural for a course project and also create strong opportunities for future work.

---

## 13. Future Scope

The project can be extended in several directions:

1. add role-based access control and analyst authentication
2. encrypt or pseudonymize stored historical telemetry
3. integrate with SIEM and EDR tools such as Splunk, Sentinel, or Wazuh
4. support multi-tenant organizational security monitoring
5. add anomaly detection models for behavior-based detection
6. improve automated response with policy-based safeguards
7. add formal evaluation metrics such as precision, recall, response latency, and analyst workload reduction
8. deploy the platform in cloud-native form for collaborative security operations

---

## 14. Conclusion

CyberSaviour is a strong course project for Data Security and Privacy because it combines practical cybersecurity engineering with responsible AI design. The platform demonstrates how multiple components of a modern SOC can be integrated into a coherent architecture: detection, correlation, threat intelligence, memory, decision support, forensic investigation, simulation, and analyst interaction.

The project does not treat security as only an attack-detection problem. It also considers historical context, human control, evidence analysis, and privacy-aware system design. As a result, CyberSaviour serves both as a technical prototype and as a meaningful demonstration of how secure and privacy-conscious systems can be built for real-world cyber defense environments.

---

## 15. References

1. MITRE ATT&CK Framework
2. FastAPI Documentation
3. React and Vite Documentation
4. SQLite Documentation
5. Scapy Documentation
6. CybORG Cyber Operations Research Gym
7. Google Gemini API integration used in the project
8. Benchmark PCAP and CFA-style forensic datasets included in the repository

---

## Appendix A: Key Project Modules Present in the Repository

| Module | Purpose |
|---|---|
| `cyberSaviour/agents/` | Multi-agent SOC pipeline |
| `cyberSaviour/memory/` | Short-term and long-term incident memory |
| `cyberSaviour/pipeline/` | Decision, human approval, and action workflow |
| `cyberSaviour/server/` | FastAPI APIs, WebSocket sync, and integration endpoints |
| `cyberSaviour/integrations/` | Bridges for forensics and simulation |
| `frontend/` | Analyst dashboard and visualization layer |
| `Cybersleuth_Forensic_Agent/` | Forensic benchmark and analysis support |
| `CybORG/` | Cyber-range and simulation-related assets |

## Appendix B: Submission Note

This report is written from the implemented repository structure and current codebase features. It can be directly converted to PDF for course submission after adding screenshots, page numbers, and any institution-specific cover formatting if required.
