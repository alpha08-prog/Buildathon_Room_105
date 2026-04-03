import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Crosshair,
  FileText,
  GitBranch,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard, SeverityBadge, StatusDot } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';

export default function ResponseCenter() {
  const {
    approveResponseAction,
    rejectResponseAction,
    responseActions,
    responses,
  } = useStore();
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const pending = responseActions.filter((action) => action.status === 'pending');
  const resolved = responseActions.filter((action) => action.status !== 'pending');
  const latestResponse = responses[0];
  const responseByIncident = useMemo(
    () => new Map(responses.map((response) => [response.incidentId, response])),
    [responses]
  );

  const handleDecision = async (actionId: string, decision: 'approved' | 'rejected') => {
    setBusyActionId(actionId);
    try {
      if (decision === 'approved') {
        await approveResponseAction(actionId);
      } else {
        await rejectResponseAction(actionId);
      }
    } finally {
      setBusyActionId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Response Center</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve AI-suggested response actions
          </p>
        </div>

        {latestResponse && (
          <GlassCard className="border-primary/20">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="max-w-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">Latest Model Briefing</h2>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {latestResponse.priority} priority
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {latestResponse.report}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>{latestResponse.pipelineSteps.join(' -> ')}</span>
                </div>
              </div>
              <div className="min-w-[180px] text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Action Status
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {latestResponse.actionTaken}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {latestResponse.actionStatus}
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Pending Approval ({pending.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pending.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="border-warning/20">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <Crosshair className="h-4 w-4 text-primary" />
                        {action.action}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {action.target}
                      </p>
                    </div>
                    <SeverityBadge severity={action.riskLevel} />
                  </div>

                  <p className="mb-4 text-xs text-muted-foreground">{action.explanation}</p>

                  {action.report && (
                    <div className="mb-4 rounded-xl border border-border/30 bg-secondary/30 p-3">
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Model Response
                      </p>
                      <p className="line-clamp-4 text-xs text-muted-foreground">
                        {action.report}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      Suggested by: {action.suggestedBy} · {action.incidentId}
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                        disabled={busyActionId === action.id}
                        onClick={() => void handleDecision(action.id, 'rejected')}
                      >
                        {busyActionId === action.id ? 'Working...' : 'Reject'}
                      </button>
                      <button
                        className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                        disabled={busyActionId === action.id}
                        onClick={() => void handleDecision(action.id, 'approved')}
                      >
                        {busyActionId === action.id ? 'Working...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold">Action History</h2>
          <GlassCard>
            <div className="space-y-2">
              {resolved.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between rounded-xl border border-border/30 bg-secondary/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    {action.status === 'approved' || action.status === 'executed' ? (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <ShieldX className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {action.action} - <span className="font-mono">{action.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.suggestedBy}
                        {action.actionStatus ? ` · ${action.actionStatus}` : ''}
                        {responseByIncident.get(action.incidentId)?.report ? ' · report available' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusDot status={action.status} />
                    <span className="text-xs capitalize text-muted-foreground">
                      {action.status}
                    </span>
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
