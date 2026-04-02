import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Flame, ShieldOff, Ghost, BookOpen, Search, Sword } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Achievement } from '@/data/mockData';

const ICONS: Record<string, LucideIcon> = {
  Trophy, Zap, Flame, ShieldOff, Ghost, BookOpen, Search, Sword,
};

const RARITY_STYLES: Record<string, { bg: string; border: string; glow: string; label: string }> = {
  common:    { bg: 'hsl(220 20% 14%)',           border: 'hsl(220 20% 30%)',        glow: 'none',                                   label: 'COMMON' },
  rare:      { bg: 'hsl(217 91% 10%)',            border: 'hsl(217 91% 60% / 0.6)', glow: '0 0 20px hsl(217 91% 60% / 0.3)',        label: 'RARE' },
  epic:      { bg: 'hsl(271 40% 10%)',            border: 'hsl(271 91% 65% / 0.6)', glow: '0 0 28px hsl(271 91% 65% / 0.35)',       label: 'EPIC' },
  legendary: { bg: 'linear-gradient(135deg, hsl(45 100% 12%), hsl(220 26% 9%))', border: 'hsl(45 100% 55% / 0.7)', glow: '0 0 40px hsl(45 100% 55% / 0.4)', label: 'LEGENDARY' },
};

function ParticleBurst({ rarity }: { rarity: string }) {
  const count = rarity === 'legendary' ? 12 : rarity === 'epic' ? 8 : 6;
  const colors = rarity === 'legendary' ? ['#fbbf24','#f59e0b','#fde68a']
               : rarity === 'epic'      ? ['#a78bfa','#c4b5fd','#7c3aed']
               : rarity === 'rare'      ? ['#60a5fa','#93c5fd','#3b82f6']
               : ['#6b7280','#9ca3af'];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        const delay = i * 0.05;
        const color = colors[i % colors.length];
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ background: color, left: '50%', top: '50%' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * 80,
              y: Math.sin((angle * Math.PI) / 180) * 80,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.9, delay, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

export function AchievementUnlockOverlay() {
  const { pendingAchievement, dismissAchievement } = useStore();
  const ach = pendingAchievement as Achievement | null;

  const style = ach ? RARITY_STYLES[ach.rarity] : RARITY_STYLES.common;
  const Icon  = ach ? (ICONS[ach.icon] ?? Trophy) : Trophy;

  return (
    <AnimatePresence>
      {ach && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissAchievement}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-1/2 left-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-80"
            initial={{ opacity: 0, scale: 0.6, y: -60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            <div
              className="relative rounded-2xl p-6 border-2 overflow-hidden"
              style={{
                background: style.bg,
                borderColor: style.border,
                boxShadow: style.glow,
              }}
            >
              <ParticleBurst rarity={ach.rarity} />

              {/* Rarity label */}
              <div className="flex justify-center mb-4">
                <span
                  className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full"
                  style={{
                    background: `${style.border}22`,
                    border: `1px solid ${style.border}`,
                    color: style.border,
                    textShadow: `0 0 8px ${style.border}`,
                  }}
                >
                  {style.label} UNLOCKED
                </span>
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `${style.border}15`, border: `2px solid ${style.border}` }}
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeInOut' }}
                >
                  <Icon className="w-8 h-8" style={{ color: style.border }} />
                </motion.div>
              </div>

              {/* Achievement info */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-black text-foreground mb-1">{ach.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ach.description}</p>
              </div>

              {/* XP reward */}
              <div className="flex justify-center mb-5">
                <div className="hud-panel gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="font-black text-yellow-400">+{ach.xpReward} XP</span>
                </div>
              </div>

              {/* Dismiss */}
              <motion.button
                onClick={dismissAchievement}
                className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wider uppercase transition-all"
                style={{
                  background: `${style.border}18`,
                  border: `1px solid ${style.border}50`,
                  color: style.border,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Claim Reward
              </motion.button>

              {/* Corner glow */}
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
                style={{ background: style.border }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
