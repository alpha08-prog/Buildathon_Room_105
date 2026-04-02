import { motion } from 'framer-motion';
import { Globe, Shield, Server, Database, AlertCircle } from 'lucide-react';
import { GlassCard } from './ui/stat-card';

const nodes = [
  { id: '1', label: 'External Host', icon: Globe, status: 'compromised', x: 10, y: 50 },
  { id: '2', label: 'Firewall', icon: Shield, status: 'bypassed', x: 35, y: 50 },
  { id: '3', label: 'Web Server', icon: Server, status: 'active', x: 65, y: 30 },
  { id: '4', label: 'Main DB', icon: Database, status: 'safe', x: 90, y: 50 },
  { id: '5', label: 'Auth Server', icon: Server, status: 'safe', x: 65, y: 70 },
];

const paths = [
  { source: 0, target: 1, active: true },
  { source: 1, target: 2, active: true },
  { source: 1, target: 4, active: false },
  { source: 2, target: 3, active: true },
];

export function AttackGraph() {
  return (
    <GlassCard className="relative h-full min-h-[350px] w-full overflow-hidden p-0 border border-border/50">
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/5 shadow-sm">
        <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />
        <h3 className="text-xs font-semibold font-mono uppercase tracking-widest text-destructive drop-shadow-sm">Active Attack Vector</h3>
      </div>
      
      {/* Network background grid - Cyberpunk style */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      {/* Drawing lines connecting nodes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
        {paths.map((path, idx) => {
          const source = nodes[path.source];
          const target = nodes[path.target];
          return (
            <g key={idx}>
              <line
                x1={`${source.x}%`}
                y1={`${source.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke="hsl(var(--muted-foreground) / 0.2)"
                strokeWidth="2"
              />
              {path.active && (
                <motion.line
                  x1={`${source.x}%`}
                  y1={`${source.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke="hsl(var(--destructive))" // Destructive red for attack path
                  strokeWidth="2"
                  strokeDasharray="4 6"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              )}
              {path.active && (
                <motion.circle
                  r="3"
                  fill="hsl(var(--destructive))"
                  initial={{ cx: `${source.x}%`, cy: `${source.y}%` }}
                  animate={{ cx: `${target.x}%`, cy: `${target.y}%` }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                    repeatType: "loop",
                  }}
                  style={{ filter: "drop-shadow(0 0 6px hsl(var(--destructive)))" }}
                />
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-20"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: parseInt(node.id) * 0.1 }}
        >
          <div
            className={`p-3 rounded-xl border backdrop-blur-md relative ${
              node.status === 'compromised'
                ? 'border-destructive/50 bg-destructive/10 glow-danger'
                : node.status === 'bypassed'
                ? 'border-warning/50 bg-warning/10 glow-warning'
                : node.status === 'active'
                ? 'border-destructive bg-destructive/20 animate-pulse'
                : 'border-primary/30 bg-primary/10 glow-primary'
            }`}
          >
            {node.status === 'active' && (
               <div className="absolute inset-0 rounded-xl border border-destructive/80 animate-ping opacity-50" />
            )}
            <node.icon className={`w-5 h-5 relative z-10 ${
              node.status === 'compromised' || node.status === 'active' ? 'text-destructive' 
                : node.status === 'bypassed' ? 'text-warning' : 'text-primary drop-shadow-[0_0_8px_rgba(0,255,128,0.8)]'
            }`} />
          </div>
          <p className="text-[10px] uppercase font-mono tracking-wider whitespace-nowrap bg-card/90 px-2 py-0.5 rounded border border-white/5 text-foreground shadow-sm">
            {node.label}
          </p>
        </motion.div>
      ))}
    </GlassCard>
  );
}
