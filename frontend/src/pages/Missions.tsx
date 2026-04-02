import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Swords, Target, Timer, Zap, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const PHASE_COLORS: Record<string, string> = {
  'Initial Access':   'hsl(25 95% 53%)',
  'Discovery':        'hsl(217 91% 60%)',
  'Lateral Movement': 'hsl(0 84% 60%)',
  'Containment':      'hsl(48 96% 53%)',
  'Recovery':         'hsl(155 100% 50%)',
};

export default function Missions() {
  const { missions, gameState } = useStore();
  const activeMissions   = missions.filter((m) => m.status === 'active');
  const completedMissions= missions.filter((m) => m.status === 'completed');

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest">
              <span className="text-primary drop-shadow-[0_0_8px_rgba(0,255,128,0.5)]">Mission</span>
              <span className="text-foreground/60 ml-2">Control</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Active threats turned into actionable missions</p>
          </div>
          <div className="hud-panel">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Total XP</p>
              <p className="text-sm font-black text-yellow-400">{gameState.xp.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Active */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            Active Missions ({activeMissions.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeMissions.map((mission, i) => {
              const isBoss   = mission.bossFight;
              const color    = PHASE_COLORS[mission.phase] ?? 'hsl(155 100% 50%)';
              const timeLeft = mission.timeLimit ? Math.max(0, mission.timeLimit - (mission.elapsed ?? 0)) : null;
              const urgent   = timeLeft !== null && timeLeft < 300;

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                  className={cn('mission-card', isBoss && 'boss', !isBoss && 'active')}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isBoss && <span className="boss-indicator"><Swords className="w-3 h-3" />BOSS</span>}
                      <span className={cn('text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border',
                        mission.difficulty === 'nightmare' ? 'diff-nightmare' :
                        mission.difficulty === 'hard'      ? 'diff-hard'      :
                        mission.difficulty === 'normal'    ? 'diff-normal'    : 'diff-easy'
                      )}>
                        {mission.difficulty}
                      </span>
                    </div>
                    <span className="text-sm font-black text-yellow-400 shrink-0">+{mission.xpReward} XP</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-foreground mb-1">{mission.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{mission.description}</p>

                  {/* Phase */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold" style={{ color }}>{mission.phase}</span>
                    {timeLeft !== null && (
                      <span className={cn('flex items-center gap-1 text-[10px] font-mono', urgent ? 'text-destructive animate-pulse' : 'text-muted-foreground')}>
                        <Timer className="w-3 h-3" />
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${mission.phaseProgress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ background: `linear-gradient(90deg, ${color}70, ${color})`, boxShadow: `0 0 6px ${color}50` }}
                    />
                  </div>

                  {/* Objectives mini */}
                  <div className="flex items-center gap-3 mb-4">
                    {mission.objectives.map((obj) => (
                      <div key={obj.id} className="flex items-center gap-1">
                        {obj.completed
                          ? <CheckCircle2 className="w-3 h-3 text-primary" />
                          : <Circle className="w-3 h-3 text-muted-foreground" />
                        }
                      </div>
                    ))}
                    <span className="text-[10px] text-muted-foreground">
                      {mission.objectives.filter((o) => o.completed).length}/{mission.objectives.length} objectives
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    to={`/missions/${mission.id}`}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border transition-all"
                    style={
                      isBoss
                        ? { background: 'hsl(0 84% 60% / 0.12)', borderColor: 'hsl(0 84% 60% / 0.35)', color: 'hsl(0 84% 70%)' }
                        : { background: 'hsl(155 100% 50% / 0.08)', borderColor: 'hsl(155 100% 50% / 0.3)', color: 'hsl(155 100% 55%)' }
                    }
                  >
                    Engage Mission <ChevronRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Completed */}
        {completedMissions.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Completed ({completedMissions.length})
            </h2>
            <div className="space-y-2">
              {completedMissions.map((mission, i) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center gap-4 opacity-70"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{mission.title}</p>
                    <p className="text-xs text-muted-foreground">{mission.phase} · {mission.difficulty}</p>
                  </div>
                  <span className="text-sm font-bold text-yellow-400 shrink-0">+{mission.xpReward} XP</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
