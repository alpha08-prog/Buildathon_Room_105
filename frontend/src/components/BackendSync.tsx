import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { fetchJson, WS_BASE_URL } from '@/lib/api';

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
          responsesResponse,
          gameStateResponse,
        ] = await Promise.all([
          fetchJson<{ alerts: unknown[] }>('/api/alerts'),
          fetchJson<{ incidents: unknown[] }>('/api/incidents'),
          fetchJson<{ agents: unknown[] }>('/api/agents'),
          fetchJson<{ response_actions: unknown[] }>('/api/response-actions'),
          fetchJson<{ memory_entries: unknown[] }>('/api/memory'),
          fetchJson<{ missions: unknown[] }>('/api/missions'),
          fetchJson<{ responses: unknown[] }>('/api/responses'),
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
          responses: responsesResponse.responses as never[],
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
