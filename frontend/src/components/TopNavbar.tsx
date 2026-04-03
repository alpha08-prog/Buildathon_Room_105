import { Bell, Radio, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function TopNavbar() {
  const {
    backendError,
    backendStatus,
    clearNotifications,
    lastSyncedAt,
    notifications,
    simulationActive,
    toggleSimulation,
  } = useStore();

  const statusMeta =
    backendStatus === 'connected'
      ? {
          color: 'bg-primary',
          label: lastSyncedAt
            ? `Backend Connected · ${new Date(lastSyncedAt).toLocaleTimeString()}`
            : 'Backend Connected',
        }
      : backendStatus === 'connecting'
        ? {
            color: 'bg-warning animate-pulse',
            label: 'Connecting to Backend',
          }
        : backendStatus === 'error'
          ? {
              color: 'bg-destructive',
              label: backendError ? `Backend Offline · ${backendError}` : 'Backend Offline',
            }
          : {
              color: 'bg-muted-foreground',
              label: 'Mock Data Mode',
            };

  return (
    <header className="h-14 border-b border-border/50 bg-card/40 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search threats, IPs, incidents..."
            className="h-9 w-72 rounded-lg bg-secondary border border-border/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Simulation Toggle */}
        <button
          onClick={toggleSimulation}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            simulationActive
              ? 'bg-destructive/10 text-destructive glow-danger'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          <Radio className={cn('h-3 w-3', simulationActive && 'animate-pulse')} />
          {simulationActive ? 'LIVE' : 'Simulate'}
        </button>

        {/* Notifications */}
        <button onClick={clearNotifications} className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <AnimatePresence>
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
              >
                {notifications}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn('h-2 w-2 rounded-full', statusMeta.color)} />
          <span>{statusMeta.label}</span>
        </div>
      </div>
    </header>
  );
}
