import { create } from 'zustand';
import type {
  Achievement,
  Agent,
  Alert,
  GameState,
  Incident,
  MemoryEntry,
  Mission,
  PipelineResponse,
  ResponseAction,
  SquadAgent,
  XpEvent,
} from '@/data/mockData';
import {
  initialGameState,
  mockAchievements,
  mockAgents,
  mockAlerts,
  mockIncidents,
  mockMemoryEntries,
  mockMissions,
  mockResponses,
  mockResponseActions,
  mockSquad,
  rankTiers,
} from '@/data/mockData';
import {
  completeMissionRequest,
  decideResponseAction,
  resetDemoState as resetDemoStateRequest,
  runDemoPipeline as runDemoPipelineRequest,
} from '@/lib/api';

const XP_TABLE: Record<string, number> = {
  approve_response: 80,
  reject_response: 20,
  open_incident: 15,
  complete_mission: 200,
  view_evidence: 10,
  codex_search: 25,
  fast_approve: 50,
};

type BackendStatus = 'mock' | 'connecting' | 'connected' | 'error';

type BackendPayload = {
  achievements?: Achievement[];
  agents?: Agent[];
  alerts?: Alert[];
  gameState?: Record<string, unknown>;
  incidents?: Incident[];
  memoryEntries?: MemoryEntry[];
  missions?: Mission[];
  responses?: PipelineResponse[];
  responseActions?: ResponseAction[];
  timestamp?: string;
};

type BackendMessage = {
  data?: Record<string, unknown>;
  timestamp?: string;
  type?: string;
};

function deriveRank(xp: number): { rank: string; tier: number; xpToNextRank: number } {
  let current = rankTiers[0];
  for (const rank of rankTiers) {
    if (xp >= rank.xpRequired) current = rank;
  }

  const nextIdx = rankTiers.findIndex((rank) => rank.tier === current.tier + 1);
  const next = nextIdx !== -1 ? rankTiers[nextIdx] : null;

  return {
    rank: current.name,
    tier: current.tier,
    xpToNextRank: next ? next.xpRequired : current.xpRequired,
  };
}

function checkNewAchievements(
  state: SOCStore,
  updatedXp: number,
  updatedStreak: number,
  updatedMissions: number
): Achievement[] {
  const locked = state.achievements.filter((achievement) => !achievement.unlockedAt);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of locked) {
    let unlock = false;
    if (achievement.condition === 'missions_completed >= 1' && updatedMissions >= 1) unlock = true;
    if (achievement.condition === 'missions_completed >= 5' && updatedMissions >= 5) unlock = true;
    if (achievement.condition === 'streak >= 5' && updatedStreak >= 5) unlock = true;
    if (achievement.condition === 'boss_missions_completed >= 1' && updatedMissions >= 3) unlock = true;
    if (unlock) {
      newlyUnlocked.push({ ...achievement, unlockedAt: new Date().toISOString() });
    }
  }

  return newlyUnlocked;
}

function deriveNotifications(alerts: Alert[], responseActions: ResponseAction[]): number {
  const newAlerts = alerts.filter((alert) => alert.status === 'new').length;
  const pendingActions = responseActions.filter((action) => action.status === 'pending').length;
  return newAlerts + pendingActions;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }

  return deduped;
}

function normalizeAchievement(achievement: Partial<Achievement>): Achievement {
  return {
    id: achievement.id ?? `ach-${Date.now()}`,
    name: achievement.name ?? 'Unnamed Achievement',
    description: achievement.description ?? 'Unlocked from backend event',
    icon: achievement.icon ?? 'Trophy',
    xpReward: achievement.xpReward ?? 0,
    rarity: achievement.rarity ?? 'common',
    unlockedAt: achievement.unlockedAt,
    condition: achievement.condition ?? 'backend_event',
    category: achievement.category ?? 'discovery',
  };
}

