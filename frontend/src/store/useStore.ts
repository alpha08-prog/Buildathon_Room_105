import { create } from 'zustand';
import {
  Alert, ResponseAction, SquadAgent, Mission, Achievement, GameState, XpEvent,
  mockAlerts, mockResponseActions, mockSquad, mockMissions, mockAchievements,
  initialGameState, rankTiers,
} from '@/data/mockData';

// ─── XP calculations ──────────────────────────────────────────────────────────
const XP_TABLE: Record<string, number> = {
  approve_response:   80,
  reject_response:    20,
  open_incident:      15,
  complete_mission:  200,
  view_evidence:      10,
  codex_search:       25,
  fast_approve:       50,   // bonus for approving within 5s
};

function deriveRank(xp: number): { rank: string; tier: number; xpToNextRank: number } {
  let current = rankTiers[0];
  for (const r of rankTiers) {
    if (xp >= r.xpRequired) current = r;
  }
  const nextIdx = rankTiers.findIndex((r) => r.tier === current.tier + 1);
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
  const locked = state.achievements.filter((a) => !a.unlockedAt);
  const newlyUnlocked: Achievement[] = [];

  for (const ach of locked) {
    let unlock = false;
    if (ach.condition === 'missions_completed >= 1'   && updatedMissions >= 1)  unlock = true;
    if (ach.condition === 'missions_completed >= 5'   && updatedMissions >= 5)  unlock = true;
    if (ach.condition === 'streak >= 5'               && updatedStreak  >= 5)   unlock = true;
    if (ach.condition === 'boss_missions_completed >= 1' && updatedMissions >= 3) unlock = true;
    if (unlock) newlyUnlocked.push({ ...ach, unlockedAt: new Date().toISOString() });
  }
  return newlyUnlocked;
}

// ─── Store Interface ──────────────────────────────────────────────────────────
interface SOCStore {
  // SOC state
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  simulationActive: boolean;
  toggleSimulation: () => void;
  responseActions: ResponseAction[];
  updateActionStatus: (id: string, status: ResponseAction['status']) => void;
  notifications: number;
  incrementNotifications: () => void;
  clearNotifications: () => void;

  // Game state
  gameState: GameState;
  missions: Mission[];
  achievements: Achievement[];
  squad: SquadAgent[];
  xpEvents: XpEvent[];
  pendingAchievement: Achievement | null;

