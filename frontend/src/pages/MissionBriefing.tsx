import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Target, CheckCircle2, Circle, Timer, ChevronRight,
  ChevronLeft, Zap, Shield, AlertTriangle, Clock, ArrowRight,
  MessageSquare, Lock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MissionPhaseCascade } from '@/components/3d/MissionPhaseCascade';
import { GlassCard } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { MissionPhase } from '@/data/mockData';

// ── Phase order ──────────────────────────────────────────────────────────────
const PHASES: MissionPhase[] = [
  'Initial Access', 'Discovery', 'Lateral Movement', 'Containment', 'Recovery',
];

const PHASE_COLORS: Record<MissionPhase, string> = {
  'Initial Access':  'hsl(25 95% 53%)',
  'Discovery':       'hsl(217 91% 60%)',
  'Lateral Movement':'hsl(0 84% 60%)',
  'Containment':     'hsl(48 96% 53%)',
  'Recovery':        'hsl(155 100% 50%)',
};

const PHASE_DESCRIPTIONS: Record<MissionPhase, string> = {
  'Initial Access':   'Attacker has gained foothold. Identify the entry vector and affected credentials.',
  'Discovery':        'Adversary is mapping your network. Detect recon activity before they escalate.',
  'Lateral Movement': 'Threat is moving between systems. Intercept and contain before critical assets are reached.',
  'Containment':      'Lock down the attack path. Isolate compromised hosts and block C2 channels.',
  'Recovery':         'Neutralize the threat and restore normal operations. Validate no persistence mechanisms remain.',
};