function normalizeAlert(alert: Partial<Alert>): Alert {
  return {
    id: alert.id ?? `ALT-${Date.now()}`,
    title: alert.title ?? 'Untitled alert',
    severity: alert.severity ?? 'low',
    source: alert.source ?? 'unknown',
    timestamp: alert.timestamp ?? new Date().toISOString(),
    status: alert.status ?? 'new',
    description: alert.description ?? '',
  };
}

function normalizeIncident(incident: Partial<Incident>): Incident {
  return {
    id: incident.id ?? `INC-${Date.now()}`,
    title: incident.title ?? 'Untitled incident',
    severity: incident.severity ?? 'low',
    status: incident.status ?? 'open',
    assignedAgent: incident.assignedAgent ?? 'Unassigned',
    createdAt: incident.createdAt ?? new Date().toISOString(),
    updatedAt: incident.updatedAt ?? new Date().toISOString(),
    attackType: incident.attackType ?? 'Unknown',
    affectedSystems: incident.affectedSystems ?? [],
    summary: incident.summary ?? 'No summary generated.',
    events: incident.events ?? [],
  };
}

function normalizeAgent(agent: Partial<Agent>): Agent {
  return {
    id: agent.id ?? `agent-${Date.now()}`,
    name: agent.name ?? 'Unknown Agent',
    type: agent.type ?? 'Unknown',
    status: agent.status ?? 'idle',
    confidence: agent.confidence ?? 0,
    lastAction: agent.lastAction ?? 'Idle',
    reasoning: agent.reasoning ?? [],
    icon: agent.icon ?? 'Bot',
  };
}

function normalizeResponseAction(action: Partial<ResponseAction>): ResponseAction {
  return {
    id: action.id ?? `RA-${Date.now()}`,
    action: action.action ?? 'Review',
    actionStatus: action.actionStatus,
    target: action.target ?? 'unknown',
    pipelineSteps: action.pipelineSteps,
    priority: action.priority,
    report: action.report,
    riskLevel: action.riskLevel ?? 'low',
    explanation: action.explanation ?? '',
    requiresHumanApproval: action.requiresHumanApproval ?? false,
    reviewedAt: action.reviewedAt,
    status: action.status ?? 'pending',
    suggestedBy: action.suggestedBy ?? 'Backend',
    incidentId: action.incidentId ?? 'unknown',
    timestamp: action.timestamp,
  };
}

function normalizeMemoryEntry(entry: Partial<MemoryEntry>): MemoryEntry {
  return {
    id: entry.id ?? `MEM-${Date.now()}`,
    incidentTitle: entry.incidentTitle ?? 'Untitled memory entry',
    date: entry.date ?? new Date().toISOString().slice(0, 10),
    similarity: entry.similarity ?? 0,
    attackType: entry.attackType ?? 'Unknown',
    resolution: entry.resolution ?? 'No resolution provided.',
    tags: entry.tags ?? [],
  };
}

function normalizePipelineResponse(response: Partial<PipelineResponse>): PipelineResponse {
  return {
    id: response.id ?? `RESP-${Date.now()}`,
    incidentId: response.incidentId ?? 'unknown',
    priority: response.priority ?? 'low',
    actionTaken: response.actionTaken ?? 'log',
    actionStatus: response.actionStatus ?? 'unknown',
    ipsActedOn: response.ipsActedOn ?? [],
    report: response.report ?? 'No report generated.',
    timestamp: response.timestamp ?? new Date().toISOString(),
    pipelineSteps: response.pipelineSteps ?? [],
    requiresHumanApproval: response.requiresHumanApproval ?? false,
  };
}

function inferSeverityFromDifficulty(difficulty: Mission['difficulty']): Mission['severity'] {
  if (difficulty === 'nightmare') return 'critical';
  if (difficulty === 'hard') return 'high';
  if (difficulty === 'normal') return 'medium';
  return 'low';
}

