/**
 * CyberSaviour API client.
 * All endpoints go through the Vite proxy (/api → http://localhost:8000).
 */

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export interface PipelineEvent {
  source_ip: string;
  event_type: string;
  raw: string;
  protocol: string | null;
}

export interface GameUpdate {
  game_state: import("@/data/mockData").GameState;
  xp_earned: number;
  newly_unlocked: import("@/data/mockData").Achievement[];
}

export interface PipelineResult {
  alerts: import("@/data/mockData").Alert[];
  incident: import("@/data/mockData").Incident;
  agents: import("@/data/mockData").Agent[];
  response_actions: import("@/data/mockData").ResponseAction[];
  memory_entries: import("@/data/mockData").MemoryEntry[];
  mission: import("@/data/mockData").Mission | null;
  raw_response: Record<string, unknown>;
  game_update?: GameUpdate;
}

export function runPipeline(events: PipelineEvent[]): Promise<PipelineResult> {
  return post<PipelineResult>("/pipeline/run", { events });
}

// ── Data endpoints ────────────────────────────────────────────────────────────

export async function fetchAlerts() {
  return get<{ alerts: import("@/data/mockData").Alert[] }>("/alerts");
}

export async function fetchIncidents() {
  return get<{ incidents: import("@/data/mockData").Incident[] }>("/incidents");
}

export async function fetchAgents() {
  return get<{ agents: import("@/data/mockData").Agent[] }>("/agents");
}

export async function fetchResponseActions() {
  return get<{ response_actions: import("@/data/mockData").ResponseAction[] }>("/response-actions");
}

export async function fetchMemory() {
  return get<{ memory_entries: import("@/data/mockData").MemoryEntry[] }>("/memory");
}

// ── Game state ────────────────────────────────────────────────────────────────

export async function fetchGameState() {
  return get<{
    state: import("@/data/mockData").GameState;
    achievements: import("@/data/mockData").Achievement[];
  }>("/game-state");
}

export async function fetchMissions() {
  return get<{ missions: import("@/data/mockData").Mission[] }>("/missions");
}

// ── WebSocket helper ──────────────────────────────────────────────────────────

export function createSOCWebSocket(
  onMessage: (msg: { type: string; data: unknown; timestamp: string }) => void,
  onClose?: () => void,
): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      // ignore malformed frames
    }
  };

  ws.onerror = (err) => console.warn("[SOC WS] error", err);
  ws.onclose = () => {
    if (onClose) onClose();
  };

  return ws;
}
