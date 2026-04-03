import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Play, Shield, AlertTriangle, CheckCircle2,
  Activity, FileText, Zap, Globe, Lock, ChevronRight,
  Microscope, Network, Server, Clock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard, SeverityBadge } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ForensicEvent {
  event_id: string;
  cve: string;
  service: string;
  severity: string;
  success: boolean;
  vulnerable: boolean;
  pcap_available: boolean;
  pcap_name: string | null;
  benchmark: string;
}

interface PcapStats {
  packet_count: number;
  duration_seconds: number;
  unique_src_ips: number;
  unique_dst_ips: number;
  attacker_ip: string;
  victim_ip: string;
  protocols: string[];
  top_dst_ports: { port: number; count: number }[];
  total_flows: number;
  payload_bytes: number;
  suspicious_snippets: string[];
}

interface ForensicResult {
  event_id: string;
  cve: string;
  service: string;
  severity: string;
  success: boolean;
  vulnerable: boolean;
  cve_description: string;
  pcap_file: string;
  pcap_stats: PcapStats;
  forensic_report: string;
  indicators_of_compromise: string[];
  summary: string;
  timestamp: string;
}

interface RunResult {
  forensic: ForensicResult;
  alerts: { id: string; title: string; severity: string; source: string }[];
  incident?: { id: string; title: string; severity: string; attackType: string };
  mission?: { id: string; title: string; xpReward: number; difficulty: string; bossFight: boolean };
  game_update?: { xp_earned: number; newly_unlocked: { name: string; rarity: string }[] };
}

// ── Severity helpers ──────────────────────────────────────────────────────────

const SEV_STYLE: Record<string, string> = {
  critical: 'text-red-400    border-red-400/30    bg-red-400/10',
  high:     'text-orange-400 border-orange-400/30 bg-orange-400/10',
  medium:   'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  low:      'text-green-400  border-green-400/30  bg-green-400/10',
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// ── Event selector card ───────────────────────────────────────────────────────

function EventCard({
  event,
  selected,
  onSelect,
}: {
  event: ForensicEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all duration-200',
        selected
          ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(var(--primary),0.3)]'
          : 'border-white/10 bg-white/5 hover:border-white/20',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-3 h-3 text-primary shrink-0" />
          <span className="font-semibold text-xs truncate">{event.cve}</span>
        </div>
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0', SEV_STYLE[event.severity] ?? SEV_STYLE.medium)}>
          {event.severity}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground truncate">{event.service}</p>
      <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Network className="w-2.5 h-2.5" />
          {event.pcap_available ? event.pcap_name : 'No PCAP'}
        </span>
        <span className={event.success ? 'text-red-400' : 'text-green-400'}>
          {event.success ? 'Exploited' : 'Attempted'}
        </span>
      </div>
    </motion.button>
  );
}

// ── Result panel ──────────────────────────────────────────────────────────────

