import { motion } from 'framer-motion';
import { Crosshair, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard, SeverityBadge, StatusDot } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export default function ResponseCenter() {
  const { responseActions, updateActionStatus } = useStore();
  const pending = responseActions.filter((a) => a.status === 'pending');
  const resolved = responseActions.filter((a) => a.status !== 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Response Center</h1>
          <p className="text-sm text-muted-foreground">Review and approve AI-suggested response actions</p>
        </div>

        {/* Pending */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Pending Approval ({pending.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="border-warning/20">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Crosshair className="h-4 w-4 text-primary" />
                        {action.action}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{action.target}</p>
                    </div>
                    <SeverityBadge severity={action.riskLevel} />
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">{action.explanation}</p>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">Suggested by: {action.suggestedBy} · {action.incidentId}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateActionStatus(action.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => updateActionStatus(action.id, 'approved')}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors glow-primary"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Resolved */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Action History</h2>
          <GlassCard>
            <div className="space-y-2">
              {resolved.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/30">
                  <div className="flex items-center gap-3">
                    {action.status === 'approved' ? (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <ShieldX className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{action.action} — <span className="font-mono">{action.target}</span></p>
                      <p className="text-xs text-muted-foreground">{action.suggestedBy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusDot status={action.status} />
                    <span className="text-xs capitalize text-muted-foreground">{action.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
