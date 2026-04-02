import { cn } from '@/lib/utils';

const RARITY_COLORS: Record<string, { base: string; glow: string; accent: string }> = {
  common: { base: '#9ca3af', glow: 'rgba(156, 163, 175, 0.28)', accent: '#e5e7eb' },
  rare: { base: '#60a5fa', glow: 'rgba(96, 165, 250, 0.35)', accent: '#bfdbfe' },
  epic: { base: '#a78bfa', glow: 'rgba(167, 139, 250, 0.38)', accent: '#ddd6fe' },
  legendary: { base: '#fbbf24', glow: 'rgba(251, 191, 36, 0.45)', accent: '#fef3c7' },
};

interface AchievementTrophyProps {
  rarity: string;
  showUnlock?: boolean;
  size?: number;
  className?: string;
}

export function AchievementTrophy({
  rarity,
  showUnlock = false,
  size = 120,
  className,
}: AchievementTrophyProps) {
  const palette = RARITY_COLORS[rarity] ?? RARITY_COLORS.common;
  const particleCount = showUnlock ? 10 : 0;

  return (
    <div
      className={cn('relative isolate overflow-hidden rounded-xl', className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 35%, ${palette.glow}, transparent 58%), linear-gradient(180deg, rgba(10,15,28,0.92), rgba(6,10,20,0.98))`,
        boxShadow: `inset 0 0 24px ${palette.glow}`,
      }}
    >
      <div
        className="absolute left-1/2 top-[14%] h-[16%] w-[38%] -translate-x-1/2 rounded-full border"
        style={{
          borderColor: `${palette.accent}88`,
          background: `linear-gradient(180deg, ${palette.accent}, ${palette.base})`,
          boxShadow: `0 0 18px ${palette.glow}`,
        }}
      />
      <div
        className="absolute left-1/2 top-[24%] h-[34%] w-[28%] -translate-x-1/2 rounded-[28%_28%_38%_38%/18%_18%_52%_52%] border"
        style={{
          borderColor: `${palette.accent}66`,
          background: `linear-gradient(180deg, ${palette.accent}, ${palette.base} 40%, ${palette.base} 100%)`,
          boxShadow: `0 10px 28px ${palette.glow}`,
        }}
      />
      <div
        className="absolute left-[18%] top-[28%] h-[18%] w-[18%] rounded-full border-[5px] border-r-0"
        style={{ borderColor: `${palette.base}cc` }}
      />
      <div
        className="absolute right-[18%] top-[28%] h-[18%] w-[18%] rounded-full border-[5px] border-l-0"
        style={{ borderColor: `${palette.base}cc` }}
      />
      <div
        className="absolute left-1/2 top-[58%] h-[14%] w-[8%] -translate-x-1/2 rounded-full"
        style={{ background: `linear-gradient(180deg, ${palette.accent}, ${palette.base})` }}
      />
      <div
        className="absolute left-1/2 top-[69%] h-[10%] w-[40%] -translate-x-1/2 rounded-md"
        style={{
          background: `linear-gradient(180deg, ${palette.accent}, ${palette.base})`,
          boxShadow: `0 0 18px ${palette.glow}`,
        }}
      />

      {rarity === 'legendary' && (
        <div
          className="absolute left-1/2 top-[18%] h-[12%] w-[12%] -translate-x-1/2 rotate-45 rounded-[2px]"
          style={{ background: palette.accent, boxShadow: `0 0 16px ${palette.glow}` }}
        />
      )}

      {Array.from({ length: particleCount }).map((_, index) => {
        const angle = (index / particleCount) * Math.PI * 2;
        const x = 50 + Math.cos(angle) * 34;
        const y = 50 + Math.sin(angle) * 26;
        return (
          <span
            key={index}
            className="absolute h-1.5 w-1.5 rounded-full animate-pulse"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: palette.accent,
              boxShadow: `0 0 12px ${palette.glow}`,
              animationDelay: `${index * 120}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
