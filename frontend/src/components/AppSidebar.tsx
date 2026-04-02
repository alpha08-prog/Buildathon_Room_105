import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  Bot,
  Crosshair,
  Brain,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/incidents/INC-001', label: 'Incidents', icon: Shield },
  { path: '/agents', label: 'AI Agents', icon: Bot },
  { path: '/response', label: 'Response Center', icon: Crosshair },
  { path: '/memory', label: 'Memory', icon: Brain },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2 }}
      className="h-screen sticky top-0 flex flex-col border-r border-border/50 bg-sidebar"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-wide neon-text">ASE</h1>
            <p className="text-[10px] text-muted-foreground">Agentic SOC Engine</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/'));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary glow-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}
