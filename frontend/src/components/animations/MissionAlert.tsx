import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, AlertTriangle, Clock, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Mission } from '@/data/mockData';

interface MissionAlertProps {
  mission: Mission;
  onDismiss: () => void;
  autoHideMs?: number;
}

export function MissionAlert({ mission, onDismiss, autoHideMs = 8000 }: MissionAlertProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(autoHideMs / 1000);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 0.1)), 100);
    const timeout  = setTimeout(onDismiss, autoHideMs);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [autoHideMs, onDismiss]);

  const progress = (timeLeft / (autoHideMs / 1000)) * 100;
  const isBoss = mission.bossFight;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="w-80 relative overflow-hidden rounded-2xl border-2 shadow-2xl"
      style={
        isBoss
          ? { background: 'hsl(0 30% 8%)', borderColor: 'hsl(0 84% 60% / 0.6)', boxShadow: '0 0 32px hsl(0 84% 60% / 0.25)' }
          : { background: 'hsl(220 26% 10%)', borderColor: 'hsl(155 100% 50% / 0.4)', boxShadow: '0 0 20px hsl(155 100% 50% / 0.15)' }
      }
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: isBoss ? 'linear-gradient(90deg, transparent, hsl(0 84% 60%), transparent)' : 'linear-gradient(90deg, transparent, hsl(155 100% 50%), transparent)' }}
      />

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {isBoss ? (
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Swords className="w-5 h-5" style={{ color: 'hsl(0 84% 60%)' }} />
              </motion.div>
            ) : (
              <AlertTriangle className="w-5 h-5 text-warning" />
            )}
            <span
              className="text-[10px] font-black uppercase tracking-[0.15em]"
              style={{ color: isBoss ? 'hsl(0 84% 65%)' : 'hsl(155 100% 55%)' }}
            >
              {isBoss ? '⚠ BOSS INCIDENT' : 'NEW MISSION'}
            </span>
          </div>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mission title */}
        <h4 className="font-black text-foreground text-sm mb-1">{mission.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{mission.description}</p>

        {/* Metadata row */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
            style={
              isBoss
                ? { background: 'hsl(0 84% 60% / 0.12)', border: '1px solid hsl(0 84% 60% / 0.3)', color: 'hsl(0 84% 65%)' }
                : { background: 'hsl(48 96% 53% / 0.1)', border: '1px solid hsl(48 96% 53% / 0.3)', color: 'hsl(48 96% 60%)' }
            }
          >
            +{mission.xpReward} XP
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {mission.difficulty.toUpperCase()}
          </span>
          {mission.timeLimit && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {Math.floor(((mission.timeLimit - (mission.elapsed ?? 0)) / 60))}m left
            </div>
          )}
        </div>

        {/* Action button */}
        <motion.button
          onClick={() => { navigate(`/missions/${mission.id}`); onDismiss(); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all"
          style={
            isBoss
              ? { background: 'hsl(0 84% 60% / 0.15)', border: '1px solid hsl(0 84% 60% / 0.35)', color: 'hsl(0 84% 70%)' }
              : { background: 'hsl(155 100% 50% / 0.1)', border: '1px solid hsl(155 100% 50% / 0.3)', color: 'hsl(155 100% 55%)' }
          }
        >
          <span>Accept Mission</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-0.5 bg-secondary/50">
        <motion.div
          className="h-full"
          style={{
            background: isBoss ? 'hsl(0 84% 60%)' : 'hsl(155 100% 50%)',
            width: `${progress}%`,
          }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  );
}

// ── Container that stacks multiple mission alerts ─────────────────────────────
interface MissionAlertStackProps {
  missions: Mission[];
  onDismiss: (missionId: string) => void;
}

export function MissionAlertStack({ missions, onDismiss }: MissionAlertStackProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9000] flex flex-col gap-3">
      <AnimatePresence>
        {missions.map((m) => (
          <MissionAlert key={m.id} mission={m} onDismiss={() => onDismiss(m.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
