import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'gradient-border glow-primary bg-card/80',
    danger: 'glow-danger border-destructive/50 bg-destructive/5',
    warning: 'glow-warning border-warning/50 bg-warning/5',
    success: 'glow-primary border-primary/50 bg-primary/5',
  };

  const iconStyles = {
    default: 'text-muted-foreground bg-accent',
    danger: 'text-destructive bg-destructive/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-primary bg-primary/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('glass-card p-5 relative overflow-hidden', variantStyles[variant])}
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-3xl pointer-events-none" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground" style={{ textShadow: "0 0 10px rgba(255,255,255,0.2)" }}>{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1 terminal-text">{trend}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl border border-white/5', iconStyles[variant])}>
          <Icon className="h-5 w-5 drop-shadow-md" />
        </div>
      </div>
    </motion.div>
  );
}

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      whileHover={{ borderColor: 'var(--primary)' }}
      className={cn('glass-card p-5 relative overflow-hidden transition-colors duration-300', className)}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 hover:opacity-100 transition-opacity z-0 pointer-events-none" />
      {children}
    </motion.div>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-destructive/10 text-destructive border-destructive/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-warning/10 text-warning border-warning/30',
    low: 'bg-primary/10 text-primary border-primary/30',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border', styles[severity] || styles.low)}>
      {severity}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-primary',
    processing: 'bg-warning animate-pulse',
    idle: 'bg-muted-foreground',
    error: 'bg-destructive',
    new: 'bg-primary animate-pulse',
    investigating: 'bg-warning',
    resolved: 'bg-muted-foreground',
    open: 'bg-destructive animate-pulse',
    contained: 'bg-warning',
    pending: 'bg-warning animate-pulse',
    approved: 'bg-primary',
    rejected: 'bg-destructive',
    executed: 'bg-primary',
  };

  return <span className={cn('inline-block h-2 w-2 rounded-full', colors[status] || 'bg-muted-foreground')} />;
}
