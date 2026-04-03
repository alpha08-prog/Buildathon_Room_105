import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(
  /\/$/,
  ''
);
const WS_BASE_URL = API_BASE_URL.replace(/^http/i, 'ws');

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unknown backend error';
}

export function BackendSync() {
  const hydrateBackendData = useStore((state) => state.hydrateBackendData);
  const ingestRealtimeMessage = useStore((state) => state.ingestRealtimeMessage);
  const setBackendStatus = useStore((state) => state.setBackendStatus);

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const loadInitialData = async () => {
      setBackendStatus('connecting');

      try {
        const [
          alertsResponse,
          incidentsResponse,
          agentsResponse,
          actionsResponse,
          memoryResponse,
          missionsResponse,
          gameStateResponse,
        ] = await Promise.all([
          fetchJson<{ alerts: unknown[] }>('/api/alerts'),
          fetchJson<{ incidents: unknown[] }>('/api/incidents'),
          fetchJson<{ agents: unknown[] }>('/api/agents'),
          fetchJson<{ response_actions: unknown[] }>('/api/response-actions'),
          fetchJson<{ memory_entries: unknown[] }>('/api/memory'),
          fetchJson<{ missions: unknown[] }>('/api/missions'),
          fetchJson<{ achievements: unknown[]; state: Record<string, unknown>; timestamp: string }>(
            '/api/game-state'
          ),
        ]);

        if (cancelled) return;

        hydrateBackendData({
          achievements: gameStateResponse.achievements as never[],
          agents: agentsResponse.agents as never[],
          alerts: alertsResponse.alerts as never[],
          gameState: gameStateResponse.state,
          incidents: incidentsResponse.incidents as never[],
          memoryEntries: memoryResponse.memory_entries as never[],
          missions: missionsResponse.missions as never[],
          responseActions: actionsResponse.response_actions as never[],
          timestamp: gameStateResponse.timestamp,
        });
      } catch (error) {
        if (cancelled) return;
        setBackendStatus('error', formatError(error));
      }
    };

    const connectWebSocket = () => {
      if (cancelled) return;

      socket = new WebSocket(`${WS_BASE_URL}/ws`);

      socket.onopen = () => {
        if (cancelled) return;
        setBackendStatus('connected');
      };

      socket.onmessage = (event) => {
        if (cancelled) return;

        try {
          ingestRealtimeMessage(JSON.parse(event.data));
        } catch (error) {
          setBackendStatus('error', formatError(error));
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (cancelled) return;
        setBackendStatus('connecting');
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      };
    };

    void loadInitialData();
    connectWebSocket();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [hydrateBackendData, ingestRealtimeMessage, setBackendStatus]);

  return null;
}