  // Game actions
  addXP: (actionType: string, bonus?: number, triggerPos?: { x: number; y: number }) => void;
  approveResponseAction: (id: string) => void;
  rejectResponseAction:  (id: string) => void;
  completeMission: (missionId: string) => void;
  advanceMissionPhase: (missionId: string) => void;
  selectSquadMember: (agentId: string) => void;
  tickCooldowns: () => void;
  dismissXpEvent: (id: string) => void;
  dismissAchievement: () => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useStore = create<SOCStore>((set, get) => ({
  // ── SOC ────────────────────────────────────────────────────────────────────
  alerts: mockAlerts,
  addAlert: (alert) =>
    set((s) => ({ alerts: [alert, ...s.alerts], notifications: s.notifications + 1 })),
  simulationActive: false,
  toggleSimulation: () => set((s) => ({ simulationActive: !s.simulationActive })),
  responseActions: mockResponseActions,
  updateActionStatus: (id, status) =>
    set((s) => ({
      responseActions: s.responseActions.map((a) => (a.id === id ? { ...a, status } : a)),
    })),
  notifications: 2,
  incrementNotifications: () => set((s) => ({ notifications: s.notifications + 1 })),
  clearNotifications: () => set({ notifications: 0 }),

  // ── Game ───────────────────────────────────────────────────────────────────
  gameState: initialGameState,
  missions: mockMissions,
  achievements: mockAchievements,
  squad: mockSquad,
  xpEvents: [],
  pendingAchievement: null,

  addXP: (actionType, bonus = 0, triggerPos) => {
    const state = get();
    const base = (XP_TABLE[actionType] ?? 20) + bonus;
    const multiplied = Math.round(base * state.gameState.comboMultiplier);
    const newXp = state.gameState.xp + multiplied;
    const newStreak = state.gameState.streak + 1;
    const newCombo = Math.min(5, 1 + newStreak * 0.1);
    const { rank, tier, xpToNextRank } = deriveRank(newXp);

    const xpEvent: XpEvent = {
      id: `xpe-${Date.now()}`,
      amount: multiplied,
      reason: actionType,
      multiplier: state.gameState.comboMultiplier,
      timestamp: new Date().toISOString(),
      x: triggerPos?.x,
      y: triggerPos?.y,
    };

    const newAchievements = checkNewAchievements(
      state, newXp, newStreak, state.gameState.missionsCompleted
    );

    set((s) => ({
      gameState: {
        ...s.gameState,
        xp: newXp,
        streak: newStreak,
        comboMultiplier: parseFloat(newCombo.toFixed(1)),
        rank,
        rankTier: tier,
        xpToNextRank,
        totalXpEarned: s.gameState.totalXpEarned + multiplied,
        lastActionAt: new Date().toISOString(),
      },
      xpEvents: [...s.xpEvents, xpEvent].slice(-10),
      achievements: newAchievements.length
        ? s.achievements.map((a) => {
            const updated = newAchievements.find((n) => n.id === a.id);
            return updated ?? a;
          })
        : s.achievements,
      pendingAchievement: newAchievements[0] ?? s.pendingAchievement,
    }));
  },

  approveResponseAction: (id) => {
    const state = get();
    const action = state.responseActions.find((a) => a.id === id);
    if (!action || action.status !== 'pending') return;

    get().updateActionStatus(id, 'approved');
    get().addXP('approve_response');
  },

  rejectResponseAction: (id) => {
    const state = get();
    const action = state.responseActions.find((a) => a.id === id);
    if (!action || action.status !== 'pending') return;

    get().updateActionStatus(id, 'rejected');
    // Break streak on reject
    set((s) => ({
      gameState: { ...s.gameState, streak: 0, comboMultiplier: 1.0 },
    }));
  },

  completeMission: (missionId) => {
    const state = get();
    const mission = state.missions.find((m) => m.id === missionId);
    if (!mission) return;

    const newMissionsCount = state.gameState.missionsCompleted + 1;
    const newAchievements = checkNewAchievements(
      state, state.gameState.xp, state.gameState.streak, newMissionsCount
    );

    set((s) => ({
      missions: s.missions.map((m) =>
        m.id === missionId ? { ...m, status: 'completed' } : m
      ),
      gameState: {
        ...s.gameState,
        missionsCompleted: newMissionsCount,
      },
      achievements: newAchievements.length
        ? s.achievements.map((a) => {
            const updated = newAchievements.find((n) => n.id === a.id);
            return updated ?? a;
          })
        : s.achievements,
      pendingAchievement: newAchievements[0] ?? s.pendingAchievement,
    }));

    get().addXP('complete_mission', mission.xpReward);
  },

  advanceMissionPhase: (missionId) => {
    const phases: Array<import('@/data/mockData').MissionPhase> = [
      'Initial Access', 'Discovery', 'Lateral Movement', 'Containment', 'Recovery',
    ];
    set((s) => ({
      missions: s.missions.map((m) => {
        if (m.id !== missionId) return m;
        const idx = phases.indexOf(m.phase);
        const next = idx < phases.length - 1 ? phases[idx + 1] : m.phase;
        return { ...m, phase: next, phaseProgress: 0 };
      }),
    }));
  },

  updateMissionProgress: (missionId, progress) =>
    set((s) => ({
      missions: s.missions.map((m) =>
        m.id === missionId ? { ...m, phaseProgress: Math.min(100, progress) } : m
      ),
    })),

  selectSquadMember: (agentId) => {
    const agent = get().squad.find((a) => a.id === agentId);
    if (!agent || agent.status !== 'ready') return;
    set((s) => ({
      squad: s.squad.map((a) =>
        a.id === agentId
          ? { ...a, status: 'analyzing', cooldownRemaining: a.cooldownMax }
          : a
      ),
    }));
    get().addXP('open_incident');
  },

  tickCooldowns: () =>
    set((s) => ({
      squad: s.squad.map((a) => {
        if (a.cooldownRemaining <= 0) return { ...a, status: 'ready', cooldownRemaining: 0 };
        const next = a.cooldownRemaining - 1;
        return { ...a, cooldownRemaining: next, status: next <= 0 ? 'ready' : a.status };
      }),
    })),

  dismissXpEvent: (id) =>
    set((s) => ({ xpEvents: s.xpEvents.filter((e) => e.id !== id) })),

  dismissAchievement: () => set({ pendingAchievement: null }),
}));
