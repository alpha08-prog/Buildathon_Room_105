import { cn } from '@/lib/utils';

type NodeStatus = 'safe' | 'suspicious' | 'compromised' | 'isolated';

interface GraphNode {
  id: string;
  label: string;
  position: [number, number, number];
  status: NodeStatus;
}

interface GraphEdge {
  from: string;
  to: string;
  active: boolean;
}

const STATUS_COLORS: Record<NodeStatus, { color: string; glow: string }> = {
  safe: { color: '#00ff80', glow: 'rgba(0, 255, 128, 0.2)' },
  suspicious: { color: '#facc15', glow: 'rgba(250, 204, 21, 0.22)' },
  compromised: { color: '#ff4d4f', glow: 'rgba(255, 77, 79, 0.26)' },
  isolated: { color: '#6b7280', glow: 'rgba(107, 114, 128, 0.18)' },
};

const DEFAULT_NODES: GraphNode[] = [
  { id: 'vpn', label: 'VPN GW', status: 'compromised', position: [-2, 0.2, 0] },
  { id: 'dc01', label: 'DC-01', status: 'compromised', position: [-0.6, 0.8, -0.5] },
  { id: 'web03', label: 'WEB-03', status: 'compromised', position: [-0.6, -0.6, 0.5] },
  { id: 'db02', label: 'DB-02', status: 'suspicious', position: [1.2, 0, 0] },
  { id: 'fs01', label: 'FS-01', status: 'safe', position: [2.4, 0.6, 0.3] },
  { id: 'ws15', label: 'WS-15', status: 'isolated', position: [0.5, 1.4, -0.8] },
];

const DEFAULT_EDGES: GraphEdge[] = [
  { from: 'vpn', to: 'dc01', active: true },
  { from: 'vpn', to: 'web03', active: true },
  { from: 'web03', to: 'db02', active: true },
  { from: 'dc01', to: 'db02', active: false },
  { from: 'db02', to: 'fs01', active: false },
  { from: 'dc01', to: 'ws15', active: false },
];

interface DataNetworkGraphProps {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  height?: number;
  className?: string;
}

export function DataNetworkGraph({
  nodes = DEFAULT_NODES,
  edges = DEFAULT_EDGES,
  height = 320,
  className,
}: DataNetworkGraphProps) {
  const nodeMap = Object.fromEntries(
    nodes.map((node) => [
      node.id,
      {
        x: 50 + node.position[0] * 16,
        y: 50 + node.position[1] * 18,
        status: node.status,
        label: node.label,
      },
    ])
  ) as Record<string, { x: number; y: number; status: NodeStatus; label: string }>;

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl border border-border/40', className)}
      style={{
        height,
        background:
          'radial-gradient(circle at 50% 30%, rgba(96,165,250,0.12), transparent 35%), linear-gradient(180deg, rgba(7,11,21,0.96), rgba(4,8,18,1))',
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:36px_36px] opacity-25" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map((edge) => {
          const from = nodeMap[edge.from];
          const to = nodeMap[edge.to];
          if (!from || !to) return null;

          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edge.active ? STATUS_COLORS[from.status].color : 'rgba(255,255,255,0.14)'}
              strokeWidth={edge.active ? 1.2 : 0.8}
              strokeDasharray={edge.active ? '0' : '2 2'}
            />
          );
        })}
      </svg>

      {nodes.map((node) => {
        const point = nodeMap[node.id];
        const palette = STATUS_COLORS[node.status];
        return (
          <div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            <div
              className={cn(
                'h-4 w-4 rounded-full border',
                node.status === 'compromised' && 'animate-pulse'
              )}
              style={{
                borderColor: palette.color,
                background: palette.color,
                boxShadow: `0 0 14px ${palette.glow}`,
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
