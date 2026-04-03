import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ShieldAlert, Activity, TrendingUp, Clock,
  Swords, Zap, ChevronRight, Target, Users, Timer,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard, GlassCard, SeverityBadge, StatusDot } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';
import { threatChartData, rankTiers } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AttackGraph } from '@/components/AttackGraph';
import { StreakFlame } from '@/components/animations/StreakFlame';
import { HolographicThreatSphere } from '@/components/3d/HolographicThreatSphere';
import {
  countMissionsBySource,
  countAlertsBySource,
  detectMissionSource,
  SOURCE_EMOJI,
  SOURCE_BADGE_CLASS,
  SOURCE_LABELS,
} from '@/lib/dataMapper';

// ── Simulated alerts pool ────────────────────────────────────────────────────
// ── XP Progress Bar ──────────────────────────────────────────────────────────
function XpProgressBar({ xp, xpToNext, rank, tier }: { xp: number; xpToNext: number; rank: string; tier: number }) {
  const rankInfo = rankTiers.find((r) => r.tier === tier) ?? rankTiers[0];
  const nextRank = rankTiers.find((r) => r.tier === tier + 1);
  const baseXp   = rankInfo.xpRequired;
  const progress = nextRank
    ? Math.min(100, ((xp - baseXp) / (nextRank.xpRequired - baseXp)) * 100)
    : 100;

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="rank-badge text-[10px]">{rank}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {xp.toLocaleString()} / {xpToNext.toLocaleString()} XP
          </span>
        </div>
        <div className="xp-bar-track">
          <motion.div
            className="xp-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="xp-bar-shimmer" />
        </div>
      </div>
    </div>
  );
}

// ── Combo Multiplier Badge ───────────────────────────────────────────────────
function ComboBadge({ multiplier }: { multiplier: number }) {
  const isActive = multiplier > 1;
  return (
    <motion.div
      key={multiplier}
      initial={{ scale: 1.3 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500 }}
      className="combo-badge"
    >
      <Zap className="w-3.5 h-3.5" />
      <span data-text={`×${multiplier.toFixed(1)}`} className={isActive ? 'glitch-text' : ''}>
        ×{multiplier.toFixed(1)}
      </span>
      <span className="text-[10px] opacity-70">COMBO</span>
    </motion.div>
  );
}

