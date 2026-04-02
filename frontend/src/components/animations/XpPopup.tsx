import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';

export function XpPopupLayer() {
  const { xpEvents, dismissXpEvent } = useStore();

  useEffect(() => {
    xpEvents.forEach((e) => {
      const timer = setTimeout(() => dismissXpEvent(e.id), 1400);
      return () => clearTimeout(timer);
    });
  }, [xpEvents, dismissXpEvent]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {xpEvents.map((evt) => {
          const x = evt.x ?? window.innerWidth / 2;
          const y = evt.y ?? window.innerHeight / 2;
          const isCombo = evt.multiplier > 1.5;
          const isBig   = evt.amount >= 150;

          return (
            <motion.div
              key={evt.id}
              initial={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              animate={{ opacity: 0, y: -90, scale: isBig ? 1.3 : 1.1, x: (Math.random() - 0.5) * 40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', left: x - 30, top: y - 20 }}
            >
              <div className={`flex flex-col items-center gap-0.5 select-none`}>
                {/* Main XP value */}
                <span
                  className={`font-black tracking-tight leading-none ${
                    isBig   ? 'text-2xl' :
                    isCombo ? 'text-xl'  : 'text-lg'
                  }`}
                  style={{
                    color: isBig
                      ? 'hsl(48 96% 60%)'
                      : isCombo
                      ? 'hsl(155 100% 60%)'
                      : 'hsl(155 100% 50%)',
                    textShadow: `0 0 16px ${isBig ? 'hsl(48 96% 53%)' : 'hsl(155 100% 50% / 0.8)'}`,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  +{evt.amount} XP
                </span>

                {/* Combo multiplier badge */}
                {evt.multiplier > 1 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: 'hsl(48 96% 53% / 0.15)',
                      border: '1px solid hsl(48 96% 53% / 0.4)',
                      color: 'hsl(48 96% 65%)',
                    }}
                  >
                    ×{evt.multiplier.toFixed(1)} COMBO
                  </span>
                )}
              </div>

              {/* Particle ring on big XP */}
              {isBig && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-yellow-400/60"
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40 }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