function ResultPanel({ result }: { result: RunResult }) {
  const { forensic, alerts, incident, mission, game_update } = result;
  const stats = forensic.pcap_stats;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Banner */}
      <GlassCard className="p-4 border-primary/30">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-400">Analysis Complete</p>
            <p className="text-xs text-muted-foreground mt-1">{forensic.summary}</p>
          </div>
        </div>
      </GlassCard>

      {/* CVE header */}
      <GlassCard className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-xs text-muted-foreground">Vulnerability Detected</p>
            <p className="font-bold text-base mt-0.5">{forensic.cve}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{forensic.service.toUpperCase()}</p>
          </div>
          <span className={cn('text-xs px-2 py-1 rounded border font-mono shrink-0', SEV_STYLE[forensic.severity] ?? '')}>
            {forensic.severity.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{forensic.cve_description}</p>
        <div className="flex gap-2 mt-2 text-xs">
          <span className={forensic.success ? 'text-red-400' : 'text-green-400'}>
            {forensic.success ? '⚠ Attack succeeded' : '✓ Attack blocked/failed'}
          </span>
        </div>
      </GlassCard>

      {/* PCAP stats grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Packets',      value: stats.packet_count,       icon: Activity,  color: 'text-primary' },
            { label: 'Alerts',       value: alerts.length,            icon: AlertTriangle, color: 'text-yellow-400' },
            { label: 'Suspicious',   value: stats.suspicious_snippets?.length ?? 0, icon: Search, color: 'text-red-400' },
            { label: 'Duration (s)', value: stats.duration_seconds,   icon: Clock,     color: 'text-green-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <GlassCard key={label} className="p-3 text-center">
              <Icon className={cn('w-4 h-4 mx-auto mb-1', color)} />
              <div className="text-xl font-bold font-mono">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Network details */}
      {stats && (
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <Globe className="w-3 h-3" /> Network Participants
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-red-500/10 border border-red-400/20 rounded px-2 py-1.5">
              <p className="text-muted-foreground text-[10px]">Attacker IP</p>
              <p className="font-mono text-red-400">{stats.attacker_ip}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-400/20 rounded px-2 py-1.5">
              <p className="text-muted-foreground text-[10px]">Victim IP</p>
              <p className="font-mono text-blue-400">{stats.victim_ip}</p>
            </div>
          </div>
          {stats.top_dst_ports?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground mb-1">Top Ports</p>
              <div className="flex gap-2 flex-wrap">
                {stats.top_dst_ports.slice(0, 5).map(({ port, count }) => (
                  <span key={port} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    :{port} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* IOCs */}
      {forensic.indicators_of_compromise?.length > 0 && (
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Indicators of Compromise
          </p>
          <div className="space-y-1">
            {forensic.indicators_of_compromise.map((ioc, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />
                <span className="font-mono text-muted-foreground break-all">{ioc}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Forensic report */}
      <GlassCard className="p-4">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <FileText className="w-3 h-3" /> Forensic Report
        </p>
        <pre className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed font-mono bg-black/20 rounded p-3 max-h-48 overflow-y-auto scrollbar-thin">
          {forensic.forensic_report}
        </pre>
      </GlassCard>

      {/* Mission */}
      {mission && (
        <GlassCard className={cn('p-4 border', mission.bossFight ? 'border-red-400/40' : 'border-primary/30')}>
          <div className="flex items-center gap-2 mb-2">
            <Microscope className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Mission Created</span>
          </div>
          <p className="text-sm">{mission.title}</p>
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
            <span className="capitalize">{mission.difficulty} difficulty</span>
            <span className="text-yellow-400">+{mission.xpReward} XP</span>
          </div>
        </GlassCard>
      )}

      {/* XP + achievements */}
      {game_update && game_update.xp_earned > 0 && (
        <GlassCard className="p-4 border-yellow-400/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">+{game_update.xp_earned} XP Earned</span>
          </div>
          {game_update.newly_unlocked?.length > 0 && (
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
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ForensicAnalysis() {
  const { hydrateBackendData } = useStore();

  const [events, setEvents]     = useState<ForensicEvent[]>([]);
  const [selected, setSelected] = useState<string>('0');
  const [running, setRunning]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult]     = useState<RunResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState('');

  // Load event list
  useEffect(() => {
    fetch(`${API_BASE}/api/forensic/events`)
      .then((r) => r.json())
      .then((d) => {
        const evts = (d.events ?? []) as ForensicEvent[];
        setEvents(evts);
        if (evts.length > 0) setSelected(evts[0].event_id);
      })
      .catch(() => setError('Could not reach backend'));
  }, []);

  const filtered = events.filter(
    (e) =>
      filter === '' ||
      e.cve.toLowerCase().includes(filter.toLowerCase()) ||
      e.service.toLowerCase().includes(filter.toLowerCase()) ||
      e.severity.toLowerCase().includes(filter.toLowerCase()),
  );

  const selectedEvent = events.find((e) => e.event_id === selected);

  const handleRun = async () => {
    if (!selectedEvent?.pcap_available) {
      setError('No PCAP file available for this event');
      return;
    }
    setRunning(true);
    setResult(null);
    setError(null);
    setProgress(0);

    const tick = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 300);

    try {
      const res = await fetch(`${API_BASE}/api/forensic/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: selected, benchmark: 'CFA' }),
      });
      const data: RunResult = await res.json();
      if (!res.ok) throw new Error((data as { detail?: string }).detail ?? 'Unknown error');

      setProgress(100);
      setResult(data);

      hydrateBackendData({
        alerts:          data.alerts ?? [],
        incidents:       data.incident ? [data.incident] : [],
        agents:          [],
        responseActions: [],
        memoryEntries:   [],
        missions:        data.mission ? [data.mission] : [],
        responses:       [],
        gameState:       (data.game_update as { game_update?: never })?.game_update ?? null,
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
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Microscope className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Forensic Analysis</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyse real PCAP captures from the CFA benchmark. Scapy extracts network
            metadata; Gemini enriches findings with a forensic narrative.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — event picker */}
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Select Event ({filtered.length})
            </p>

            {/* Filter */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by CVE, service, severity…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Event list */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
              {events.length === 0 && !error && (
                <div className="text-sm text-muted-foreground animate-pulse">Loading events…</div>
              )}
              {filtered.map((evt) => (
                <EventCard
                  key={evt.event_id}
                  event={evt}
                  selected={selected === evt.event_id}
                  onSelect={() => setSelected(evt.event_id)}
                />
              ))}
            </div>

            {/* Selected event summary */}
            {selectedEvent && (
              <GlassCard className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">{selectedEvent.cve}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-mono', SEV_STYLE[selectedEvent.severity] ?? '')}>
                    {selectedEvent.severity}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{selectedEvent.service}</p>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Server className="w-2.5 h-2.5" />
                    {selectedEvent.pcap_available ? selectedEvent.pcap_name : 'No PCAP'}
                  </span>
                  <span className={selectedEvent.vulnerable ? 'text-red-400' : 'text-muted-foreground'}>
                    {selectedEvent.vulnerable ? 'Vulnerable' : 'Patched'}
                  </span>
                </div>
              </GlassCard>
            )}

            {/* Run button */}
            <motion.button
              onClick={handleRun}
              disabled={running || !selectedEvent?.pcap_available}
              whileHover={{ scale: running ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all',
                running || !selectedEvent?.pcap_available
                  ? 'bg-primary/30 text-primary/60 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_rgba(var(--primary),0.4)]',
              )}
            >
              {running ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  Analysing PCAP…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Analyse {selectedEvent?.cve ?? 'event'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Progress */}
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
                  <Microscope className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Select an event and click Analyse</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
