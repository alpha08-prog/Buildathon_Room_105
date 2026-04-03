import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, Play, ChevronRight, Shield, Skull, Zap,
  AlertTriangle, CheckCircle2, Clock, Activity, Server,
  Target, Cpu, Globe,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard, SeverityBadge } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Scenario {
  name: string;
  description: string;
  difficulty: 'easy' | 'normal' | 'hard';
  max_steps: number;
  hosts: number;
}

interface CybORGResult {
  scenario: string;
  description: string;
  difficulty: string;
  steps_run: number;
  compromised_hosts: string[];
  defender_detections: number;
  ip_map: Record<string, string>;
  summary: string;
}

interface RunResult {
  cyborg: CybORGResult;
  alerts: { id: string; title: string; severity: string; source: string }[];
  incident?: { id: string; title: string; severity: string; attackType: string };
  mission?: { id: string; title: string; xpReward: number; difficulty: string; bossFight: boolean };
  game_update?: { xp_earned: number; newly_unlocked: { name: string; rarity: string }[] };
}

// ── Difficulty colours ────────────────────────────────────────────────────────

const DIFF_STYLE: Record<string, string> = {
  easy:   'text-green-400  border-green-400/30  bg-green-400/10',
  normal: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  hard:   'text-red-400    border-red-400/30    bg-red-400/10',
};

const DIFF_ICON: Record<string, string> = {
  easy:   '🟢',
  normal: '🟡',
  hard:   '🔴',
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// ── Scenario Card ─────────────────────────────────────────────────────────────

function ScenarioCard({
  scenario,
  selected,
  onSelect,
}: {
  scenario: Scenario;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all duration-200',
        selected
          ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(var(--primary),0.3)]'
          : 'border-white/10 bg-white/5 hover:border-white/20',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-sm">{scenario.name}</span>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded border font-mono', DIFF_STYLE[scenario.difficulty])}>
          {DIFF_ICON[scenario.difficulty]} {scenario.difficulty}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{scenario.description}</p>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {scenario.hosts} hosts</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> max {scenario.max_steps} steps</span>
      </div>
    </motion.button>
  );
}

// ── Result Panel ──────────────────────────────────────────────────────────────

