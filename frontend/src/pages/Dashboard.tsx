import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Activity,
  TrendingUp,
  Clock,
  Server,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard, GlassCard, SeverityBadge, StatusDot } from '@/components/ui/stat-card';
import { useStore } from '@/store/useStore';
import { threatChartData, mockAlerts, Alert } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AttackGraph } from '@/components/AttackGraph';

const simulatedAlerts: Partial<Alert>[] = [
  { title: 'C2 Beacon Detected', severity: 'critical', source: '10.0.5.22' },
  { title: 'Unusual PowerShell Activity', severity: 'high', source: '10.0.1.88' },
  { title: 'Suspicious File Download', severity: 'medium', source: '10.0.3.14' },
  { title: 'SSH Key Manipulation', severity: 'high', source: '10.0.2.45' },
  { title: 'Registry Modification', severity: 'low', source: '10.0.4.67' },
];

export default function Dashboard() {
  const { alerts, addAlert, simulationActive } = useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [heatmapData] = useState(() =>
    Array.from({ length: 24 }, (_, h) =>
      Array.from({ length: 7 }, () => Math.floor(Math.random() * 10))
    )
  );

  useEffect(() => {
    if (simulationActive) {
      intervalRef.current = setInterval(() => {
        const tpl = simulatedAlerts[Math.floor(Math.random() * simulatedAlerts.length)];
        addAlert({
          id: `ALT-${Date.now()}`,
          title: tpl.title!,
          severity: tpl.severity!,
          source: tpl.source!,
          timestamp: new Date().toISOString(),
          status: 'new',
          description: 'Auto-generated alert from live simulation',
        });
      }, 3000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [simulationActive, addAlert]);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const activeIncidents = 3;
  const totalAlerts = alerts.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 scanline min-h-screen pb-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest"><span className="text-primary/80 drop-shadow-[0_0_8px_rgba(0,255,128,0.5)]">Security Dashboard</span></h1>
          <p className="text-sm text-muted-foreground terminal-text">Real-time threat monitoring and analysis</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Critical Alerts" value={criticalCount} icon={ShieldAlert} variant="danger" trend="+2 in last hour" />
          <StatCard title="Active Incidents" value={activeIncidents} icon={AlertTriangle} variant="warning" trend="1 escalated" />
          <StatCard title="Total Alerts" value={totalAlerts} icon={Activity} variant="default" trend="Last 24h" />
          <StatCard title="Agents Active" value="4/4" icon={Server} variant="success" trend="All operational" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-primary/90 drop-shadow-[0_0_4px_rgba(0,255,128,0.3)] tracking-wider">Threat Activity</span>
              </h2>
              <span className="text-xs text-muted-foreground">Last 24 hours</span>
            </div>
            <div className="flex-1 min-h-[260px] w-full relative">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={threatChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 16%)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid hsl(220 20% 16%)', borderRadius: '12px', fontSize: 12 }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                    <Area type="monotone" dataKey="critical" stroke="#ff4d4f" fill="url(#critGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="high" stroke="#f97316" fill="url(#highGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="medium" stroke="#facc15" fill="url(#medGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

          {/* Severity Heatmap */}
          <GlassCard className="flex flex-col">
            <h2 className="text-sm font-semibold mb-4">Severity Heatmap (24h)</h2>
            <div className="flex-1 min-h-[220px]">
              <div className="grid grid-cols-6 gap-2 h-full">
                {heatmapData.slice(0, 24).map((row, i) => (
                    <div
                      key={`hour-${i}`}
                      className="rounded-sm"
                      style={{
                        backgroundColor:
                          row[0] > 7 ? 'hsl(0 84% 60% / 0.8)' :
                          row[0] > 5 ? 'hsl(25 95% 53% / 0.6)' :
                          row[0] > 3 ? 'hsl(48 96% 53% / 0.4)' :
                          row[0] > 1 ? 'hsl(155 100% 50% / 0.2)' :
                          'hsl(220 20% 14%)',
                      }}
                      title={`Hour ${i}: ${row[0]} threats`}
                    />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 text-[10px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'hsl(155 100% 50% / 0.2)' }} /> Low</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'hsl(48 96% 53% / 0.4)' }} /> Med</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'hsl(25 95% 53% / 0.6)' }} /> High</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: 'hsl(0 84% 60% / 0.8)' }} /> Crit</span>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-full">
            <AttackGraph />
          </div>

          {/* Alerts Panel */}
          <GlassCard className="h-full min-h-[350px] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <span className="tracking-wider drop-shadow-sm">Real-Time Alerts</span>
              </h2>
              <span className="text-xs text-muted-foreground">{alerts.length} total</span>
            </div>
            <div className="space-y-2 overflow-y-auto scrollbar-thin min-h-0 flex-1 pr-2 pb-2">
              {alerts.slice(0, 10).map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/30 hover:bg-accent/50 transition-colors',
                    alert.severity === 'critical' && 'border-destructive/30 glow-danger'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusDot status={alert.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground terminal-text">{alert.source} · {new Date(alert.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <SeverityBadge severity={alert.severity} />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Timeline */}
        <GlassCard>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="tracking-wider drop-shadow-sm">Event Timeline</span>
          </h2>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border/50" />
            {alerts.slice(0, 5).map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                className="relative"
              >
                <div className={cn(
                  'absolute left-[-18px] top-1 h-3 w-3 rounded-full border-2 border-card',
                  alert.severity === 'critical' ? 'bg-destructive glow-danger' :
                  alert.severity === 'high' ? 'bg-orange-400 glow-warning' :
                  alert.severity === 'medium' ? 'bg-warning glow-warning' : 'bg-primary glow-primary'
                )} />
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground terminal-text">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
