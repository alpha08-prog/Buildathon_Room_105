import { create } from 'zustand';
import {
  Alert, ResponseAction, Incident, Agent, MemoryEntry,
  Achievement, GameState, Mission,
  mockAlerts, mockResponseActions, mockIncidents, mockAgents, mockMemoryEntries,
  mockAchievements, mockGameState, mockMissions,
} from '@/data/mockData';
import {
  fetchAlerts, fetchIncidents, fetchAgents, fetchResponseActions, fetchMemory,
  fetchGameState, fetchMissions,
  createSOCWebSocket, PipelineResult, GameUpdate,
} from '@/lib/api';

interface SOCStore {
  // ── SOC data ──────────────────────────────────────────────────────────────
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  incidents: Incident[];
  agents: Agent[];
  memoryEntries: MemoryEntry[];
  responseActions: ResponseAction[];
  updateActionStatus: (id: string, status: ResponseAction['status']) => void;
  approveResponseAction: (id: string) => void;
  rejectResponseAction: (id: string) => void;

  // ── Game layer — driven by real pipeline results ──────────────────────────
  gameState: GameState;
  achievements: Achievement[];
  missions: Mission[];
  pendingAchievement: Achievement | null;
  unlockAchievement: (id: string) => void;
  dismissAchievement: () => void;
  completeMission: (id: string) => void;
  advanceMissionPhase: (id: string) => void;

  // ── UI state ──────────────────────────────────────────────────────────────
  simulationActive: boolean;
  toggleSimulation: () => void;
  notifications: number;
  incrementNotifications: () => void;
  clearNotifications: () => void;
  backendConnected: boolean;

  // ── Backend integration ───────────────────────────────────────────────────
  applyPipelineResult: (result: PipelineResult) => void;
  applyGameUpdate: (update: GameUpdate) => void;
  fetchFromBackend: () => Promise<void>;
  initWebSocket: () => WebSocket | null;
}

const MISSION_PHASES = [
  'Initial Access', 'Discovery', 'Lateral Movement', 'Containment', 'Recovery',
] as const;

