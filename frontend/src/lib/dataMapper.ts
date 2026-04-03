/**
 * dataMapper.ts — Phase 4.1
 *
 * Normalises data from all three backend pipelines into unified frontend
 * types, and provides helpers consumed by Dashboard, Sidebar, and pages.
 */

import type { Mission, Alert, Achievement } from '@/data/mockData';

// ── Source identifiers ────────────────────────────────────────────────────────

export type DataSource = 'cybersaviour' | 'cyborg' | 'forensic';

/** Detect which pipeline produced a mission by inspecting its title / description. */
export function detectMissionSource(mission: Mission): DataSource {
  const title = mission.title ?? '';
  const desc  = mission.description ?? '';
  if (title.startsWith('[Forensic]') || desc.includes('CVE-') || desc.includes('PCAP')) return 'forensic';
  if (
    title.startsWith('[CybORG]') ||
    desc.includes('CybORG') ||
    desc.includes('compromised hosts') ||
    desc.includes('blue team')
  ) return 'cyborg';
  return 'cybersaviour';
}

/** Detect which pipeline produced an alert by inspecting its source field. */
export function detectAlertSource(alert: Alert): DataSource {
  const src = alert.source ?? '';
  const ttl = alert.title ?? '';
  if (src.startsWith('Forensic:') || ttl.includes('[Forensic]') || src.startsWith('CVE-')) return 'forensic';
  if (src.startsWith('CybORG:')   || ttl.includes('[CybORG]')   || src.includes('Network Sim')) return 'cyborg';
  return 'cybersaviour';
}

// ── Visual constants ──────────────────────────────────────────────────────────

export const SOURCE_LABELS: Record<DataSource, string> = {
  cybersaviour: 'ASE',
  cyborg:       'CybORG',
  forensic:     'Forensic',
};

export const SOURCE_EMOJI: Record<DataSource, string> = {
  cybersaviour: '🔒',
  cyborg:       '⚙️',
  forensic:     '🔬',
};

export const SOURCE_BADGE_CLASS: Record<DataSource, string> = {
  cybersaviour: 'text-primary      border-primary/30      bg-primary/10',
  cyborg:       'text-yellow-400   border-yellow-400/30   bg-yellow-400/10',
  forensic:     'text-purple-400   border-purple-400/30   bg-purple-400/10',
};

export const SOURCE_GLOW: Record<DataSource, string> = {
  cybersaviour: '0 0 8px hsl(155 100% 50% / 0.25)',
  cyborg:       '0 0 8px hsl(48  96%  53% / 0.25)',
  forensic:     '0 0 8px hsl(270 60%  60% / 0.25)',
};

// ── Aggregation helpers ───────────────────────────────────────────────────────

export interface SourceCounts {
  cybersaviour: number;
  cyborg: number;
  forensic: number;
}

export function countMissionsBySource(missions: Mission[]): SourceCounts {
  const counts: SourceCounts = { cybersaviour: 0, cyborg: 0, forensic: 0 };
  for (const m of missions) counts[detectMissionSource(m)]++;
  return counts;
}

export function countAlertsBySource(alerts: Alert[]): SourceCounts {
  const counts: SourceCounts = { cybersaviour: 0, cyborg: 0, forensic: 0 };
  for (const a of alerts) counts[detectAlertSource(a)]++;
  return counts;
}

// ── XP reward scaling helpers ─────────────────────────────────────────────────

/** XP for a completed forensic analysis, scaled by severity and whether attack succeeded. */
export function calcForensicXP(severity: string, attackSucceeded: boolean): number {
  const base = severity === 'critical' ? 200 : severity === 'high' ? 150 : 100;
  return attackSucceeded ? base + 50 : base;
}

/** XP for a completed CybORG scenario, scaled by steps and difficulty. */
export function calcCyborgXP(numSteps: number, difficulty: string): number {
  const base = difficulty === 'hard' ? 200 : difficulty === 'normal' ? 150 : 100;
  return Math.round(base + numSteps * 2);
}

// ── Achievement helpers ───────────────────────────────────────────────────────

/** Returns the achievement IDs that should unlock given updated counters. */
export function evaluateNewAchievements(
  locked: Achievement[],
  params: {
    missionsCompleted: number;
    streak: number;
    cyborgRuns: number;
    forensicRuns: number;
  },
): Achievement[] {
  const { missionsCompleted, streak, cyborgRuns, forensicRuns } = params;
  return locked.filter((ach) => {
    const cond = ach.condition;
    if (cond === 'missions_completed >= 1'       && missionsCompleted >= 1)  return true;
    if (cond === 'missions_completed >= 5'       && missionsCompleted >= 5)  return true;
    if (cond === 'streak >= 5'                   && streak >= 5)             return true;
    if (cond === 'boss_missions_completed >= 1'  && missionsCompleted >= 3)  return true;
    if (cond === 'cyborg_runs >= 1'              && cyborgRuns >= 1)         return true;
    if (cond === 'cyborg_runs >= 3'              && cyborgRuns >= 3)         return true;
    if (cond === 'forensic_runs >= 1'            && forensicRuns >= 1)       return true;
    if (cond === 'forensic_runs >= 5'            && forensicRuns >= 5)       return true;
    if (cond === 'all_sources'                   && cyborgRuns >= 1 && forensicRuns >= 1 && missionsCompleted >= 1) return true;
    return false;
  });
}

// ── Status health types (used by SystemStatus page) ──────────────────────────

export interface ServiceStatus {
  name: string;
  key: 'cybersaviour' | 'cyborg' | 'forensic';
  endpoint: string;
  status: 'online' | 'degraded' | 'offline' | 'checking';
  latency?: number;
  detail?: string;
}
