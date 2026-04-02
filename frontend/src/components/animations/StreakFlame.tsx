import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StreakFlameProps {
  streak: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakFlame({ streak, className, size = 'md' }: StreakFlameProps) {
  const isHot  = streak >= 3;
  const isRage = streak >= 7;

  const sizeMap = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  const iconSize = { sm: 14, md: 18, lg: 24 };
  const sz = iconSize[size];

  // Pick colors based on streak intensity
  const flameColor = isRage
    ? 'hsl(0 84% 60%)'
    : isHot
    ? 'hsl(25 95% 53%)'
    : 'hsl(48 96% 53%)';

  const glowColor = isRage
    ? 'hsl(0 84% 60% / 0.6)'
    : isHot
    ? 'hsl(25 95% 53% / 0.5)'
    : 'hsl(48 96% 53% / 0.3)';

  return (
    <div className={cn('flex items-center gap-1.5 select-none', className)}>
      {/* Flame SVG with animation */}
      <motion.svg
        width={sz} height={sz} viewBox="0 0 24 24" fill="none"
        animate={isHot ? {
          scaleY: [1, 1.1, 0.95, 1.08, 1],
          skewX: [0, -3, 3, -2, 0],
          filter: [
            `drop-shadow(0 0 4px ${flameColor})`,
            `drop-shadow(0 0 10px ${flameColor})`,
            `drop-shadow(0 0 4px ${flameColor})`,
          ],
        } : {}}
        transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M12 2C12 2 8 7 8 11C8 13.2 9.8 15 12 15C14.2 15 16 13.2 16 11C16 7 12 2 12 2Z"
          fill={flameColor}
          opacity={0.9}
        />
        <path
          d="M12 8C12 8 10 11 10 13C10 14.1 10.9 15 12 15C13.1 15 14 14.1 14 13C14 11 12 8 12 8Z"
          fill="hsl(48 96% 80%)"
          opacity={0.8}
        />
        <path
          d="M12 22C8.13 22 5 18.87 5 15C5 11 8 7 12 2C16 7 19 11 19 15C19 18.87 15.87 22 12 22Z"
          fill={flameColor}
          opacity={0.4}
        />
      </motion.svg>

      {/* Streak count */}
      <motion.span
        key={streak}
        initial={{ scale: 1.4, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400 }}
        className={cn('font-black tabular-nums', sizeMap[size])}
        style={{
          color: flameColor,
          textShadow: `0 0 10px ${glowColor}`,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {streak}
      </motion.span>

      {/* Rage indicator */}
      {isRage && (
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{
            background: 'hsl(0 84% 60% / 0.15)',
            border: '1px solid hsl(0 84% 60% / 0.4)',
            color: 'hsl(0 84% 65%)',
          }}
        >
          RAGE
        </motion.span>
      )}
    </div>
  );
}