export const useStore = create<SOCStore>((set, get) => ({
  // ── Initial state: mock data is the offline fallback ──────────────────────
  alerts:          mockAlerts,
  incidents:       mockIncidents,
  agents:          mockAgents,
  memoryEntries:   mockMemoryEntries,
  responseActions: mockResponseActions,

  // Game layer starts from mock defaults, replaced on first backend connection
  gameState:          mockGameState,
  achievements:       mockAchievements,
  missions:           mockMissions,
  pendingAchievement: null,

  simulationActive: false,
  notifications:    2,
  backendConnected: false,

  // ── SOC actions ───────────────────────────────────────────────────────────
  addAlert: (alert) =>
    set((s) => ({ alerts: [alert, ...s.alerts], notifications: s.notifications + 1 })),

  updateActionStatus: (id, status) =>
    set((s) => ({
      responseActions: s.responseActions.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),

  approveResponseAction: (id) =>
    set((s) => ({
      responseActions: s.responseActions.map((a) =>
        a.id === id ? { ...a, status: 'approved' as const } : a
      ),
      gameState: { ...s.gameState, xp: s.gameState.xp + 80 },
    })),

  rejectResponseAction: (id) =>
    set((s) => ({
      responseActions: s.responseActions.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const } : a
      ),
    })),

  // ── Game actions ──────────────────────────────────────────────────────────
  unlockAchievement: (id) =>
    set((s) => {
      const ach = s.achievements.find((a) => a.id === id);
      if (!ach || ach.unlockedAt) return {};
      const ts = new Date().toISOString();
      return {
        achievements: s.achievements.map((a) =>
          a.id === id ? { ...a, unlockedAt: ts } : a
        ),
        pendingAchievement: { ...ach, unlockedAt: ts },
        gameState: { ...s.gameState, xp: s.gameState.xp + ach.xpReward },
      };
    }),

  dismissAchievement: () => set({ pendingAchievement: null }),

  completeMission: (id) =>
    set((s) => ({
      missions: s.missions.map((m) =>
        m.id === id ? { ...m, status: 'completed' as const } : m
      ),
      gameState: {
        ...s.gameState,
        xp: s.gameState.xp + (s.missions.find((m) => m.id === id)?.xpReward ?? 0),
      },
    })),

  advanceMissionPhase: (id) =>
    set((s) => ({
      missions: s.missions.map((m) => {
        if (m.id !== id) return m;
        const idx = MISSION_PHASES.indexOf(m.phase as typeof MISSION_PHASES[number]);
        const next = MISSION_PHASES[Math.min(idx + 1, MISSION_PHASES.length - 1)];
        return { ...m, phase: next, phaseProgress: 0 };
      }),
    })),

  // ── UI actions ────────────────────────────────────────────────────────────
  toggleSimulation: () => set((s) => ({ simulationActive: !s.simulationActive })),
  incrementNotifications: () => set((s) => ({ notifications: s.notifications + 1 })),
  clearNotifications: ()     => set({ notifications: 0 }),

  // ── Apply a game update (XP, level, newly unlocked achievements) ──────────
  applyGameUpdate: (update) =>
    set((s) => {
      // Merge newly unlocked achievements into the existing list
      const unlockedIds = new Set(update.newly_unlocked.map((a) => a.id));
      const mergedAch = s.achievements.map((a) => {
        const real = update.newly_unlocked.find((u) => u.id === a.id);
        return real ? { ...a, unlockedAt: real.unlockedAt } : a;
      });
      // Add any achievements from backend not in local list
      for (const a of update.newly_unlocked) {
        if (!mergedAch.find((x) => x.id === a.id)) mergedAch.push(a);
      }

      const gameState: GameState = {
        level:          update.game_state.level,
        xp:             update.game_state.xp,
        xpToNextLevel:  update.game_state.xp_to_next_level ?? update.game_state.xpToNextLevel ?? 1000,
        streak:         update.game_state.streak,
        rank:           update.game_state.rank,
      };

      return {
        gameState,
        achievements: mergedAch,
        // Queue first newly-unlocked as pending (for the overlay)
        pendingAchievement: update.newly_unlocked.length > 0
          ? (s.pendingAchievement ?? update.newly_unlocked[0])
          : s.pendingAchievement,
      };
    }),

  // ── Apply a full pipeline result ──────────────────────────────────────────
  applyPipelineResult: (result) => {
    set((s) => ({
      alerts:          [...result.alerts, ...s.alerts],
      incidents:       result.incident ? [result.incident, ...s.incidents] : s.incidents,
      agents:          result.agents.length ? result.agents : s.agents,
      responseActions: [...result.response_actions, ...s.responseActions],
      memoryEntries:   result.memory_entries.length
                         ? [...result.memory_entries, ...s.memoryEntries.filter(
                             (e) => !e.id.startsWith('MEM-00')  // drop mock defaults once real data arrives
                           )]
                         : s.memoryEntries,
      missions:        result.mission ? [result.mission, ...s.missions] : s.missions,
      notifications:   s.notifications + result.alerts.length,
      backendConnected: true,
    }));

    if (result.game_update) {
      get().applyGameUpdate(result.game_update);
    }
  },

  // ── Pull all current data from REST endpoints ─────────────────────────────
  fetchFromBackend: async () => {
    try {
      const [alertsRes, incidentsRes, agentsRes, actionsRes, memoryRes, gameRes, missionsRes] =
        await Promise.all([
          fetchAlerts(),
          fetchIncidents(),
          fetchAgents(),
          fetchResponseActions(),
          fetchMemory(),
          fetchGameState(),
          fetchMissions(),
        ]);

      const gameState: GameState = gameRes.state
        ? {
            level:         gameRes.state.level,
            xp:            gameRes.state.xp,
            xpToNextLevel: (gameRes.state as any).xp_to_next_level ?? 1000,
            streak:        gameRes.state.streak,
            rank:          gameRes.state.rank,
          }
        : get().gameState;

      set({
        alerts:          alertsRes.alerts.length           ? alertsRes.alerts           : get().alerts,
        incidents:       incidentsRes.incidents.length      ? incidentsRes.incidents      : get().incidents,
        agents:          agentsRes.agents.length            ? agentsRes.agents            : get().agents,
        responseActions: actionsRes.response_actions.length ? actionsRes.response_actions : get().responseActions,
        memoryEntries:   memoryRes.memory_entries.length    ? memoryRes.memory_entries    : get().memoryEntries,
        missions:        missionsRes.missions.length        ? missionsRes.missions        : get().missions,
        gameState,
        achievements:    gameRes.achievements?.length       ? gameRes.achievements        : get().achievements,
        backendConnected: true,
      });
    } catch {
      // Backend offline — keep mock data
    }
  },

  // ── WebSocket ─────────────────────────────────────────────────────────────
  initWebSocket: () => {
    try {
      const ws = createSOCWebSocket((msg) => {
        if (msg.type === 'init') {
          // Server sends current state on connect
          const d = msg.data as any;
          if (d.game_state) {
            get().applyGameUpdate({
              game_state:     d.game_state,
              xp_earned:      0,
              newly_unlocked: [],
            });
          }
          if (d.achievements?.length) {
            set({ achievements: d.achievements });
          }
          if (d.missions?.length) {
            set((s) => ({ missions: [...d.missions, ...s.missions] }));
          }
        }

        if (msg.type === 'pipeline_result') {
          get().applyPipelineResult((msg.data as any) as PipelineResult);
        }

        if (msg.type === 'achievement_unlock') {
          const ach = msg.data as Achievement;
          set((s) => ({
            achievements: s.achievements.map((a) =>
              a.id === ach.id ? { ...a, unlockedAt: ach.unlockedAt } : a
            ),
            pendingAchievement: s.pendingAchievement ?? ach,
          }));
        }

        if (msg.type === 'mission_completed') {
          const { mission } = msg.data as any;
          set((s) => ({
            missions: s.missions.map((m) =>
              m.id === mission.id ? { ...m, status: 'completed' as const } : m
            ),
          }));
        }
      });
      return ws;
    } catch {
      return null;
    }
  },
}));
