// ─────────────────────────────────────────────────────────────────────────────
// SOC Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
  description: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  assignedAgent: string;
  createdAt: string;
  updatedAt: string;
  attackType: string;
  affectedSystems: string[];
  summary: string;
  events: IncidentEvent[];
}

export interface IncidentEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  source: string;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  confidence: number;
  lastAction: string;
  reasoning: string[];
  icon: string;
}

export interface ResponseAction {
  id: string;
  action: string;
  target: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  suggestedBy: string;
  incidentId: string;
  actionStatus?: string;
  pipelineSteps?: string[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  report?: string;
  requiresHumanApproval?: boolean;
  reviewedAt?: string;
  timestamp?: string;
}

export interface MemoryEntry {
  id: string;
  incidentTitle: string;
  date: string;
  similarity: number;
  attackType: string;
  resolution: string;
  tags: string[];
}

export interface PipelineResponse {
  id: string;
  incidentId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionTaken: string;
  actionStatus: string;
  ipsActedOn: string[];
  report: string;
  timestamp: string;
  pipelineSteps: string[];
  requiresHumanApproval: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gamification Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type MissionPhase =
  | 'Initial Access'
  | 'Discovery'
  | 'Lateral Movement'
  | 'Containment'
  | 'Recovery';

export type MissionDifficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export type MissionStatus = 'active' | 'completed' | 'failed' | 'briefing';

export interface Mission {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  phase: MissionPhase;
  phaseProgress: number; // 0-100
  difficulty: MissionDifficulty;
  status: MissionStatus;
  xpReward: number;
  bossFight: boolean;
  objectives: MissionObjective[];
  squadVoiceLine?: string;
  createdAt: string;
  timeLimit?: number; // seconds
  elapsed?: number;   // seconds
}

export interface MissionObjective {
  id: string;
  description: string;
  completed: boolean;
  xpBonus: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;           // lucide icon name
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  condition: string;
  category: 'combat' | 'speed' | 'streak' | 'mastery' | 'discovery' | 'cyborg' | 'forensic';
}

export interface SquadAgent {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  trust: number;          // 0–100
  cooldownMax: number;    // seconds
  cooldownRemaining: number;
  status: 'ready' | 'cooldown' | 'analyzing' | 'offline';
  level: number;
  xpToNextLevel: number;
  currentXp: number;
  voiceLines: string[];
  lastVoiceLine?: string;
  abilities: SquadAbility[];
  kills: number;          // missions participated in
}

export interface SquadAbility {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  xpCost: number;
}

export interface GameState {
  xp: number;
  xpToNextRank: number;
  streak: number;
  comboMultiplier: number;
  rank: string;
  rankTier: number;       // 1–5
  missionsCompleted: number;
  totalXpEarned: number;
  lastActionAt?: string;
}

export interface XpEvent {
  id: string;
  amount: number;
  reason: string;
  multiplier: number;
  timestamp: string;
  x?: number;
  y?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOC Mock Data
// ─────────────────────────────────────────────────────────────────────────────

export const mockAlerts: Alert[] = [
  { id: 'ALT-001', title: 'Brute Force SSH Login Detected', severity: 'critical', source: '10.0.1.45', timestamp: '2024-12-15T14:32:00Z', status: 'new', description: 'Multiple failed SSH login attempts from external IP' },
  { id: 'ALT-002', title: 'Suspicious DNS Exfiltration', severity: 'high', source: '10.0.2.12', timestamp: '2024-12-15T14:28:00Z', status: 'investigating', description: 'Unusual DNS query patterns detected suggesting data exfiltration' },
  { id: 'ALT-003', title: 'Malware Signature Match', severity: 'critical', source: '10.0.3.88', timestamp: '2024-12-15T14:25:00Z', status: 'new', description: 'Known malware signature detected in downloaded file' },
  { id: 'ALT-004', title: 'Privilege Escalation Attempt', severity: 'high', source: '10.0.1.22', timestamp: '2024-12-15T14:20:00Z', status: 'new', description: 'Unauthorized privilege escalation detected on server' },
  { id: 'ALT-005', title: 'Anomalous Network Traffic', severity: 'medium', source: '10.0.4.55', timestamp: '2024-12-15T14:15:00Z', status: 'investigating', description: 'Unusual outbound traffic volume detected' },
  { id: 'ALT-006', title: 'Failed Authentication Spike', severity: 'medium', source: '10.0.1.10', timestamp: '2024-12-15T14:10:00Z', status: 'resolved', description: 'Sudden increase in failed auth attempts across multiple services' },
  { id: 'ALT-007', title: 'Port Scan Detected', severity: 'low', source: '192.168.1.100', timestamp: '2024-12-15T14:05:00Z', status: 'resolved', description: 'Sequential port scanning from internal host' },
];

export const mockIncidents: Incident[] = [
  {
    id: 'INC-001',
    title: 'Advanced Persistent Threat - Lateral Movement',
    severity: 'critical',
    status: 'investigating',
    assignedAgent: 'Correlation Agent',
    createdAt: '2024-12-15T13:00:00Z',
    updatedAt: '2024-12-15T14:30:00Z',
    attackType: 'Lateral Movement (T1021)',
    affectedSystems: ['DC-01', 'WEB-03', 'DB-02'],
    summary: 'An attacker has gained initial access via compromised credentials and is attempting lateral movement across the network using RDP and SMB protocols.',
    events: [
      { id: 'E1', timestamp: '2024-12-15T13:00:00Z', type: 'Initial Access', description: 'Compromised credentials used to access VPN', source: 'VPN Gateway' },
      { id: 'E2', timestamp: '2024-12-15T13:15:00Z', type: 'Discovery', description: 'Active Directory enumeration detected', source: 'DC-01' },
      { id: 'E3', timestamp: '2024-12-15T13:30:00Z', type: 'Lateral Movement', description: 'RDP session to WEB-03 from compromised account', source: 'WEB-03' },
      { id: 'E4', timestamp: '2024-12-15T14:00:00Z', type: 'Credential Access', description: 'Mimikatz execution detected', source: 'WEB-03' },
      { id: 'E5', timestamp: '2024-12-15T14:20:00Z', type: 'Lateral Movement', description: 'SMB connection to DB-02', source: 'DB-02' },
    ]
  },
  {
    id: 'INC-002',
    title: 'Ransomware Pre-Deployment Activity',
    severity: 'critical',
    status: 'open',
    assignedAgent: 'Threat Intelligence Agent',
    createdAt: '2024-12-15T12:00:00Z',
    updatedAt: '2024-12-15T14:00:00Z',
    attackType: 'Pre-Ransomware (T1486)',
    affectedSystems: ['FS-01', 'FS-02'],
    summary: 'Indicators consistent with ransomware pre-deployment detected including shadow copy deletion and backup disruption.',
    events: [
      { id: 'E6', timestamp: '2024-12-15T12:00:00Z', type: 'Execution', description: 'PowerShell script execution with encoded commands', source: 'FS-01' },
      { id: 'E7', timestamp: '2024-12-15T12:30:00Z', type: 'Impact', description: 'Volume Shadow Copy deletion detected', source: 'FS-01' },
      { id: 'E8', timestamp: '2024-12-15T13:00:00Z', type: 'Defense Evasion', description: 'Windows Defender disabled via registry', source: 'FS-02' },
    ]
  },
  {
    id: 'INC-003',
    title: 'Data Exfiltration via DNS Tunneling',
    severity: 'high',
    status: 'contained',
    assignedAgent: 'Log Analysis Agent',
    createdAt: '2024-12-14T20:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
    attackType: 'Exfiltration (T1048)',
    affectedSystems: ['WORKSTATION-15'],
    summary: 'DNS tunneling detected from internal workstation. Data being encoded in DNS queries to external domain.',
    events: []
  },
];

export const mockAgents: Agent[] = [
  {
    id: 'agent-1', name: 'Log Analysis Agent', type: 'Analysis', status: 'active', confidence: 94,
    lastAction: 'Parsed 12,847 log entries in last 5 minutes',
    reasoning: ['Ingesting logs from SIEM pipeline...', 'Detected anomalous pattern in authentication logs', 'Cross-referencing with known IOCs...', 'Mapping to MITRE ATT&CK framework: T1078 (Valid Accounts)', 'Confidence: 94% — High correlation with known attack pattern'],
    icon: 'FileSearch',
  },
  {
    id: 'agent-2', name: 'Correlation Agent', type: 'Correlation', status: 'processing', confidence: 87,
    lastAction: 'Correlating events across 3 data sources',
    reasoning: ['Analyzing temporal relationships between events...', 'Found 5 related events within 30-minute window', 'Building attack chain graph...', 'Lateral movement pattern detected across DC-01 → WEB-03 → DB-02', 'Confidence: 87% — Strong correlation'],
    icon: 'Network',
  },
  {
    id: 'agent-3', name: 'Threat Intelligence Agent', type: 'Intelligence', status: 'active', confidence: 91,
    lastAction: 'Matched 3 IOCs against threat feeds',
    reasoning: ['Querying threat intelligence feeds...', 'IP 185.220.101.34 found in known C2 database', 'Hash match: file signature matches known ransomware variant', 'TTPs consistent with APT29 operations', 'Confidence: 91% — Multiple IOC matches confirmed'],
    icon: 'Shield',
  },
  {
    id: 'agent-4', name: 'Response Agent', type: 'Response', status: 'idle', confidence: 96,
    lastAction: 'Awaiting approval for 2 response actions',
    reasoning: ['Evaluating response options...', 'Recommended: Block IP 185.220.101.34 at firewall', 'Recommended: Isolate host WEB-03 from network', 'Risk assessment: Low collateral impact', 'Confidence: 96% — Actions aligned with playbook'],
    icon: 'Zap',
  },
];

export const mockResponseActions: ResponseAction[] = [
  { id: 'RA-001', action: 'Block IP', target: '185.220.101.34', riskLevel: 'low', explanation: 'Known C2 server. Blocking will prevent further command and control communication.', status: 'pending', suggestedBy: 'Response Agent', incidentId: 'INC-001' },
  { id: 'RA-002', action: 'Isolate Host', target: 'WEB-03', riskLevel: 'medium', explanation: 'Host shows signs of compromise. Isolation will prevent lateral movement but may impact web services.', status: 'pending', suggestedBy: 'Response Agent', incidentId: 'INC-001' },
  { id: 'RA-003', action: 'Kill Process', target: 'mimikatz.exe on WEB-03', riskLevel: 'low', explanation: 'Active credential harvesting tool detected. Terminating will stop credential theft.', status: 'pending', suggestedBy: 'Correlation Agent', incidentId: 'INC-001' },
  { id: 'RA-004', action: 'Block IP', target: '45.33.32.156', riskLevel: 'low', explanation: 'Scanning source IP. Repeated port scans from this address.', status: 'approved', suggestedBy: 'Threat Intelligence Agent', incidentId: 'INC-002' },
  { id: 'RA-005', action: 'Restore Backup', target: 'FS-01 Shadow Copies', riskLevel: 'high', explanation: 'Restore deleted shadow copies to enable recovery. High risk if attacker still has access.', status: 'pending', suggestedBy: 'Response Agent', incidentId: 'INC-002' },
  { id: 'RA-006', action: 'Disable Account', target: 'svc_backup', riskLevel: 'medium', explanation: 'Compromised service account used for lateral movement. Disabling may impact backup operations.', status: 'rejected', suggestedBy: 'Correlation Agent', incidentId: 'INC-001' },
];

export const mockMemoryEntries: MemoryEntry[] = [
  { id: 'MEM-001', incidentTitle: 'SSH Brute Force Campaign - Q3 2024', date: '2024-09-12', similarity: 0.94, attackType: 'Brute Force', resolution: 'Blocked source IPs, enforced MFA', tags: ['brute-force', 'ssh', 'external'] },
  { id: 'MEM-002', incidentTitle: 'DNS Tunneling Exfiltration Attempt', date: '2024-08-05', similarity: 0.89, attackType: 'Data Exfiltration', resolution: 'Blocked malicious domains, isolated host', tags: ['dns', 'exfiltration', 'tunneling'] },
  { id: 'MEM-003', incidentTitle: 'Lateral Movement via Pass-the-Hash', date: '2024-07-22', similarity: 0.87, attackType: 'Lateral Movement', resolution: 'Reset credentials, patched SMB', tags: ['lateral-movement', 'pth', 'smb'] },
  { id: 'MEM-004', incidentTitle: 'Ransomware Deployment Prevented', date: '2024-06-18', similarity: 0.82, attackType: 'Ransomware', resolution: 'Isolated systems, restored from backup', tags: ['ransomware', 'backup', 'isolation'] },
  { id: 'MEM-005', incidentTitle: 'Phishing Campaign Targeting Finance', date: '2024-05-30', similarity: 0.76, attackType: 'Phishing', resolution: 'Blocked sender domains, user training', tags: ['phishing', 'email', 'social-engineering'] },
  { id: 'MEM-006', incidentTitle: 'Insider Threat - Data Download', date: '2024-04-14', similarity: 0.71, attackType: 'Insider Threat', resolution: 'Account suspended, HR escalation', tags: ['insider', 'dlp', 'download'] },
];

export const mockResponses: PipelineResponse[] = [
  {
    id: 'RESP-001',
    incidentId: 'INC-001',
    priority: 'critical',
    actionTaken: 'block',
    actionStatus: 'pending_human_review',
    ipsActedOn: ['185.220.101.34'],
    report: 'Threat pattern indicates lateral movement and credential abuse. Recommended immediate containment of the malicious source and impacted host.',
    timestamp: '2024-12-15T14:31:00Z',
    pipelineSteps: ['Log_Agent', 'Correlation_Agent', 'Threat_Agent', 'Memory_Layer', 'Decision_Layer', 'Report_Agent', 'Response_Agent'],
    requiresHumanApproval: true,
  },
];

export const threatChartData = [
  { time: '00:00', critical: 2, high: 5, medium: 8, low: 12 },
  { time: '04:00', critical: 1, high: 3, medium: 6, low: 10 },
  { time: '08:00', critical: 3, high: 7, medium: 12, low: 15 },
  { time: '12:00', critical: 5, high: 9, medium: 15, low: 18 },
  { time: '16:00', critical: 8, high: 14, medium: 20, low: 22 },
  { time: '20:00', critical: 4, high: 8, medium: 11, low: 14 },
  { time: 'Now',   critical: 6, high: 11, medium: 16, low: 19 },
];

export const attackGraphNodes = [
  { id: 'attacker', label: '185.220.101.34', type: 'ip'     as const, x: 50,  y: 200 },
  { id: 'vpn',      label: 'VPN Gateway',    type: 'system' as const, x: 200, y: 200 },
  { id: 'dc01',     label: 'DC-01',          type: 'system' as const, x: 350, y: 100 },
  { id: 'web03',    label: 'WEB-03',         type: 'system' as const, x: 350, y: 300 },
  { id: 'db02',     label: 'DB-02',          type: 'system' as const, x: 500, y: 200 },
  { id: 'user',     label: 'svc_backup',     type: 'user'   as const, x: 200, y: 80  },
];

export const attackGraphEdges = [
  { source: 'attacker', target: 'vpn',   label: 'VPN Login'   },
  { source: 'vpn',      target: 'dc01',  label: 'AD Enum'     },
  { source: 'vpn',      target: 'web03', label: 'RDP'         },
  { source: 'web03',    target: 'db02',  label: 'SMB'         },
  { source: 'user',     target: 'vpn',   label: 'Compromised' },
  { source: 'dc01',     target: 'user',  label: 'Creds Dumped'},
];

// ─────────────────────────────────────────────────────────────────────────────
// Gamification Mock Data
// ─────────────────────────────────────────────────────────────────────────────

export const initialGameState: GameState = {
  xp: 1340,
  xpToNextRank: 2000,
  streak: 4,
  comboMultiplier: 1.4,
  rank: 'Tier-2 Analyst',
  rankTier: 2,
  missionsCompleted: 7,
  totalXpEarned: 3340,
  lastActionAt: new Date().toISOString(),
};

export const mockMissions: Mission[] = [
  {
    id: 'MISS-001',
    incidentId: 'INC-001',
    title: 'Operation Northbound',
    description: 'APT actor executing lateral movement across core infrastructure. Intercept before DB-02 is fully compromised.',
    severity: 'critical',
    phase: 'Lateral Movement',
    phaseProgress: 65,
    difficulty: 'nightmare',
    status: 'active',
    xpReward: 300,
    bossFight: true,
    objectives: [
      { id: 'OBJ-1', description: 'Identify initial access vector', completed: true, xpBonus: 50 },
      { id: 'OBJ-2', description: 'Map lateral movement path', completed: true, xpBonus: 75 },
      { id: 'OBJ-3', description: 'Isolate compromised hosts', completed: false, xpBonus: 100 },
      { id: 'OBJ-4', description: 'Block C2 communication', completed: false, xpBonus: 75 },
    ],
    squadVoiceLine: 'Correlation Agent has locked the attack path. Strike now.',
    createdAt: '2024-12-15T13:00:00Z',
    timeLimit: 1800,
    elapsed: 1080,
  },
  {
    id: 'MISS-002',
    incidentId: 'INC-002',
    title: 'Shadow Protocol',
    description: 'Ransomware pre-deployment detected on file servers. Contain before detonation.',
    severity: 'critical',
    phase: 'Discovery',
    phaseProgress: 30,
    difficulty: 'hard',
    status: 'active',
    xpReward: 250,
    bossFight: true,
    objectives: [
      { id: 'OBJ-5', description: 'Identify affected file servers', completed: true, xpBonus: 50 },
      { id: 'OBJ-6', description: 'Recover shadow copies', completed: false, xpBonus: 100 },
      { id: 'OBJ-7', description: 'Terminate malicious processes', completed: false, xpBonus: 75 },
    ],
    squadVoiceLine: 'Ransomware indicators confirmed. We have minutes, not hours.',
    createdAt: '2024-12-15T12:00:00Z',
    timeLimit: 3600,
    elapsed: 2200,
  },
  {
    id: 'MISS-003',
    incidentId: 'INC-003',
    title: 'Silent Channel',
    description: 'DNS tunneling exfiltration in progress. Identify the channel and cut it.',
    severity: 'high',
    phase: 'Containment',
    phaseProgress: 80,
    difficulty: 'normal',
    status: 'active',
    xpReward: 150,
    bossFight: false,
    objectives: [
      { id: 'OBJ-8', description: 'Identify DNS tunnel domains', completed: true, xpBonus: 50 },
      { id: 'OBJ-9', description: 'Isolate exfiltrating host', completed: true, xpBonus: 50 },
      { id: 'OBJ-10', description: 'Block exfiltration channel', completed: false, xpBonus: 75 },
    ],
    squadVoiceLine: 'DNS channel identified. One more action to shut it down.',
    createdAt: '2024-12-14T20:00:00Z',
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: 'ACH-001', name: 'First Blood', description: 'Resolve your first security incident',
    icon: 'Sword', xpReward: 100, rarity: 'common',
    unlockedAt: '2024-12-10T10:00:00Z', condition: 'missions_completed >= 1', category: 'combat',
  },
  {
    id: 'ACH-002', name: 'Cut The C2 Chain', description: 'Block an active C2 communication channel',
    icon: 'ShieldOff', xpReward: 200, rarity: 'rare',
    unlockedAt: '2024-12-12T15:30:00Z', condition: 'c2_blocks >= 1', category: 'combat',
  },
  {
    id: 'ACH-003', name: 'Speed Demon', description: 'Resolve a critical incident in under 5 minutes',
    icon: 'Zap', xpReward: 300, rarity: 'epic',
    unlockedAt: '2024-12-14T09:15:00Z', condition: 'critical_resolve_ms < 300000', category: 'speed',
  },
  {
    id: 'ACH-004', name: 'Combo King', description: 'Reach a 5x combo multiplier',
    icon: 'Flame', xpReward: 250, rarity: 'epic',
    condition: 'streak >= 5', category: 'streak',
  },
  {
    id: 'ACH-005', name: 'Ghost Protocol', description: 'Complete a mission without any false positives',
    icon: 'Ghost', xpReward: 400, rarity: 'legendary',
    condition: 'mission_no_fp == true', category: 'mastery',
  },
  {
    id: 'ACH-006', name: 'Memory Keeper', description: 'Use the Codex to identify a matching past incident',
    icon: 'BookOpen', xpReward: 150, rarity: 'common',
    unlockedAt: '2024-12-11T11:00:00Z', condition: 'codex_matches >= 1', category: 'discovery',
  },
  {
    id: 'ACH-007', name: 'Boss Slayer', description: 'Defeat your first boss-tier incident',
    icon: 'Trophy', xpReward: 500, rarity: 'legendary',
    condition: 'boss_missions_completed >= 1', category: 'combat',
  },
  {
    id: 'ACH-008', name: 'Threat Hunter', description: 'Investigate 10 high-severity alerts',
    icon: 'Search', xpReward: 175, rarity: 'rare',
    unlockedAt: '2024-12-13T14:00:00Z', condition: 'high_alerts_investigated >= 10', category: 'mastery',
  },

  // ── CybORG achievements ──────────────────────────────────────────────────────
  {
    id: 'ACH-009', name: 'Network Operator', description: 'Run your first CybORG network simulation',
    icon: 'Cpu', xpReward: 120, rarity: 'common',
    condition: 'cyborg_runs >= 1', category: 'cyborg',
  },
  {
    id: 'ACH-010', name: 'Simulation Veteran', description: 'Complete 3 CybORG scenarios',
    icon: 'Network', xpReward: 250, rarity: 'epic',
    condition: 'cyborg_runs >= 3', category: 'cyborg',
  },

  // ── Forensic achievements ────────────────────────────────────────────────────
  {
    id: 'ACH-011', name: 'Digital Examiner', description: 'Run your first forensic PCAP analysis',
    icon: 'Microscope', xpReward: 120, rarity: 'common',
    condition: 'forensic_runs >= 1', category: 'forensic',
  },
  {
    id: 'ACH-012', name: 'Forensic Expert', description: 'Complete 5 forensic analyses',
    icon: 'FileSearch', xpReward: 300, rarity: 'epic',
    condition: 'forensic_runs >= 5', category: 'forensic',
  },
  {
    id: 'ACH-013', name: 'CVE Hunter', description: 'Identify CVEs across multiple PCAP analyses',
    icon: 'ShieldAlert', xpReward: 200, rarity: 'rare',
    condition: 'forensic_runs >= 1', category: 'forensic',
  },

  // ── Integration achievement ──────────────────────────────────────────────────
  {
    id: 'ACH-014', name: 'Full Stack Analyst', description: 'Use ASE, CybORG, and Forensic Lab in one session',
    icon: 'Trophy', xpReward: 500, rarity: 'legendary',
    condition: 'all_sources', category: 'mastery',
  },
];

export const mockSquad: SquadAgent[] = [
  {
    id: 'squad-1',
    name: 'SIGMA',
    specialty: 'Log Analysis & Anomaly Detection',
    avatar: 'S',
    trust: 88,
    cooldownMax: 30,
    cooldownRemaining: 0,
    status: 'ready',
    level: 4,
    xpToNextLevel: 500,
    currentXp: 340,
    kills: 14,
    voiceLines: [
      'Log stream clean. No anomalies in the last 60 seconds.',
      'Pattern identified. This matches a known APT signature.',
      'Authentication logs show 14 failed attempts in 2 minutes.',
      'Ingestion complete. Passing to correlation layer.',
    ],
    lastVoiceLine: 'Pattern identified. This matches a known APT signature.',
    abilities: [
      { id: 'ab-1', name: 'Deep Scan', description: 'Analyze 100k events in 10s', unlocked: true, xpCost: 0 },
      { id: 'ab-2', name: 'IOC Flashmatch', description: 'Instantly match against threat DB', unlocked: true, xpCost: 0 },
      { id: 'ab-3', name: 'Timeline Recon', description: 'Reconstruct 7-day event history', unlocked: false, xpCost: 300 },
    ],
  },
  {
    id: 'squad-2',
    name: 'NEXUS',
    specialty: 'Event Correlation & Attack Chain',
    avatar: 'N',
    trust: 72,
    cooldownMax: 45,
    cooldownRemaining: 18,
    status: 'cooldown',
    level: 3,
    xpToNextLevel: 400,
    currentXp: 210,
    kills: 9,
    voiceLines: [
      'Correlating events across 3 data sources...',
      'Attack chain confirmed. 5 nodes, 3 hops.',
      'Lateral movement detected: DC-01 → WEB-03 → DB-02.',
      'Confidence at 87%. Recommend escalation.',
    ],
    lastVoiceLine: 'Lateral movement detected: DC-01 → WEB-03 → DB-02.',
    abilities: [
      { id: 'ab-4', name: 'Graph Burst', description: 'Build attack graph in real-time', unlocked: true, xpCost: 0 },
      { id: 'ab-5', name: 'Phase Lock', description: 'Predict next attack phase', unlocked: false, xpCost: 250 },
      { id: 'ab-6', name: 'Cascade Alert', description: 'Auto-escalate correlated incidents', unlocked: false, xpCost: 400 },
    ],
  },
  {
    id: 'squad-3',
    name: 'ORACLE',
    specialty: 'Threat Intelligence & IOC Matching',
    avatar: 'O',
    trust: 95,
    cooldownMax: 60,
    cooldownRemaining: 0,
    status: 'analyzing',
    level: 5,
    xpToNextLevel: 600,
    currentXp: 450,
    kills: 21,
    voiceLines: [
      'Cross-referencing with 14 threat intelligence feeds.',
      'IP confirmed in known C2 database. High confidence.',
      'TTPs consistent with APT29. Nation-state actor suspected.',
      'Three IOCs matched. Escalating to critical.',
    ],
    lastVoiceLine: 'TTPs consistent with APT29. Nation-state actor suspected.',
    abilities: [
      { id: 'ab-7', name: 'IOC Storm', description: 'Batch-check 1000 indicators', unlocked: true, xpCost: 0 },
      { id: 'ab-8', name: 'Actor Profile', description: 'Build threat actor dossier', unlocked: true, xpCost: 0 },
      { id: 'ab-9', name: 'Zero-Day Watch', description: 'Monitor CVE feeds in real-time', unlocked: true, xpCost: 0 },
    ],
  },
  {
    id: 'squad-4',
    name: 'AEGIS',
    specialty: 'Response & Containment',
    avatar: 'A',
    trust: 81,
    cooldownMax: 90,
    cooldownRemaining: 0,
    status: 'ready',
    level: 4,
    xpToNextLevel: 500,
    currentXp: 280,
    kills: 17,
    voiceLines: [
      'Response options calculated. Awaiting analyst approval.',
      'Isolation complete. Host removed from network segment.',
      'Playbook loaded. Executing containment protocol.',
      'Risk assessment: Low collateral. Recommend proceed.',
    ],
    lastVoiceLine: 'Response options calculated. Awaiting analyst approval.',
    abilities: [
      { id: 'ab-10', name: 'Auto-Block', description: 'Instantly block known malicious IPs', unlocked: true, xpCost: 0 },
      { id: 'ab-11', name: 'Host Quarantine', description: 'Network-isolate compromised hosts', unlocked: true, xpCost: 0 },
      { id: 'ab-12', name: 'Kill Chain Break', description: 'Simultaneously execute 3 responses', unlocked: false, xpCost: 500 },
    ],
  },
];

export const rankTiers = [
  { tier: 1, name: 'Tier-1 Analyst',   xpRequired: 0,    color: 'text-muted-foreground' },
  { tier: 2, name: 'Tier-2 Analyst',   xpRequired: 1000, color: 'text-primary' },
  { tier: 3, name: 'Tier-3 Analyst',   xpRequired: 3000, color: 'text-blue-400' },
  { tier: 4, name: 'Senior Operative', xpRequired: 6000, color: 'text-purple-400' },
  { tier: 5, name: 'Legend Analyst',   xpRequired: 10000, color: 'text-yellow-400' },
];