function normalizeMission(mission: Partial<Mission>): Mission {
  const difficulty = mission.difficulty ?? 'normal';
  return {
    id: mission.id ?? `MISS-${Date.now()}`,
    incidentId: mission.incidentId ?? 'unknown',
    title: mission.title ?? 'Untitled mission',
    description: mission.description ?? 'No mission briefing available.',
    severity: mission.severity ?? inferSeverityFromDifficulty(difficulty),
    phase: mission.phase ?? 'Initial Access',
    phaseProgress: mission.phaseProgress ?? 0,
    difficulty,
    status: mission.status ?? 'active',
    xpReward: mission.xpReward ?? 0,
    bossFight: mission.bossFight ?? false,
    objectives: mission.objectives ?? [],
    squadVoiceLine: mission.squadVoiceLine,
    createdAt: mission.createdAt ?? new Date().toISOString(),
    timeLimit: mission.timeLimit,
    elapsed: mission.elapsed,
  };
}

function normalizeGameState(
  input: Record<string, unknown> | undefined,
  fallback: GameState
): GameState {
  if (!input) return fallback;

  const xp = typeof input.xp === 'number' ? input.xp : fallback.xp;
  const streak = typeof input.streak === 'number' ? input.streak : fallback.streak;
  const level = typeof input.level === 'number' ? input.level : fallback.rankTier;
  const rank = typeof input.rank === 'string' ? input.rank : fallback.rank;
  const xpToNextLevel =
    typeof input.xp_to_next_level === 'number'
      ? input.xp_to_next_level
      : typeof input.xpToNextRank === 'number'
        ? input.xpToNextRank
        : fallback.xpToNextRank;
  const missionsCompleted =
    typeof input.total_runs === 'number'
      ? input.total_runs
      : typeof input.missionsCompleted === 'number'
        ? input.missionsCompleted
        : fallback.missionsCompleted;
  const derivedRank = deriveRank(xp);

  return {
    xp,
    xpToNextRank: xpToNextLevel,
    streak,
    comboMultiplier: Math.min(5, Math.max(1, Number((1 + streak * 0.1).toFixed(1)))),
    rank,
    rankTier: Math.max(1, Math.min(5, level || derivedRank.tier)),
    missionsCompleted,
    totalXpEarned:
      typeof input.totalXpEarned === 'number' ? input.totalXpEarned : fallback.totalXpEarned,
    lastActionAt:
      typeof input.lastActionAt === 'string' ? input.lastActionAt : new Date().toISOString(),
  };
}

function mergeAchievements(existing: Achievement[], incoming: Achievement[]): Achievement[] {
  const incomingById = new Map(incoming.map((achievement) => [achievement.id, achievement]));
  const mergedExisting = existing.map(
    (achievement) => incomingById.get(achievement.id) ?? achievement
  );
  const newOnly = incoming.filter(
    (achievement) => !existing.some((current) => current.id === achievement.id)
  );
  return [...mergedExisting, ...newOnly];
}

interface SOCStore {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  agents: Agent[];
  achievements: Achievement[];
  backendError: string | null;
  backendStatus: BackendStatus;
  clearNotifications: () => void;
  completeMission: (missionId: string) => void;
  dismissAchievement: () => void;
  dismissXpEvent: (id: string) => void;
  gameState: GameState;
  hydrateBackendData: (payload: BackendPayload) => void;
  incidents: Incident[];
  incrementNotifications: () => void;
  ingestRealtimeMessage: (message: BackendMessage) => void;
  lastSyncedAt: string | null;
  memoryEntries: MemoryEntry[];
  missions: Mission[];
  notifications: number;
  pendingAchievement: Achievement | null;
  rejectResponseAction: (id: string) => Promise<void>;
  responses: PipelineResponse[];
  resetDemoState: () => Promise<void>;
  responseActions: ResponseAction[];
  runDemoPipeline: () => Promise<void>;
  selectSquadMember: (agentId: string) => void;
  setBackendStatus: (status: BackendStatus, error?: string | null) => void;
  simulationActive: boolean;
  squad: SquadAgent[];
  tickCooldowns: () => void;
  toggleSimulation: () => void;
  updateActionStatus: (id: string, status: ResponseAction['status']) => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
  xpEvents: XpEvent[];

