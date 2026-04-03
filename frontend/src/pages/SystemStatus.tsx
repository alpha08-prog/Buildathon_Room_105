/**
 * SystemStatus.tsx — Phase 4.4
 *
 * Real-time health dashboard for all three pipeline services:
 *   🔒 CyberSaviour ASE  (FastAPI backend)
 *   ⚙️ CybORG Simulation  (/api/cyborg/scenarios)
 *   🔬 Forensic Lab        (/api/forensic/events)
 *
 * Also shows a live operations timeline from the Zustand store.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Clock, Cpu, Microscope, Lock, Zap, Shield, Server,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { detectAlertSource, detectMissionSource, SOURCE_EMOJI, SOURCE_LABELS } from '@/lib/dataMapper';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceHealth = 'checking' | 'online' | 'degraded' | 'offline';

interface ServiceResult {
  key: string;
  name: string;
  emoji: string;
  health: ServiceHealth;
  latency: number | null;
  detail: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function probeEndpoint(url: string): Promise<{ ok: boolean; latency: number; detail: string }> {
  const start = performance.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) return { ok: false, latency, detail: `HTTP ${res.status}` };
    return { ok: true, latency, detail: 'OK' };
  } catch (e) {
    return { ok: false, latency: Math.round(performance.now() - start), detail: String(e).slice(0, 60) };
  }
}

function HealthDot({ health }: { health: ServiceHealth }) {
  const cls =
    health === 'online'   ? 'bg-green-400'  :
    health === 'degraded' ? 'bg-yellow-400' :
    health === 'offline'  ? 'bg-red-400'    : 'bg-muted-foreground';
  const pulse = health === 'online' || health === 'checking';
  return (
    <span className="relative flex h-2.5 w-2.5">
      {pulse && <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-50', cls)} />}
      <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', cls)} />
    </span>
  );
}

function HealthBadge({ health }: { health: ServiceHealth }) {
  const { label, cls } = health === 'online'
    ? { label: 'Online',   cls: 'text-green-400  bg-green-400/10  border-green-400/30'  }
    : health === 'degraded'
    ? { label: 'Degraded', cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' }
    : health === 'offline'
    ? { label: 'Offline',  cls: 'text-red-400    bg-red-400/10    border-red-400/30'    }
    : { label: 'Checking…',cls: 'text-muted-foreground bg-white/5 border-white/10'      };
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border font-mono', cls)}>
      {label}
    </span>
  );
}

function ServiceCard({ svc }: { svc: ServiceResult }) {
  const Icon = svc.key === 'cyborg' ? Cpu : svc.key === 'forensic' ? Microscope : Lock;
  return (
    <GlassCard className={cn(
      'p-4 border transition-all duration-300',
      svc.health === 'online'   ? 'border-green-400/20'  :
      svc.health === 'degraded' ? 'border-yellow-400/20' :
      svc.health === 'offline'  ? 'border-red-400/20'    : 'border-white/10',
    )}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            svc.health === 'online'  ? 'bg-green-400/10'  :
            svc.health === 'offline' ? 'bg-red-400/10'    : 'bg-white/5',
          )}>
            <Icon className={cn(
              'w-4 h-4',
              svc.health === 'online'   ? 'text-green-400'  :
              svc.health === 'degraded' ? 'text-yellow-400' :
              svc.health === 'offline'  ? 'text-red-400'    : 'text-muted-foreground',
            )} />
          </div>
          <div>
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <span>{svc.emoji}</span> {svc.name}
            </p>
            <p className="text-[10px] text-muted-foreground">{svc.detail}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <HealthBadge health={svc.health} />
          {svc.latency !== null && (
            <span className="text-[9px] font-mono text-muted-foreground">{svc.latency}ms</span>
          )}
        </div>
      </div>

      {/* Latency bar */}
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            svc.health === 'online'   ? 'bg-green-400'  :
            svc.health === 'degraded' ? 'bg-yellow-400' :
            svc.health === 'offline'  ? 'bg-red-400'    : 'bg-muted-foreground',
          )}
          initial={{ width: 0 }}
          animate={{
            width: svc.latency === null ? '30%'
              : svc.latency < 100 ? '20%'
              : svc.latency < 500 ? '50%'
              : '90%',
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[9px] text-muted-foreground mt-1">
        {svc.latency === null ? 'Response time N/A'
          : svc.latency < 100  ? 'Excellent response time'
          : svc.latency < 500  ? 'Good response time'
          : 'Slow response'}
      </p>
    </GlassCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SystemStatus() {
  const { alerts, missions, cyborgRuns, forensicRuns, backendStatus, lastSyncedAt } = useStore();

  const [services, setServices] = useState<ServiceResult[]>([
    { key: 'cybersaviour', name: 'ASE Backend',   emoji: '🔒', health: 'checking', latency: null, detail: 'Probing…' },
    { key: 'cyborg',       name: 'CybORG Sim',    emoji: '⚙️', health: 'checking', latency: null, detail: 'Probing…' },
    { key: 'forensic',     name: 'Forensic Lab',  emoji: '🔬', health: 'checking', latency: null, detail: 'Probing…' },
  ]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [checking, setChecking]       = useState(false);

  const runProbes = useCallback(async () => {
    setChecking(true);
    const probes = await Promise.all([
      probeEndpoint(`${API_BASE}/health`),
      probeEndpoint(`${API_BASE}/api/cyborg/scenarios`),
      probeEndpoint(`${API_BASE}/api/forensic/events`),
    ]);

    setServices([
      {
        key: 'cybersaviour', name: 'ASE Backend', emoji: '🔒',
        health:  probes[0].ok ? 'online' : 'offline',
        latency: probes[0].latency,
        detail:  probes[0].ok ? 'All pipeline agents healthy' : probes[0].detail,
      },
      {
        key: 'cyborg', name: 'CybORG Sim', emoji: '⚙️',
        health:  probes[1].ok ? 'online' : probes[0].ok ? 'degraded' : 'offline',
        latency: probes[1].latency,
        detail:  probes[1].ok ? 'Scenarios loaded' : probes[1].detail,
      },
      {
        key: 'forensic', name: 'Forensic Lab', emoji: '🔬',
        health:  probes[2].ok ? 'online' : probes[0].ok ? 'degraded' : 'offline',
        latency: probes[2].latency,
        detail:  probes[2].ok ? 'CFA benchmark ready' : probes[2].detail,
      },
    ]);
    setLastChecked(new Date().toLocaleTimeString());
    setChecking(false);
  }, []);

  useEffect(() => { void runProbes(); }, [runProbes]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const id = setInterval(() => void runProbes(), 30_000);
    return () => clearInterval(id);
  }, [runProbes]);

  const overallHealth: ServiceHealth =
    services.every((s) => s.health === 'online')   ? 'online'   :
    services.some((s)  => s.health === 'offline')  ? 'offline'  :
    services.some((s)  => s.health === 'degraded') ? 'degraded' : 'checking';

  const recentAlerts   = [...alerts].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);
  const recentMissions = [...missions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">System Status</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time health for ASE, CybORG, and Forensic Lab pipelines.
            </p>
          </div>
          <button
            onClick={() => void runProbes()}
            disabled={checking}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', checking && 'animate-spin')} />
            {checking ? 'Checking…' : 'Refresh'}
          </button>
        </div>

        {/* ── Overall status banner ─────────────────────────────────────────── */}
        <GlassCard className={cn(
          'p-4 border',
          overallHealth === 'online'   ? 'border-green-400/30  bg-green-400/5'  :
          overallHealth === 'degraded' ? 'border-yellow-400/30 bg-yellow-400/5' :
          overallHealth === 'offline'  ? 'border-red-400/30    bg-red-400/5'    : 'border-white/10',
        )}>
          <div className="flex items-center gap-3">
            <HealthDot health={overallHealth} />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {overallHealth === 'online'   ? 'All Systems Operational'   :
                 overallHealth === 'degraded' ? 'Partial Degradation'        :
                 overallHealth === 'offline'  ? 'Backend Unreachable'        : 'Checking Services…'}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastChecked ? `Last checked: ${lastChecked}` : 'Running probe…'}
                {lastSyncedAt && ` · Last WS sync: ${new Date(lastSyncedAt).toLocaleTimeString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                backendStatus === 'connected' ? 'bg-green-400' :
                backendStatus === 'error'     ? 'bg-red-400'   :
                backendStatus === 'connecting'? 'bg-yellow-400 animate-pulse' : 'bg-muted-foreground',
              )} />
              <span className="text-[10px] text-muted-foreground font-mono capitalize">WS: {backendStatus}</span>
            </div>
          </div>
        </GlassCard>

        {/* ── Service cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((svc) => <ServiceCard key={svc.key} svc={svc} />)}
        </div>

        {/* ── Run counters ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Alerts',    value: alerts.length,   icon: AlertTriangle, color: 'text-yellow-400' },
            { label: 'Active Missions', value: missions.filter((m) => m.status === 'active').length, icon: Zap, color: 'text-primary' },
            { label: 'CybORG Runs',     value: cyborgRuns,      icon: Cpu,           color: 'text-yellow-400' },
            { label: 'Forensic Runs',   value: forensicRuns,    icon: Microscope,    color: 'text-purple-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <GlassCard key={label} className="p-4 text-center">
              <Icon className={cn('w-5 h-5 mx-auto mb-2', color)} />
              <p className="text-2xl font-black font-mono">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </GlassCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Recent Alerts Timeline ─────────────────────────────────────── */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Recent Alerts</h2>
              <span className="text-xs text-muted-foreground ml-auto">{recentAlerts.length} shown</span>
            </div>
            <div className="relative pl-5 space-y-3">
              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border/40" />
              <AnimatePresence>
                {recentAlerts.map((alert, i) => {
                  const src = detectAlertSource(alert);
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative"
                    >
                      <div className={cn(
                        'absolute left-[-14px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card',
                        alert.severity === 'critical' ? 'bg-red-400'    :
                        alert.severity === 'high'     ? 'bg-orange-400' :
                        alert.severity === 'medium'   ? 'bg-yellow-400' : 'bg-green-400',
                      )} />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{alert.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {SOURCE_EMOJI[src]} {SOURCE_LABELS[src]} · {alert.source} · {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className={cn(
                          'text-[9px] px-1.5 py-0.5 rounded border font-mono shrink-0',
                          alert.severity === 'critical' ? 'text-red-400    border-red-400/30    bg-red-400/10'    :
                          alert.severity === 'high'     ? 'text-orange-400 border-orange-400/30 bg-orange-400/10' :
                          alert.severity === 'medium'   ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                                                          'text-green-400  border-green-400/30  bg-green-400/10',
                        )}>
                          {alert.severity}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {recentAlerts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No alerts yet — run a pipeline</p>
              )}
            </div>
          </GlassCard>

          {/* ── Recent Missions ────────────────────────────────────────────── */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Recent Missions</h2>
            </div>
            <div className="space-y-2">
              {recentMissions.map((mission, i) => {
                const src = detectMissionSource(mission);
                const statusColor =
                  mission.status === 'active'    ? 'text-primary'    :
                  mission.status === 'completed' ? 'text-green-400'  :
                  mission.status === 'failed'    ? 'text-red-400'    : 'text-muted-foreground';
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10"
                  >
                    <span className="text-sm shrink-0">{SOURCE_EMOJI[src]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{mission.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {SOURCE_LABELS[src]} · {mission.difficulty} · +{mission.xpReward} XP
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn('text-[10px] font-bold capitalize', statusColor)}>
                        {mission.status}
                      </span>
                      {mission.status === 'active' ? (
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                      ) : mission.status === 'completed' ? (
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                      ) : (
                        <XCircle className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {recentMissions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No missions yet</p>
              )}
            </div>

            {/* Pipeline stage indicator */}
            <div className="mt-4 pt-3 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">ASE Pipeline Stages</p>
              <div className="flex gap-1 flex-wrap">
                {['Log', 'Correlate', 'Threat', 'Memory', 'Decision', 'Human', 'Action', 'Report', 'Response'].map((stage) => (
                  <span
                    key={stage}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono"
                  >
                    {stage}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ── Timestamp ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center pb-2">
          <Clock className="w-3 h-3" />
          <span>Auto-refreshes every 30 seconds · {lastChecked ? `Last check: ${lastChecked}` : 'Checking…'}</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