// ── Phase Stepper ────────────────────────────────────────────────────────────
function PhaseStepper({ current }: { current: MissionPhase }) {
  const currentIdx = PHASES.indexOf(current);

  return (
    <div className="flex items-center gap-0">
      {PHASES.map((phase, i) => {
        const isPast    = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture  = i > currentIdx;
        const color     = PHASE_COLORS[phase];

        return (
          <div key={phase} className="flex items-center">
            {/* Node */}
            <motion.div
              animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all"
                style={{
                  background: isFuture ? 'hsl(220 20% 14%)' : `${color}20`,
                  borderColor: isFuture ? 'hsl(220 20% 25%)' : color,
                  color: isFuture ? 'hsl(220 10% 40%)' : color,
                  boxShadow: isCurrent ? `0 0 16px ${color}60` : 'none',
                }}
              >
                {isPast ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: color }}
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </div>
              <span className={cn('text-[9px] font-bold text-center leading-tight max-w-[60px]',
                isFuture ? 'text-muted-foreground' : ''
              )} style={{ color: isFuture ? undefined : color }}>
                {phase.split(' ').map((w, j) => <span key={j} className="block">{w}</span>)}
              </span>
            </motion.div>

            {/* Connector */}
            {i < PHASES.length - 1 && (
              <div className="w-8 h-0.5 mx-1 rounded-full overflow-hidden mb-6">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: isPast ? '100%' : isCurrent ? '50%' : '0%' }}
                  transition={{ duration: 0.8 }}
                  style={{
                    background: isPast ? PHASE_COLORS['Recovery'] : `linear-gradient(90deg, ${PHASE_COLORS[phase]}, transparent)`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Objective Item ────────────────────────────────────────────────────────────
function ObjectiveItem({
  objective, index, missionComplete,
}: { objective: any; index: number; missionComplete: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl border transition-all',
        objective.completed
          ? 'border-primary/25 bg-primary/5'
          : 'border-border/30 bg-secondary/20'
      )}
    >
      <div className="shrink-0 mt-0.5">
        {objective.completed
          ? <CheckCircle2 className="w-4 h-4 text-primary" />
          : <Circle className="w-4 h-4 text-muted-foreground" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', objective.completed ? 'text-foreground line-through opacity-70' : 'text-foreground')}>
          {objective.description}
        </p>
      </div>
      <span className="flex items-center gap-0.5 text-[10px] font-bold shrink-0"
        style={{ color: objective.completed ? 'hsl(155 100% 55%)' : 'hsl(48 96% 53%)' }}>
        <Zap className="w-3 h-3" />+{objective.xpBonus}
      </span>
    </motion.div>
  );
}

// ── Decision Point Modal ──────────────────────────────────────────────────────
function DecisionModal({
  action, onApprove, onReject, onClose,
}: { action: any; onApprove: () => void; onReject: () => void; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[8000] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-96 glass-card p-6 border-2"
        style={{ borderColor: 'hsl(155 100% 50% / 0.4)', boxShadow: '0 0 40px hsl(155 100% 50% / 0.15)' }}
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-black text-lg text-foreground">Decision Point</h3>
          <p className="text-sm text-muted-foreground mt-1">This action will affect mission progress</p>
        </div>

        <div className="bg-secondary/40 border border-border/30 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-foreground mb-1">{action.action}: <span className="text-primary">{action.target}</span></p>
          <p className="text-xs text-muted-foreground leading-relaxed">{action.explanation}</p>
        </div>

        <div className="flex items-center justify-between mb-5 text-xs text-muted-foreground">
          <span>Risk: <span className={cn('font-bold',
            action.riskLevel === 'low' ? 'text-primary' : action.riskLevel === 'medium' ? 'text-warning' : 'text-destructive'
          )}>{action.riskLevel.toUpperCase()}</span></span>
          <span className="flex items-center gap-1 text-yellow-400 font-bold">
            <Zap className="w-3 h-3" />+80 XP on approve
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            onClick={onReject}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="py-2.5 rounded-xl text-sm font-bold border border-destructive/30 bg-destructive/8 text-red-400 transition-all"
          >
            Reject
          </motion.button>
          <motion.button
            onClick={onApprove}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="py-2.5 rounded-xl text-sm font-bold border border-primary/35 bg-primary/12 text-primary transition-all"
            style={{ boxShadow: '0 0 12px hsl(155 100% 50% / 0.15)' }}
          >
            Approve +80 XP
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MissionBriefing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { missions, responseActions, completeMission, advanceMissionPhase, approveResponseAction, rejectResponseAction } = useStore();
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const mission = missions.find((m) => m.id === id);

  if (!mission) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Mission not found.</p>
          <Link to="/missions" className="text-primary hover:underline text-sm">← Back to Missions</Link>
        </div>
      </DashboardLayout>
    );
  }

  const missionActions = responseActions.filter((a) => a.incidentId === mission.incidentId);
  const pendingActions = missionActions.filter((a) => a.status === 'pending');
  const phaseColor     = PHASE_COLORS[mission.phase];
  const allObjectivesDone = mission.objectives.every((o) => o.completed);

  const handleApprove = () => {
    if (selectedAction) {
      approveResponseAction(selectedAction.id);
      setSelectedAction(null);
    }
  };
  const handleReject = () => {
    if (selectedAction) {
      rejectResponseAction(selectedAction.id);
      setSelectedAction(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />Back
        </button>

        {/* ── Mission Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('glass-card p-6 relative overflow-hidden', mission.bossFight && 'boss-mode boss-mode-bg')}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${phaseColor}, transparent)` }} />

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${phaseColor}15`, border: `1.5px solid ${phaseColor}40` }}
              >
                {mission.bossFight ? <Swords className="w-6 h-6" style={{ color: phaseColor }} /> : <Target className="w-6 h-6" style={{ color: phaseColor }} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {mission.bossFight && <span className="boss-indicator"><Swords className="w-3 h-3" />BOSS</span>}
                  <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border',
                    mission.difficulty === 'nightmare' ? 'diff-nightmare' :
                    mission.difficulty === 'hard'      ? 'diff-hard'      :
                    mission.difficulty === 'normal'    ? 'diff-normal'    : 'diff-easy'
                  )}>
                    {mission.difficulty}
                  </span>
                </div>
                <h1 className="text-xl font-black text-foreground">{mission.title}</h1>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xl">{mission.description}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-black text-yellow-400">+{mission.xpReward}</span>
                <span className="text-sm text-muted-foreground">XP</span>
              </div>
              {mission.timeLimit && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor((mission.timeLimit - (mission.elapsed ?? 0)) / 60)}m remaining</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Phase Stepper ── */}
        <GlassCard>
          <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="tracking-wider">Attack Phase Progression</span>
          </h2>
          <div className="flex justify-center overflow-x-auto pb-2">
            <PhaseStepper current={mission.phase} />
          </div>
          <div className="mt-5">
            <MissionPhaseCascade currentPhase={mission.phase} progress={mission.phaseProgress} height={220} />
          </div>
          <div className="mt-5 p-4 rounded-xl border border-border/30 bg-secondary/20">
            <p className="text-xs font-bold mb-1" style={{ color: phaseColor }}>
              Current Phase: {mission.phase}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{PHASE_DESCRIPTIONS[mission.phase]}</p>
            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Phase progress</span>
                <span className="text-[10px] font-mono" style={{ color: phaseColor }}>{mission.phaseProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${phaseColor}80, ${phaseColor})`, boxShadow: `0 0 6px ${phaseColor}60` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${mission.phaseProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Two-column: Objectives + Squad Commentary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Objectives */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-warning" />
                <span className="tracking-wider">Mission Objectives</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                {mission.objectives.filter((o) => o.completed).length}/{mission.objectives.length} complete
              </span>
            </div>
            <div className="space-y-2">
              {mission.objectives.map((obj, i) => (
                <ObjectiveItem key={obj.id} objective={obj} index={i} missionComplete={allObjectivesDone} />
              ))}
            </div>
          </GlassCard>

          {/* Squad Commentary */}
          <GlassCard>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="tracking-wider">Squad Commentary</span>
            </h2>
            {mission.squadVoiceLine && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-4"
              >
                <p className="text-sm text-foreground italic leading-relaxed">"{mission.squadVoiceLine}"</p>
                <p className="text-[10px] text-primary mt-2 font-mono">— AI Squad</p>
              </motion.div>
            )}
            <div className="space-y-2">
              {PHASE_DESCRIPTIONS[mission.phase] && (
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/20">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Phase Briefing</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{PHASE_DESCRIPTIONS[mission.phase]}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* ── Pending Response Actions (Decision Points) ── */}
        {pendingActions.length > 0 && (
          <GlassCard>
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-warning" />
              <span className="tracking-wider">Decision Points</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-warning/10 border border-warning/30 text-yellow-400 ml-1">
                {pendingActions.length} pending
              </span>
            </h2>
            <div className="space-y-3">
              {pendingActions.map((action, i) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border/40 bg-secondary/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{action.action}: <span className="text-primary">{action.target}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{action.explanation}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border',
                      action.riskLevel === 'low'    ? 'text-primary border-primary/30 bg-primary/8' :
                      action.riskLevel === 'medium' ? 'text-warning border-warning/30 bg-warning/8' :
                      'text-destructive border-destructive/30 bg-destructive/8'
                    )}>
                      {action.riskLevel.toUpperCase()}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedAction(action)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/35 bg-primary/10 text-primary hover:bg-primary/18 transition-all"
                    >
                      Review <ChevronRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* ── Complete / Advance Mission ── */}
        <div className="flex gap-3 flex-wrap">
          <motion.button
            onClick={() => advanceMissionPhase(mission.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border border-border/50 bg-secondary/40 text-foreground hover:bg-accent transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            Advance Phase
          </motion.button>
          <motion.button
            onClick={() => { completeMission(mission.id); navigate('/missions'); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border border-primary/35 bg-primary/12 text-primary hover:bg-primary/20 transition-all"
            style={{ boxShadow: '0 0 16px hsl(155 100% 50% / 0.12)' }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete Mission (+{mission.xpReward} XP)
          </motion.button>
        </div>

        {/* Decision Modal */}
        <AnimatePresence>
          {selectedAction && (
            <DecisionModal
              action={selectedAction}
              onApprove={handleApprove}
              onReject={handleReject}
              onClose={() => setSelectedAction(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