  addXP: (actionType: string, bonus?: number, triggerPos?: { x: number; y: number }) => void;
  advanceMissionPhase: (missionId: string) => void;
  approveResponseAction: (id: string) => Promise<void>;
}

export const useStore = create<SOCStore>((set, get) => ({
  alerts: mockAlerts,
  addAlert: (alert) =>
    set((state) => {
      const alerts = [normalizeAlert(alert), ...state.alerts];
      return {
        alerts,
        notifications: deriveNotifications(alerts, state.responseActions),
      };
    }),

  agents: mockAgents,
  achievements: mockAchievements.map(normalizeAchievement),
  backendError: null,
  backendStatus: 'mock',
  clearNotifications: () => set({ notifications: 0 }),

  completeMission: (missionId) => {
    const state = get();
    const mission = state.missions.find((item) => item.id === missionId);
    if (!mission) return;

    void completeMissionRequest(missionId).catch((error) => {
      get().setBackendStatus('error', error instanceof Error ? error.message : 'Mission completion failed');
    });

    const newMissionsCount = state.gameState.missionsCompleted + 1;
    const newAchievements = checkNewAchievements(
      state,
      state.gameState.xp,
      state.gameState.streak,
      newMissionsCount
    );

    set((currentState) => ({
      achievements: newAchievements.length
        ? currentState.achievements.map((achievement) => {
            const updated = newAchievements.find((item) => item.id === achievement.id);
            return updated ?? achievement;
          })
        : currentState.achievements,
      gameState: {
        ...currentState.gameState,
        missionsCompleted: newMissionsCount,
      },
      missions: currentState.missions.map((item) =>
        item.id === missionId ? { ...item, status: 'completed' } : item
      ),
      pendingAchievement: newAchievements[0] ?? currentState.pendingAchievement,
    }));

    get().addXP('complete_mission', mission.xpReward);
  },

  dismissAchievement: () => set({ pendingAchievement: null }),
  dismissXpEvent: (id) =>
    set((state) => ({ xpEvents: state.xpEvents.filter((event) => event.id !== id) })),

  gameState: initialGameState,

  hydrateBackendData: (payload) =>
    set((state) => {
      const alerts = payload.alerts ? payload.alerts.map(normalizeAlert) : state.alerts;
      const responseActions = payload.responseActions
        ? payload.responseActions.map(normalizeResponseAction)
        : state.responseActions;

      return {
        achievements: payload.achievements
          ? payload.achievements.map(normalizeAchievement)
          : state.achievements,
        agents: payload.agents ? payload.agents.map(normalizeAgent) : state.agents,
        alerts,
        backendError: null,
        backendStatus: 'connected',
        gameState: payload.gameState
          ? normalizeGameState(payload.gameState, state.gameState)
          : state.gameState,
        incidents: payload.incidents ? payload.incidents.map(normalizeIncident) : state.incidents,
        lastSyncedAt: payload.timestamp ?? new Date().toISOString(),
        memoryEntries: payload.memoryEntries
          ? payload.memoryEntries.map(normalizeMemoryEntry)
          : state.memoryEntries,
        missions: payload.missions ? payload.missions.map(normalizeMission) : state.missions,
        notifications: deriveNotifications(alerts, responseActions),
        responses: payload.responses
          ? payload.responses.map(normalizePipelineResponse)
          : state.responses,
        responseActions,
      };
    }),

  incidents: mockIncidents,
  incrementNotifications: () => set((state) => ({ notifications: state.notifications + 1 })),

  ingestRealtimeMessage: (message) => {
    const timestamp = message.timestamp ?? new Date().toISOString();

    if (message.type === 'init' || message.type === 'demo_state_reset') {
      const data = message.data ?? {};
      get().hydrateBackendData({
        achievements: Array.isArray(data.achievements)
          ? (data.achievements as Achievement[])
          : undefined,
        agents: Array.isArray(data.agents) ? (data.agents as Agent[]) : undefined,
        alerts: Array.isArray(data.alerts) ? (data.alerts as Alert[]) : undefined,
        gameState:
          typeof data.game_state === 'object' && data.game_state !== null
            ? (data.game_state as Record<string, unknown>)
            : undefined,
        incidents: Array.isArray(data.incidents) ? (data.incidents as Incident[]) : undefined,
        memoryEntries: Array.isArray(data.memory_entries)
          ? (data.memory_entries as MemoryEntry[])
          : undefined,
        missions: Array.isArray(data.missions) ? (data.missions as Mission[]) : undefined,
        responses: Array.isArray(data.responses) ? (data.responses as PipelineResponse[]) : undefined,
        responseActions: Array.isArray(data.response_actions)
          ? (data.response_actions as ResponseAction[])
          : undefined,
        timestamp,
      });
      if (message.type === 'demo_state_reset') {
        set({
          notifications: 0,
          pendingAchievement: null,
          xpEvents: [],
        });
      }
      return;
    }

    if (message.type === 'pipeline_result') {
      const data = message.data ?? {};
      const state = get();
      const nextAlerts = Array.isArray(data.alerts)
        ? dedupeById([
            ...(data.alerts as Alert[]).map(normalizeAlert),
            ...state.alerts,
          ])
        : state.alerts;
      const nextIncidents =
        data.incident && typeof data.incident === 'object'
          ? dedupeById([
              normalizeIncident(data.incident as Incident),
              ...state.incidents,
            ])
          : state.incidents;
      const nextAgents = Array.isArray(data.agents)
        ? (data.agents as Agent[]).map(normalizeAgent)
        : state.agents;
      const nextActions = Array.isArray(data.response_actions)
        ? dedupeById([
            ...(data.response_actions as ResponseAction[]).map(normalizeResponseAction),
            ...state.responseActions,
          ])
        : state.responseActions;
      const nextMemory = Array.isArray(data.memory_entries)
        ? dedupeById([
            ...(data.memory_entries as MemoryEntry[]).map(normalizeMemoryEntry),
            ...state.memoryEntries,
          ])
        : state.memoryEntries;
      const nextMissions =
        data.mission && typeof data.mission === 'object'
          ? dedupeById([
              normalizeMission(data.mission as Mission),
              ...state.missions,
            ])
          : state.missions;
      const nextResponses =
        data.response && typeof data.response === 'object'
          ? dedupeById([
              normalizePipelineResponse(data.response as PipelineResponse),
              ...state.responses,
            ])
          : state.responses;
      const gameUpdate =
        typeof data.game_update === 'object' && data.game_update !== null
          ? (data.game_update as Record<string, unknown>)
          : undefined;
      const nextAchievements =
        Array.isArray(gameUpdate?.newly_unlocked)
          ? mergeAchievements(
              state.achievements,
              (gameUpdate.newly_unlocked as Achievement[]).map(normalizeAchievement)
            )
          : state.achievements;

      get().hydrateBackendData({
        achievements: nextAchievements,
        agents: nextAgents,
        alerts: nextAlerts,
        gameState:
          typeof gameUpdate?.game_state === 'object' && gameUpdate.game_state !== null
            ? (gameUpdate.game_state as Record<string, unknown>)
            : undefined,
        incidents: nextIncidents,
        memoryEntries: nextMemory,
        missions: nextMissions,
        responses: nextResponses,
        responseActions: nextActions,
        timestamp,
      });

      set((currentState) => {
        const xpEarned =
          typeof gameUpdate?.xp_earned === 'number' ? gameUpdate.xp_earned : 0;
        const newlyUnlocked = Array.isArray(gameUpdate?.newly_unlocked)
          ? (gameUpdate.newly_unlocked as Achievement[]).map(normalizeAchievement)
          : [];

        return {
          pendingAchievement: newlyUnlocked[0] ?? currentState.pendingAchievement,
          xpEvents:
            xpEarned > 0
              ? [
                  ...currentState.xpEvents,
                  {
                    id: `xpe-${Date.now()}`,
                    amount: xpEarned,
                    reason: 'pipeline_result',
                    multiplier: currentState.gameState.comboMultiplier,
                    timestamp,
                  },
                ].slice(-10)
              : currentState.xpEvents,
        };
      });
      return;
    }

    if (message.type === 'response_action_updated') {
      const data = message.data ?? {};
      const updatedAction =
        data.action && typeof data.action === 'object'
          ? normalizeResponseAction(data.action as ResponseAction)
          : null;
      const updatedResponse =
        data.response && typeof data.response === 'object'
          ? normalizePipelineResponse(data.response as PipelineResponse)
          : null;
      const updatedIncident =
        data.incident && typeof data.incident === 'object'
          ? normalizeIncident(data.incident as Incident)
          : null;
      const updatedMission =
        data.mission && typeof data.mission === 'object'
          ? normalizeMission(data.mission as Mission)
          : null;
      const gameUpdate =
        data.game_update && typeof data.game_update === 'object'
          ? (data.game_update as Record<string, unknown>)
          : undefined;
      const xpEarned =
        typeof gameUpdate?.xp_earned === 'number' ? gameUpdate.xp_earned : 0;

      set((state) => ({
        backendError: null,
        backendStatus: 'connected',
        gameState:
          typeof gameUpdate?.game_state === 'object' && gameUpdate.game_state !== null
            ? normalizeGameState(gameUpdate.game_state as Record<string, unknown>, state.gameState)
            : state.gameState,
        incidents: updatedIncident
          ? state.incidents.map((incident) =>
              incident.id === updatedIncident.id ? updatedIncident : incident
            )
          : state.incidents,
        lastSyncedAt: timestamp,
        missions: updatedMission
          ? state.missions.map((mission) =>
              mission.id === updatedMission.id ? updatedMission : mission
            )
          : state.missions,
        notifications: deriveNotifications(
          state.alerts,
          updatedAction
            ? state.responseActions.map((action) =>
                action.id === updatedAction.id ? updatedAction : action
              )
            : state.responseActions
        ),
        responses: updatedResponse
          ? dedupeById([updatedResponse, ...state.responses])
          : state.responses,
        responseActions: updatedAction
          ? state.responseActions.map((action) =>
              action.id === updatedAction.id ? updatedAction : action
            )
          : state.responseActions,
        xpEvents:
          xpEarned > 0
            ? [
                ...state.xpEvents,
                {
                  id: `xpe-${Date.now()}`,
                  amount: xpEarned,
                  reason: 'response_action_updated',
                  multiplier: state.gameState.comboMultiplier,
                  timestamp,
                },
              ].slice(-10)
            : state.xpEvents,
      }));
      return;
    }

    if (message.type === 'achievement_unlock') {
      const achievement =
        message.data && typeof message.data === 'object'
          ? normalizeAchievement(message.data as Partial<Achievement>)
          : null;
      if (!achievement) return;

      set((state) => ({
        achievements: mergeAchievements(state.achievements, [achievement]),
        backendError: null,
        backendStatus: 'connected',
        lastSyncedAt: timestamp,
        pendingAchievement: achievement,
      }));
      return;
    }

    if (message.type === 'mission_completed') {
      const missionData =
        message.data && typeof message.data === 'object'
          ? (message.data as Record<string, unknown>).mission
          : undefined;
      const gameStateData =
        message.data &&
        typeof message.data === 'object' &&
        typeof (message.data as Record<string, unknown>).game_state === 'object' &&
        (message.data as Record<string, unknown>).game_state !== null
          ? ((message.data as Record<string, unknown>).game_state as Record<string, unknown>)
          : undefined;
      const xpEarned =
        message.data &&
        typeof message.data === 'object' &&
        typeof (message.data as Record<string, unknown>).xp_earned === 'number'
          ? ((message.data as Record<string, unknown>).xp_earned as number)
          : 0;

      set((state) => ({
        backendError: null,
        backendStatus: 'connected',
        gameState: gameStateData ? normalizeGameState(gameStateData, state.gameState) : state.gameState,
        lastSyncedAt: timestamp,
        missions:
          missionData && typeof missionData === 'object'
            ? state.missions.map((mission) =>
                mission.id === (missionData as Mission).id
                  ? normalizeMission(missionData as Mission)
                  : mission
              )
            : state.missions,
        xpEvents:
          xpEarned > 0
            ? [
                ...state.xpEvents,
                {
                  id: `xpe-${Date.now()}`,
                  amount: xpEarned,
                  reason: 'mission_completed',
                  multiplier: state.gameState.comboMultiplier,
                  timestamp,
                },
              ].slice(-10)
            : state.xpEvents,
      }));
      return;
    }

    set({
      backendError: null,
      backendStatus: 'connected',
      lastSyncedAt: timestamp,
    });
  },

  lastSyncedAt: null,
  memoryEntries: mockMemoryEntries,
  missions: mockMissions.map(normalizeMission),
  notifications: deriveNotifications(mockAlerts, mockResponseActions),
  pendingAchievement: null,
  responses: mockResponses.map(normalizePipelineResponse),

  rejectResponseAction: async (id) => {
    const state = get();
    const action = state.responseActions.find((item) => item.id === id);
    if (!action || action.status !== 'pending') return;

    try {
      await decideResponseAction(id, 'rejected');
    } catch (error) {
      get().setBackendStatus(
        'error',
        error instanceof Error ? error.message : 'Response rejection failed'
      );
    }
  },

  resetDemoState: async () => {
    try {
      const payload = await resetDemoStateRequest();
      get().hydrateBackendData({
        achievements: payload.achievements as Achievement[],
        agents: payload.agents as Agent[],
        alerts: payload.alerts as Alert[],
        gameState: payload.game_state,
        incidents: payload.incidents as Incident[],
        memoryEntries: payload.memory_entries as MemoryEntry[],
        missions: payload.missions as Mission[],
        responses: payload.responses as PipelineResponse[],
        responseActions: payload.response_actions as ResponseAction[],
        timestamp: payload.timestamp,
      });
      set({
        notifications: 0,
        pendingAchievement: null,
        xpEvents: [],
      });
    } catch (error) {
      get().setBackendStatus(
        'error',
        error instanceof Error ? error.message : 'Demo reset failed'
      );
    }
  },

  responseActions: mockResponseActions.map(normalizeResponseAction),
  runDemoPipeline: async () => {
    if (get().simulationActive) return;

    set({ simulationActive: true });
    try {
      await runDemoPipelineRequest();
    } catch (error) {
      get().setBackendStatus(
        'error',
        error instanceof Error ? error.message : 'Demo pipeline run failed'
      );
    } finally {
      set({ simulationActive: false });
    }
  },

  selectSquadMember: (agentId) => {
    const agent = get().squad.find((item) => item.id === agentId);
    if (!agent || agent.status !== 'ready') return;

    set((state) => ({
      squad: state.squad.map((item) =>
        item.id === agentId
          ? { ...item, cooldownRemaining: item.cooldownMax, status: 'analyzing' }
          : item
      ),
    }));
    get().addXP('open_incident');
  },

  setBackendStatus: (status, error = null) =>
    set({
      backendError: error,
      backendStatus: status,
    }),

  simulationActive: false,
  squad: mockSquad,

  tickCooldowns: () =>
    set((state) => ({
      squad: state.squad.map((agent) => {
        if (agent.cooldownRemaining <= 0) {
          return { ...agent, cooldownRemaining: 0, status: 'ready' };
        }

        const next = agent.cooldownRemaining - 1;
        return {
          ...agent,
          cooldownRemaining: next,
          status: next <= 0 ? 'ready' : agent.status,
        };
      }),
    })),

  toggleSimulation: () => {
    void get().runDemoPipeline();
  },

  updateActionStatus: (id, status) =>
    set((state) => {
      const responseActions = state.responseActions.map((action) =>
        action.id === id ? { ...action, status } : action
      );

      return {
        notifications: deriveNotifications(state.alerts, responseActions),
        responseActions,
      };
    }),

  updateMissionProgress: (missionId, progress) =>
    set((state) => ({
      missions: state.missions.map((mission) =>
        mission.id === missionId
          ? { ...mission, phaseProgress: Math.min(100, progress) }
          : mission
      ),
    })),

  xpEvents: [],

  addXP: (actionType, bonus = 0, triggerPos) => {
    const state = get();
    const base = (XP_TABLE[actionType] ?? 20) + bonus;
    const multiplied = Math.round(base * state.gameState.comboMultiplier);
    const newXp = state.gameState.xp + multiplied;
    const newStreak = state.gameState.streak + 1;
    const newCombo = Math.min(5, 1 + newStreak * 0.1);
    const { rank, tier, xpToNextRank } = deriveRank(newXp);

    const xpEvent: XpEvent = {
      amount: multiplied,
      id: `xpe-${Date.now()}`,
      multiplier: state.gameState.comboMultiplier,
      reason: actionType,
      timestamp: new Date().toISOString(),
      x: triggerPos?.x,
      y: triggerPos?.y,
    };

    const newAchievements = checkNewAchievements(
      state,
      newXp,
      newStreak,
      state.gameState.missionsCompleted
    );

    set((currentState) => ({
      achievements: newAchievements.length
        ? currentState.achievements.map((achievement) => {
            const updated = newAchievements.find((item) => item.id === achievement.id);
            return updated ?? achievement;
          })
        : currentState.achievements,
      gameState: {
        ...currentState.gameState,
        comboMultiplier: parseFloat(newCombo.toFixed(1)),
        lastActionAt: new Date().toISOString(),
        rank,
        rankTier: tier,
        streak: newStreak,
        totalXpEarned: currentState.gameState.totalXpEarned + multiplied,
        xp: newXp,
        xpToNextRank,
      },
      pendingAchievement: newAchievements[0] ?? currentState.pendingAchievement,
      xpEvents: [...currentState.xpEvents, xpEvent].slice(-10),
    }));
  },

  advanceMissionPhase: (missionId) => {
    const phases: Array<Mission['phase']> = [
      'Initial Access',
      'Discovery',
      'Lateral Movement',
      'Containment',
      'Recovery',
    ];

    set((state) => ({
      missions: state.missions.map((mission) => {
        if (mission.id !== missionId) return mission;

        const currentIndex = phases.indexOf(mission.phase);
        const nextPhase =
          currentIndex < phases.length - 1 ? phases[currentIndex + 1] : mission.phase;

        return { ...mission, phase: nextPhase, phaseProgress: 0 };
      }),
    }));
  },

  approveResponseAction: async (id) => {
    const state = get();
    const action = state.responseActions.find((item) => item.id === id);
    if (!action || action.status !== 'pending') return;

    try {
      await decideResponseAction(id, 'approved');
    } catch (error) {
      get().setBackendStatus(
        'error',
        error instanceof Error ? error.message : 'Response approval failed'
      );
    }
  },
}));
