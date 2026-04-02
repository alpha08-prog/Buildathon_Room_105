import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, CheckCircle2, Clock, Activity, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { SquadAgent, SquadAbility } from '@/data/mockData';

// ── Cooldown Ring ────────────────────────────────────────────────────────────
function CooldownRing({ agent }: { agent: SquadAgent }) {
  const pct = agent.cooldownMax > 0
    ? ((agent.cooldownMax - agent.cooldownRemaining) / agent.cooldownMax) * 100
    : 100;
  const r = 22; const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        {/* Track */}
        <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(220 20% 16%)" strokeWidth="3" />
        {/* Progress */}
        <motion.circle
          cx="28" cy="28" r={r} fill="none"
          stroke={agent.status === 'ready' ? 'hsl(155 100% 50%)' : agent.status === 'analyzing' ? 'hsl(217 91% 60%)' : 'hsl(48 96% 53%)'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 4px ${agent.status === 'ready' ? 'hsl(155 100% 50%)' : 'hsl(48 96% 53%)'})`,
          }}
        />
      </svg>
      {/* Avatar letter */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-black text-foreground">{agent.avatar}</span>
      </div>
    </div>
  );
}

// ── Ability Item ─────────────────────────────────────────────────────────────
function AbilityItem({ ability }: { ability: SquadAbility }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all',
      ability.unlocked
        ? 'border-primary/25 bg-primary/5 hover:bg-primary/8'
        : 'border-border/30 bg-secondary/20 opacity-60'
    )}>
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
        ability.unlocked ? 'bg-primary/15 border border-primary/30' : 'bg-secondary/40 border border-border/30'
      )}>
        {ability.unlocked
          ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          : <Lock className="w-3.5 h-3.5 text-muted-foreground" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold', ability.unlocked ? 'text-foreground' : 'text-muted-foreground')}>{ability.name}</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{ability.description}</p>
      </div>
      {!ability.unlocked && (
        <span className="flex items-center gap-0.5 text-[10px] font-bold shrink-0" style={{ color: 'hsl(48 96% 53%)' }}>
          <Zap className="w-3 h-3" />{ability.xpCost}
        </span>
      )}
    </div>
  );
}

// ── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({ agent, index }: { agent: SquadAgent; index: number }) {
  const { selectSquadMember } = useStore();
  const statusColor =
    agent.status === 'ready'     ? 'hsl(155 100% 50%)' :
    agent.status === 'analyzing' ? 'hsl(217 91% 60%)' :
    agent.status === 'cooldown'  ? 'hsl(48 96% 53%)' : 'hsl(220 10% 40%)';

  const xpPct = Math.min(100, (agent.currentXp / agent.xpToNextLevel) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
      className={cn(
        'glass-card p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300',
        agent.status === 'analyzing' ? 'agent-card-analyzing' :
        agent.status === 'cooldown'  ? 'agent-card-cooldown'  : 'agent-card-ready'
      )}
    >
      {/* Background accent */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${statusColor}60, transparent)` }}
      />

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <CooldownRing agent={agent} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-foreground text-base">{agent.name}</h3>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}40`, color: statusColor }}
            >
              LVL {agent.level}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.specialty}</p>

          {/* Status */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor, boxShadow: `0 0 5px ${statusColor}` }} />
            <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: statusColor }}>
              {agent.status === 'cooldown'
                ? `Cooldown ${agent.cooldownRemaining}s`
                : agent.status}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground">Missions</span>
          <span className="text-lg font-black text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{agent.kills}</span>
        </div>
      </div>

      {/* ── Trust Meter ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Trust Level</span>
          <span className="text-[11px] font-bold" style={{ color: statusColor }}>{agent.trust}%</span>
        </div>
        <div className="trust-bar-track">
          <motion.div
            className="trust-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${agent.trust}%` }}
            transition={{ duration: 1, delay: index * 0.15, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ── XP Bar ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Agent XP</span>
          <span className="text-[10px] text-muted-foreground font-mono">{agent.currentXp} / {agent.xpToNextLevel}</span>
        </div>
        <div className="xp-bar-track">
          <motion.div
            className="xp-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1, delay: index * 0.15 + 0.2, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ── Last Voice Line ── */}
      <div className="p-3 rounded-xl border border-border/30 bg-secondary/30">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground italic leading-relaxed">
            "{agent.lastVoiceLine}"
          </p>
        </div>
      </div>

      {/* ── Abilities ── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">Abilities</p>
        <div className="space-y-1.5">
          {agent.abilities.map((ab) => <AbilityItem key={ab.id} ability={ab} />)}
        </div>
      </div>

      {/* ── Action Button ── */}
      <motion.button
        disabled={agent.status !== 'ready'}
        onClick={() => selectSquadMember(agent.id)}
        whileHover={agent.status === 'ready' ? { scale: 1.02 } : {}}
        whileTap={agent.status === 'ready' ? { scale: 0.98 } : {}}
        className={cn(
          'w-full py-2.5 rounded-xl text-sm font-bold tracking-wider uppercase transition-all',
          agent.status === 'ready'
            ? 'text-primary border border-primary/35 bg-primary/8 hover:bg-primary/15'
            : 'text-muted-foreground border border-border/30 bg-secondary/20 cursor-not-allowed'
        )}
      >
        {agent.status === 'ready'     ? 'Deploy Agent'     :
         agent.status === 'cooldown'  ? `Cooldown (${agent.cooldownRemaining}s)` :
         agent.status === 'analyzing' ? 'Analyzing...'     : 'Offline'}
      </motion.button>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Squad() {
  const { squad, tickCooldowns, gameState } = useStore();

  // Tick cooldowns every second
  useEffect(() => {
    const interval = setInterval(tickCooldowns, 1000);
    return () => clearInterval(interval);
  }, [tickCooldowns]);

  const readyCount    = squad.filter((a) => a.status === 'ready').length;
  const analyzingCount= squad.filter((a) => a.status === 'analyzing').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest">
              <span className="text-primary drop-shadow-[0_0_8px_rgba(0,255,128,0.5)]">Squad</span>
              <span className="text-foreground/60 ml-2">Command</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Deploy AI agents and manage your security team</p>
          </div>

          <div className="flex gap-3">
            <div className="hud-panel">
              <Activity className="w-4 h-4 text-primary" />
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Ready</p>
                <p className="text-sm font-black text-primary">{readyCount}/4</p>
              </div>
            </div>
            {analyzingCount > 0 && (
              <div className="hud-panel" style={{ borderColor: 'hsl(217 91% 60% / 0.4)' }}>
                <Clock className="w-4 h-4" style={{ color: 'hsl(217 91% 60%)' }} />
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Active</p>
                  <p className="text-sm font-black" style={{ color: 'hsl(217 91% 60%)' }}>{analyzingCount}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {squad.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>

        {/* Voice Lines feed */}
        <GlassCard>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="tracking-wider">Squad Intel Feed</span>
          </h2>
          <div className="space-y-2">
            {squad.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20"
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                  style={{
                    background: 'hsl(155 100% 50% / 0.1)',
                    border: '1px solid hsl(155 100% 50% / 0.25)',
                    color: 'hsl(155 100% 55%)',
                  }}
                >
                  {agent.avatar}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-primary">{agent.name} </span>
                  <span className="text-[10px] text-muted-foreground italic">"{agent.lastVoiceLine}"</span>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