// ── Active Mission Card ──────────────────────────────────────────────────────
function ActiveMissionCard({ mission, index }: { mission: any; index: number }) {
  const isBoss   = mission.bossFight;
  const src      = detectMissionSource(mission);
  const timeLeft = mission.timeLimit
    ? Math.max(0, mission.timeLimit - (mission.elapsed ?? 0))
    : null;
  const urgent = timeLeft !== null && timeLeft < 300;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      className={cn('mission-card', isBoss && 'boss', !isBoss && 'active')}
    >
      {/* Boss indicator or difficulty */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isBoss ? (
            <span className="boss-indicator">
              <Swords className="w-3 h-3" />
              BOSS
            </span>
          ) : (
            <span className={cn('phase-badge text-[9px]',
              mission.phase === 'Initial Access'   ? 'phase-initial-access' :
              mission.phase === 'Discovery'         ? 'phase-discovery'      :
              mission.phase === 'Lateral Movement'  ? 'phase-lateral'        :
              mission.phase === 'Containment'       ? 'phase-containment'    : 'phase-recovery'
            )}>
              {mission.phase}
            </span>
          )}
          {/* Data-source badge */}
          <span className={cn('text-[9px] px-1 py-0.5 rounded border font-mono', SOURCE_BADGE_CLASS[src])}>
            {SOURCE_EMOJI[src]} {SOURCE_LABELS[src]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {timeLeft !== null && (
            <span className={cn('flex items-center gap-1 text-[10px] font-mono', urgent ? 'text-destructive animate-pulse' : 'text-muted-foreground')}>
              <Timer className="w-3 h-3" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          )}
          <span className="text-[10px] font-bold text-yellow-400">+{mission.xpReward} XP</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-bold text-foreground mb-2 truncate">{mission.title}</p>

      {/* Phase progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{mission.phase}</span>
          <span className="text-[10px] font-mono text-muted-foreground">{mission.phaseProgress}%</span>
        </div>
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${mission.phaseProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: isBoss
                ? 'linear-gradient(90deg, hsl(0 84% 50%), hsl(25 95% 53%))'
                : 'linear-gradient(90deg, hsl(155 100% 40%), hsl(155 100% 60%))',
              boxShadow: isBoss ? '0 0 6px hsl(0 84% 60% / 0.5)' : '0 0 6px hsl(155 100% 50% / 0.4)',
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link
        to={`/missions/${mission.id}`}
        className="flex items-center justify-between text-[11px] font-semibold group"
        style={{ color: isBoss ? 'hsl(0 84% 65%)' : 'hsl(155 100% 55%)' }}
      >
        <span>Investigate</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </motion.div>
  );
}

// ── Squad Status Mini ────────────────────────────────────────────────────────
function SquadMiniStatus({ agent }: { agent: any }) {
  const statusColor = agent.status === 'ready' ? 'hsl(155 100% 50%)' : agent.status === 'analyzing' ? 'hsl(217 91% 60%)' : 'hsl(48 96% 53%)';

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-secondary/40 border border-border/30">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
        style={{ background: `${statusColor}18`, border: `1px solid ${statusColor}40`, color: statusColor }}
      >
        {agent.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold truncate text-foreground">{agent.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor, boxShadow: `0 0 4px ${statusColor}` }} />
          <span className="text-[9px] uppercase font-mono" style={{ color: statusColor }}>
            {agent.status === 'cooldown'
              ? `${agent.cooldownRemaining}s`
              : agent.status}
          </span>
        </div>
      </div>
      {/* Trust bar */}
      <div className="w-10 flex flex-col gap-0.5 shrink-0">
        <span className="text-[9px] text-muted-foreground text-right">{agent.trust}%</span>
        <div className="trust-bar-track w-full">
          <div className="trust-bar-fill" style={{ width: `${agent.trust}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { alerts, gameState, missions, squad, cyborgRuns, forensicRuns } = useStore();
  const [heatmapData] = useState(() =>
    Array.from({ length: 24 }, () =>
      Array.from({ length: 7 }, () => Math.floor(Math.random() * 10))
    )
  );

  const criticalCount    = alerts.filter((a) => a.severity === 'critical').length;
  const activeMissions   = missions.filter((m) => m.status === 'active');
  const bossMissions     = activeMissions.filter((m) => m.bossFight);
  const hasBoss          = bossMissions.length > 0;
  const missionSrcCounts = countMissionsBySource(activeMissions);
  const alertSrcCounts   = countAlertsBySource(alerts);

  return (
    <DashboardLayout>
      <div className={cn('space-y-5 min-h-screen pb-10 scanline', hasBoss && 'boss-accent')}>

        {/* ── Boss Alert Banner ───────────────────────────────────────────── */}
        <AnimatePresence>
          {hasBoss && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="boss-mode rounded-2xl p-3 flex items-center gap-3"
              style={{ background: 'hsl(0 30% 8%)', border: '1px solid hsl(0 84% 60% / 0.5)' }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
              >
                <Swords className="w-5 h-5 shrink-0" style={{ color: 'hsl(0 84% 65%)' }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'hsl(0 84% 65%)' }}>
                  ⚠ BOSS INCIDENT ACTIVE
                </span>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {bossMissions[0].title} — {bossMissions[0].phase}
                </p>
              </div>
              <Link
                to={`/missions/${bossMissions[0].id}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
                style={{ background: 'hsl(0 84% 60% / 0.15)', border: '1px solid hsl(0 84% 60% / 0.35)', color: 'hsl(0 84% 70%)' }}
              >
                Engage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Gamified HUD Bar ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-4 flex-wrap">
            {/* XP + Rank */}
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary/80">Analyst Status</span>
              </div>
              <XpProgressBar
                xp={gameState.xp}
                xpToNext={gameState.xpToNextRank}
                rank={gameState.rank}
                tier={gameState.rankTier}
              />
            </div>

            {/* Divider */}
            <div className="h-10 w-px bg-border/50 hidden sm:block" />

            {/* Streak */}
            <div className="hud-panel">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">Streak</span>
                <StreakFlame streak={gameState.streak} size="md" />
              </div>
            </div>

            {/* Combo */}
            <div className="hud-panel">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">Multiplier</span>
                <ComboBadge multiplier={gameState.comboMultiplier} />
              </div>
            </div>

            {/* Missions count */}
            <div className="hud-panel">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">Missions</span>
                <span className="text-lg font-black text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {gameState.missionsCompleted}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Critical Alerts"   value={criticalCount}          icon={ShieldAlert} variant="danger"  trend="+2 in last hour" />
          <StatCard title="Active Missions"   value={activeMissions.length}  icon={Target}      variant="warning" trend={`${bossMissions.length} boss fight${bossMissions.length !== 1 ? 's' : ''}`} />
          <StatCard title="Total Alerts"      value={alerts.length}          icon={Activity}    variant="default" trend="Last 24h" />
          <StatCard title="Squad Online"      value="4/4"                    icon={Users}       variant="success" trend="All agents ready" />
        </div>

        {/* ── Data Sources Panel ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pipeline Data Sources</span>
            <Link to="/response" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { key: 'cybersaviour', label: 'ASE Pipeline', missions: missionSrcCounts.cybersaviour, alerts: alertSrcCounts.cybersaviour, runs: null,          href: '/response'  },
                { key: 'cyborg',       label: 'CybORG Sim',   missions: missionSrcCounts.cyborg,       alerts: alertSrcCounts.cyborg,       runs: cyborgRuns,   href: '/cyborg'    },
                { key: 'forensic',     label: 'Forensic Lab', missions: missionSrcCounts.forensic,     alerts: alertSrcCounts.forensic,     runs: forensicRuns, href: '/forensic'  },
              ] as const
            ).map(({ key, label, missions: mc, alerts: ac, runs, href }) => (
              <Link
                key={key}
                to={href}
                className={cn(
                  'group flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02]',
                  SOURCE_BADGE_CLASS[key as keyof typeof SOURCE_BADGE_CLASS],
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{SOURCE_EMOJI[key as keyof typeof SOURCE_EMOJI]}</span>
                  <span className="text-xs font-semibold truncate">{label}</span>
                </div>
                <div className="flex gap-3 text-[10px] font-mono">
                  <span><span className="text-foreground font-bold">{mc}</span> missions</span>
                  <span><span className="text-foreground font-bold">{ac}</span> alerts</span>
                  {runs !== null && <span><span className="text-foreground font-bold">{runs}</span> runs</span>}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Charts Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <GlassCard className="lg:col-span-2 flex flex-col min-h-[320px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-primary/90 drop-shadow-[0_0_4px_rgba(0,255,128,0.3)] tracking-wider">Threat Activity</span>
              </h2>
              <span className="text-xs text-muted-foreground">Last 24 hours</span>
            </div>
            <div className="flex-1 min-h-[230px] w-full relative">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={threatChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 16%)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid hsl(220 20% 16%)', borderRadius: '12px', fontSize: 12 }} labelStyle={{ color: '#e5e7eb' }} />
                    <Area type="monotone" dataKey="critical" stroke="#ff4d4f" fill="url(#critGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="high"     stroke="#f97316" fill="url(#highGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="medium"   stroke="#facc15" fill="url(#medGrad)"  strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

          {/* Severity Heatmap */}
          <GlassCard className="flex flex-col">
            <h2 className="text-sm font-semibold mb-4">Severity Heatmap (24h)</h2>
            <div className="flex-1 min-h-[180px]">
              <div className="grid grid-cols-6 gap-1.5 h-full">
                {heatmapData.slice(0, 24).map((row, i) => (
                  <motion.div
                    key={`hour-${i}`}
                    className="rounded-sm cursor-pointer"
                    whileHover={{ scale: 1.2 }}
                    style={{
                      backgroundColor:
                        row[0] > 7 ? 'hsl(0 84% 60% / 0.8)' :
                        row[0] > 5 ? 'hsl(25 95% 53% / 0.6)' :
                        row[0] > 3 ? 'hsl(48 96% 53% / 0.4)' :
                        row[0] > 1 ? 'hsl(155 100% 50% / 0.2)' :
                        'hsl(220 20% 14%)',
                    }}
                    title={`Hour ${i}: ${row[0]} threats`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'hsl(155 100% 50% / 0.2)' }} /> Low</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'hsl(48 96% 53% / 0.4)'  }} /> Med</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'hsl(25 95% 53% / 0.6)'  }} /> High</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'hsl(0 84% 60% / 0.8)'   }} /> Crit</span>
            </div>
          </GlassCard>
        </div>

        {/* ── Active Missions + Attack Graph ──────────────────────────────── */}
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="tracking-wider">Threat Topology</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              {hasBoss ? 'Boss pressure detected' : 'Live attack mapping'}
            </span>
          </div>
          <div className="px-5 pb-5 pt-3">
            <HolographicThreatSphere height={320} />
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Active Missions */}
          <GlassCard className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-warning" />
                <span className="tracking-wider">Active Missions</span>
              </h2>
              <Link to="/missions" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {activeMissions.slice(0, 3).map((m, i) => (
                <ActiveMissionCard key={m.id} mission={m} index={i} />
              ))}
              {activeMissions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No active missions</p>
              )}
            </div>
          </GlassCard>

          {/* Attack Graph */}
          <div className="lg:col-span-2">
            <AttackGraph />
          </div>
        </div>

        {/* ── Alerts + Squad ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Live Alerts */}
          <GlassCard className="lg:col-span-2 min-h-[320px] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <span className="tracking-wider">Attack Waves</span>
              </h2>
              <span className="text-xs text-muted-foreground">{alerts.length} total</span>
            </div>
            <div className="space-y-2 overflow-y-auto scrollbar-thin min-h-0 flex-1 pr-1">
              {alerts.slice(0, 10).map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/30 hover:bg-accent/50 transition-colors cursor-pointer',
                    alert.severity === 'critical' && 'border-destructive/30 glow-danger'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusDot status={alert.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground terminal-text">
                        {alert.source} · {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <SeverityBadge severity={alert.severity} />
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Squad Status */}
          <GlassCard className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="tracking-wider">Squad Status</span>
              </h2>
              <Link to="/squad" className="text-xs text-primary hover:underline">Manage</Link>
            </div>
            <div className="space-y-2 flex-1">
              {squad.map((agent) => (
                <SquadMiniStatus key={agent.id} agent={agent} />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ── Event Timeline ──────────────────────────────────────────────── */}
        <GlassCard>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="tracking-wider">Event Timeline</span>
          </h2>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border/50" />
            {alerts.slice(0, 5).map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                className="relative"
              >
                <div className={cn(
                  'absolute left-[-18px] top-1 h-3 w-3 rounded-full border-2 border-card',
                  alert.severity === 'critical' ? 'bg-destructive glow-danger'  :
                  alert.severity === 'high'     ? 'bg-orange-400 glow-warning'  :
                  alert.severity === 'medium'   ? 'bg-warning glow-warning'     : 'bg-primary glow-primary'
                )} />
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground terminal-text">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
