import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, FileSearch, Network, Shield, Zap } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard, StatusDot } from '@/components/ui/stat-card';
import { mockAgents } from '@/data/mockData';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  FileSearch,
  Network,
  Shield,
  Zap,
};

function AgentReasoningPanel({ reasoning }: { reasoning: string[] }) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    setVisibleLines(0);
    const interval = setInterval(() => {
      setVisibleLines((v) => {
        if (v >= reasoning.length) {
          clearInterval(interval);
          return v;
        }
        return v + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [reasoning]);

  return (
    <div className="bg-secondary/50 rounded-xl p-4 font-mono text-xs space-y-2 min-h-[120px]">
      {reasoning.slice(0, visibleLines).map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-2"
        >
          <span className="text-primary shrink-0">▸</span>
          <span className="text-muted-foreground">{line}</span>
        </motion.div>
      ))}
      {visibleLines < reasoning.length && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI Agent Panel</h1>
          <p className="text-sm text-muted-foreground">Monitor autonomous security agents and their reasoning</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockAgents.map((agent, i) => {
            const Icon = iconMap[agent.icon] || Bot;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2.5 rounded-xl',
                        agent.status === 'active' ? 'bg-primary/10 text-primary' :
                        agent.status === 'processing' ? 'bg-warning/10 text-warning' :
                        'bg-accent text-muted-foreground'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{agent.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusDot status={agent.status} />
                          <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className={cn(
                        'text-lg font-bold',
                        agent.confidence >= 90 ? 'text-primary' :
                        agent.confidence >= 80 ? 'text-warning' : 'text-destructive'
                      )}>{agent.confidence}%</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">{agent.lastAction}</p>

                  <div>
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Reasoning Chain</p>
                    <AgentReasoningPanel reasoning={agent.reasoning} />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