function ResultPanel({ result }: { result: RunResult }) {
  const { cyborg, alerts, incident, mission, game_update } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary banner */}
      <GlassCard className="p-4 border-primary/30">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-400">Simulation Complete</p>
            <p className="text-xs text-muted-foreground mt-1">{cyborg.summary}</p>
          </div>
        </div>
      </GlassCard>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Steps Run',         value: cyborg.steps_run,                icon: Activity,  color: 'text-primary' },
          { label: 'Alerts',            value: alerts.length,                   icon: AlertTriangle, color: 'text-yellow-400' },
          { label: 'Hosts Compromised', value: cyborg.compromised_hosts.length, icon: Skull,     color: 'text-red-400' },
          { label: 'Blue Detections',   value: cyborg.defender_detections,      icon: Shield,    color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <GlassCard key={label} className="p-3 text-center">
            <Icon className={cn('w-4 h-4 mx-auto mb-1', color)} />
            <div className="text-xl font-bold font-mono">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Mission created */}
      {mission && (
        <GlassCard className={cn('p-4 border', mission.bossFight ? 'border-red-400/40' : 'border-primary/30')}>
          <div className="flex items-center gap-2 mb-2">
            {mission.bossFight ? <Skull className="w-4 h-4 text-red-400" /> : <Target className="w-4 h-4 text-primary" />}
            <span className="text-sm font-semibold">Mission Created</span>
            {mission.bossFight && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-400/30">BOSS</span>
            )}
          </div>
          <p className="text-sm">{mission.title}</p>
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
            <span className="capitalize">{mission.difficulty} difficulty</span>
            <span className="text-yellow-400">+{mission.xpReward} XP</span>
          </div>
        </GlassCard>
      )}

      {/* XP + unlocks */}
      {game_update && game_update.xp_earned > 0 && (
        <GlassCard className="p-4 border-yellow-400/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">+{game_update.xp_earned} XP Earned</span>
          </div>
          {game_update.newly_unlocked.length > 0 && (
            <div className="space-y-1 mt-2">
              {game_update.newly_unlocked.map((a) => (
                <div key={a.name} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span>Achievement unlocked: <span className="font-semibold">{a.name}</span></span>
                  <span className="text-muted-foreground capitalize">({a.rarity})</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Incident */}
      {incident && (
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Incident Created</p>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={incident.severity as never} />
            <span className="text-sm font-medium">{incident.title}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{incident.attackType}</p>
        </GlassCard>
      )}

      {/* IP Map */}
      <GlassCard className="p-4">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Globe className="w-3 h-3" /> Network Map
        </p>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(cyborg.ip_map).map(([host, ip]) => {
            const compromised = cyborg.compromised_hosts.includes(host);
            return (
              <div key={host} className={cn(
                'flex justify-between text-xs px-2 py-1 rounded font-mono',
                compromised ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-muted-foreground',
              )}>
                <span>{host}</span>
                <span>{ip}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CybORGSimulation() {
  const { hydrateBackendData } = useStore();

  const [scenarios, setScenarios]     = useState<Scenario[]>([]);
  const [selected, setSelected]       = useState<string>('Scenario1');
  const [numSteps, setNumSteps]       = useState(20);
  const [running, setRunning]         = useState(false);
  const [progress, setProgress]       = useState(0);
  const [result, setResult]           = useState<RunResult | null>(null);
  const [error, setError]             = useState<string | null>(null);

  // Load scenario list
  useEffect(() => {
    fetch(`${API_BASE}/api/cyborg/scenarios`)
      .then((r) => r.json())
      .then((d) => setScenarios(d.scenarios ?? []))
      .catch(() => setError('Could not reach backend'));
  }, []);

  const selectedScenario = scenarios.find((s) => s.name === selected);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    setError(null);
    setProgress(0);

    // Animate progress bar while waiting
    const tick = setInterval(() => {
      setProgress((p) => Math.min(p + 3, 90));
    }, 200);

    try {
      const res = await fetch(`${API_BASE}/api/cyborg/run-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_name: selected, num_steps: numSteps }),
      });
      const data: RunResult = await res.json();
      if (!res.ok) throw new Error((data as { detail?: string }).detail ?? 'Unknown error');

      setProgress(100);
      setResult(data);

      // Sync to global store so dashboard updates
      hydrateBackendData({
        alerts:          data.alerts ?? [],
        incidents:       data.incident ? [data.incident] : [],
        agents:          [],
        responseActions: [],
        memoryEntries:   [],
        missions:        data.mission ? [data.mission] : [],
        responses:       [],
        gameState:       data.game_update?.game_update as never ?? null,
        achievements:    [],
      });
    } catch (e) {
      setError(String(e));
    } finally {
      clearInterval(tick);
      setRunning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">CybORG Network Simulation</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Simulate red-vs-blue cyber scenarios. Events are fed through the full
            CyberSaviour pipeline to generate missions, alerts, and XP.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — scenario picker + config */}
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Select Scenario</p>
            {scenarios.length === 0 && !error && (
              <div className="text-sm text-muted-foreground animate-pulse">Loading scenarios…</div>
            )}
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.name}
                scenario={s}
                selected={selected === s.name}
                onSelect={() => setSelected(s.name)}
              />
            ))}

            {/* Steps slider */}
            <GlassCard className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Simulation Steps</label>
                <span className="font-mono text-primary text-sm">{numSteps}</span>
              </div>
              <input
                type="range"
                min={5}
                max={selectedScenario?.max_steps ?? 50}
                value={numSteps}
                onChange={(e) => setNumSteps(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                More steps = more events = higher XP rewards
              </p>
            </GlassCard>

            {/* Run button */}
            <motion.button
              onClick={handleRun}
              disabled={running || !selected}
              whileHover={{ scale: running ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all',
                running
                  ? 'bg-primary/30 text-primary/60 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_rgba(var(--primary),0.4)]',
              )}
            >
              {running ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  Running Simulation…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run {selected}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Progress bar */}
            {running && (
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-sm text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-400/30">
                {error}
              </div>
            )}
          </div>

          {/* Right — results */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Results</p>
            <AnimatePresence mode="wait">
              {result ? (
                <ResultPanel key="result" result={result} />
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground border border-dashed border-white/10 rounded-lg"
                >
                  <Network className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Select a scenario and click Run</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
