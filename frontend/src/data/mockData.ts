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
    id: 'agent-1',
    name: 'Log Analysis Agent',
    type: 'Analysis',
    status: 'active',
    confidence: 94,
    lastAction: 'Parsed 12,847 log entries in last 5 minutes',
    reasoning: [
      'Ingesting logs from SIEM pipeline...',
      'Detected anomalous pattern in authentication logs',
      'Cross-referencing with known IOCs...',
      'Mapping to MITRE ATT&CK framework: T1078 (Valid Accounts)',
      'Confidence: 94% — High correlation with known attack pattern',
    ],
    icon: 'FileSearch',
  },
  {
    id: 'agent-2',
    name: 'Correlation Agent',
    type: 'Correlation',
    status: 'processing',
    confidence: 87,
    lastAction: 'Correlating events across 3 data sources',
    reasoning: [
      'Analyzing temporal relationships between events...',
      'Found 5 related events within 30-minute window',
      'Building attack chain graph...',
      'Lateral movement pattern detected across DC-01 → WEB-03 → DB-02',
      'Confidence: 87% — Strong correlation',
    ],
    icon: 'Network',
  },
  {
    id: 'agent-3',
    name: 'Threat Intelligence Agent',
    type: 'Intelligence',
    status: 'active',
    confidence: 91,
    lastAction: 'Matched 3 IOCs against threat feeds',
    reasoning: [
      'Querying threat intelligence feeds...',
      'IP 185.220.101.34 found in known C2 database',
      'Hash match: file signature matches known ransomware variant',
      'TTPs consistent with APT29 operations',
      'Confidence: 91% — Multiple IOC matches confirmed',
    ],
    icon: 'Shield',
  },
  {
    id: 'agent-4',
    name: 'Response Agent',
    type: 'Response',
    status: 'idle',
    confidence: 96,
    lastAction: 'Awaiting approval for 2 response actions',
    reasoning: [
      'Evaluating response options...',
      'Recommended: Block IP 185.220.101.34 at firewall',
      'Recommended: Isolate host WEB-03 from network',
      'Risk assessment: Low collateral impact',
      'Confidence: 96% — Actions aligned with playbook',
    ],
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

export const threatChartData = [
  { time: '00:00', critical: 2, high: 5, medium: 8, low: 12 },
  { time: '04:00', critical: 1, high: 3, medium: 6, low: 10 },
  { time: '08:00', critical: 3, high: 7, medium: 12, low: 15 },
  { time: '12:00', critical: 5, high: 9, medium: 15, low: 18 },
  { time: '16:00', critical: 8, high: 14, medium: 20, low: 22 },
  { time: '20:00', critical: 4, high: 8, medium: 11, low: 14 },
  { time: 'Now', critical: 6, high: 11, medium: 16, low: 19 },
];

export const attackGraphNodes = [
  { id: 'attacker', label: '185.220.101.34', type: 'ip' as const, x: 50, y: 200 },
  { id: 'vpn', label: 'VPN Gateway', type: 'system' as const, x: 200, y: 200 },
  { id: 'dc01', label: 'DC-01', type: 'system' as const, x: 350, y: 100 },
  { id: 'web03', label: 'WEB-03', type: 'system' as const, x: 350, y: 300 },
  { id: 'db02', label: 'DB-02', type: 'system' as const, x: 500, y: 200 },
  { id: 'user', label: 'svc_backup', type: 'user' as const, x: 200, y: 80 },
];

export const attackGraphEdges = [
  { source: 'attacker', target: 'vpn', label: 'VPN Login' },
  { source: 'vpn', target: 'dc01', label: 'AD Enum' },
  { source: 'vpn', target: 'web03', label: 'RDP' },
  { source: 'web03', target: 'db02', label: 'SMB' },
  { source: 'user', target: 'vpn', label: 'Compromised' },
  { source: 'dc01', target: 'user', label: 'Creds Dumped' },
];
