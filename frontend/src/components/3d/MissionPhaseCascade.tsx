import { cn } from '@/lib/utils';
import type { MissionPhase } from '@/data/mockData';

const PHASES: MissionPhase[] = [
  'Initial Access',
  'Discovery',
  'Lateral Movement',
  'Containment',
  'Recovery',
];

const PHASE_COLORS: Record<MissionPhase, string> = {
  'Initial Access': '#f97316',
  Discovery: '#60a5fa',
  'Lateral Movement': '#ff4d4f',
  Containment: '#facc15',
  Recovery: '#00ff80',
};

interface MissionPhaseCascadeProps {
  currentPhase: MissionPhase;
  progress?: number;
  className?: string;
  height?: number;
}

export function MissionPhaseCascade({
  currentPhase,
  progress = 50,
  className,
  height = 200,
}: MissionPhaseCascadeProps) {
  const currentIndex = PHASES.indexOf(currentPhase);

  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-border/40 p-4', className)}
      style={{
        height,
        background:
          'radial-gradient(circle at top, rgba(96,165,250,0.12), transparent 40%), linear-gradient(180deg, rgba(8,12,22,0.96), rgba(4,8,18,1))',
      }}
    >
      <div className="grid h-full grid-cols-5 items-center gap-3">
        {PHASES.map((phase, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const color = PHASE_COLORS[phase];
          const fill = isPast ? 100 : isCurrent ? progress : 0;

          return (
            <div key={phase} className="relative flex h-full flex-col items-center justify-center gap-3">
              <div
                className="relative flex h-20 w-full items-center justify-center rounded-2xl border"
                style={{
                  borderColor: isCurrent ? `${color}aa` : isPast ? `${color}66` : 'rgba(148,163,184,0.18)',
                  background: isCurrent
                    ? `linear-gradient(180deg, ${color}22, rgba(15,23,42,0.9))`
                    : isPast
                    ? `linear-gradient(180deg, ${color}18, rgba(15,23,42,0.78))`
                    : 'rgba(15,23,42,0.6)',
                  boxShadow: isCurrent ? `0 0 24px ${color}33` : 'none',
                }}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black',
                    isCurrent && 'animate-pulse'
                  )}
                  style={{
                    borderColor: isPast || isCurrent ? color : 'rgba(148,163,184,0.24)',
                    color: isPast || isCurrent ? color : 'rgba(148,163,184,0.5)',
                    background: isPast || isCurrent ? `${color}18` : 'rgba(15,23,42,0.8)',
                  }}
                >
                  {index + 1}
                </div>
                <div className="absolute bottom-0 left-0 h-1 rounded-full" style={{ width: `${fill}%`, background: color }} />
              </div>

              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: isPast || isCurrent ? color : 'rgba(148,163,184,0.55)' }}>
                  {phase}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {isCurrent ? `${progress}% active` : isPast ? 'Completed' : 'Locked'}
                </p>
              </div>

              {index < PHASES.length - 1 && (
                <div className="absolute right-[-10%] top-1/2 hidden h-[2px] w-[20%] -translate-y-1/2 rounded-full bg-border/40 lg:block">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${isPast ? 100 : isCurrent ? 50 : 0}%`,
                      background: color,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
