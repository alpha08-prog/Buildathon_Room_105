import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

interface HolographicThreatSphereProps {
  className?: string;
  height?: number;
}

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
};

const SEVERITY_STYLES: Record<Node['severity'], { color: string; glow: string }> = {
  critical: { color: '#ff4d4f', glow: 'rgba(255, 77, 79, 0.32)' },
  high: { color: '#f97316', glow: 'rgba(249, 115, 22, 0.28)' },
  medium: { color: '#facc15', glow: 'rgba(250, 204, 21, 0.24)' },
  low: { color: '#00ff80', glow: 'rgba(0, 255, 128, 0.22)' },
};

export function HolographicThreatSphere({ className, height = 400 }: HolographicThreatSphereProps) {
  const { missions } = useStore();
  const isBossMode = missions.some((m) => m.status === 'active' && m.bossFight);

  const nodes = useMemo<Node[]>(
    () => [
      { id: 'attacker', label: '185.220.101.34', x: 12, y: 50, severity: 'critical' },
      { id: 'vpn', label: 'VPN Gateway', x: 30, y: 35, severity: 'high' },
      { id: 'dc01', label: 'DC-01', x: 52, y: 24, severity: 'critical' },
      { id: 'web03', label: 'WEB-03', x: 54, y: 66, severity: 'high' },
      { id: 'db02', label: 'DB-02', x: 82, y: 50, severity: 'critical' },
      { id: 'user', label: 'svc_backup', x: 38, y: 14, severity: 'medium' },
    ],
    []
  );

  const edges = [
    ['attacker', 'vpn'],
    ['vpn', 'dc01'],
    ['vpn', 'web03'],
    ['web03', 'db02'],
    ['user', 'vpn'],
    ['dc01', 'user'],
  ] as const;

  const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node])) as Record<string, Node>;

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl border border-border/40', className)}
      style={{
        height,
        background: isBossMode
          ? 'radial-gradient(circle at 50% 50%, rgba(127, 29, 29, 0.28), rgba(9, 12, 24, 0.98) 65%)'
          : 'radial-gradient(circle at 50% 50%, rgba(0, 255, 128, 0.12), rgba(9, 12, 24, 0.98) 65%)',
      }}
    >
      <div
        className="absolute inset-[10%] rounded-full border opacity-70"
        style={{ borderColor: isBossMode ? 'rgba(255,77,79,0.2)' : 'rgba(0,255,128,0.2)' }}
      />
      <div
        className="absolute inset-[22%] rounded-full border opacity-60"
        style={{ borderColor: isBossMode ? 'rgba(255,77,79,0.14)' : 'rgba(96,165,250,0.18)' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />

      {isBossMode && (
        <div className="absolute left-4 top-4 rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
          Boss Threat Active
        </div>
      )}

      <div
        className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{
          borderColor: isBossMode ? 'rgba(255,77,79,0.55)' : 'rgba(0,255,128,0.5)',
          background: isBossMode ? 'rgba(255,77,79,0.12)' : 'rgba(0,255,128,0.08)',
          boxShadow: isBossMode ? '0 0 32px rgba(255,77,79,0.3)' : '0 0 28px rgba(0,255,128,0.2)',
        }}
      >
        <div
          className="absolute inset-[22%] rounded-full border animate-pulse"
          style={{ borderColor: isBossMode ? 'rgba(255,77,79,0.5)' : 'rgba(96,165,250,0.5)' }}
        />
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map(([fromId, toId], index) => {
          const from = nodeMap[fromId];
          const to = nodeMap[toId];
          const active = index < 4;
          return (
            <line
              key={`${fromId}-${toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={active ? (isBossMode ? '#ff4d4f' : '#00ff80') : 'rgba(255,255,255,0.18)'}
              strokeWidth={active ? 1.4 : 0.8}
              strokeDasharray={active ? '0' : '2 2'}
            />
          );
        })}
      </svg>

      {nodes.map((node) => {
        const style = SEVERITY_STYLES[node.severity];
        return (
          <div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div
              className="h-4 w-4 rounded-full border"
              style={{
                borderColor: style.color,
                background: style.color,
                boxShadow: `0 0 16px ${style.glow}`,
              }}
            />
            <div className="mt-2 whitespace-nowrap text-[10px] font-semibold text-foreground/90">
              {node.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
