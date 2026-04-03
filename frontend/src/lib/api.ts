import type { PipelineResponse } from '@/data/mockData';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(
  /\/$/,
  ''
);

export const WS_BASE_URL = API_BASE_URL.replace(/^http/i, 'ws');

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

type DemoEvent = {
  event_type: string;
  protocol: string | null;
  raw: string;
  source_ip: string;
};

const DEMO_SCENARIOS: DemoEvent[][] = [
  [
    {
      event_type: 'failed_login',
      protocol: null,
      raw: 'Failed password from 192.168.1.5',
      source_ip: '192.168.1.5',
    },
    {
      event_type: 'failed_login',
      protocol: null,
      raw: 'Failed password from 192.168.1.5',
      source_ip: '192.168.1.5',
    },
    {
      event_type: 'failed_login',
      protocol: null,
      raw: 'Failed password from 192.168.1.5',
      source_ip: '192.168.1.5',
    },
    {
      event_type: 'network_activity',
      protocol: 'TCP',
      raw: 'outbound TCP connection from 192.168.1.5',
      source_ip: '192.168.1.5',
    },
  ],
  [
    {
      event_type: 'web_request',
      protocol: null,
      raw: "GET /login?id=1' or 1=1--",
      source_ip: '203.0.113.17',
    },
    {
      event_type: 'recon_activity',
      protocol: null,
      raw: 'nmap scan detected from 203.0.113.17',
      source_ip: '203.0.113.17',
    },
  ],
  [
    {
      event_type: 'recon_activity',
      protocol: null,
      raw: 'nmap scan detected from 10.0.0.3',
      source_ip: '10.0.0.3',
    },
    {
      event_type: 'network_activity',
      protocol: 'TCP',
      raw: 'outbound connection from 10.0.0.3',
      source_ip: '10.0.0.3',
    },
  ],
];

export async function runDemoPipeline(): Promise<void> {
  const scenario = DEMO_SCENARIOS[Math.floor(Math.random() * DEMO_SCENARIOS.length)];
  await postJson('/api/pipeline/run', { events: scenario });
}

export async function decideResponseAction(
  actionId: string,
  decision: 'approved' | 'rejected'
): Promise<{
  action: Record<string, unknown>;
  game_update?: Record<string, unknown>;
  incident?: Record<string, unknown>;
  mission?: Record<string, unknown>;
  response?: PipelineResponse;
  status: string;
}> {
  return postJson(`/api/response-actions/${actionId}/decision`, { decision });
}

export async function completeMissionRequest(missionId: string): Promise<Record<string, unknown>> {
  return postJson(`/api/missions/${missionId}/complete`, {});
}

export async function resetDemoState(): Promise<{
  achievements: unknown[];
  agents: unknown[];
  alerts: unknown[];
  game_state: Record<string, unknown>;
  incidents: unknown[];
  memory_entries: unknown[];
  missions: unknown[];
  response_actions: unknown[];
  responses: unknown[];
  status: string;
  timestamp: string;
}> {
  return postJson('/api/demo/reset', {});
}
