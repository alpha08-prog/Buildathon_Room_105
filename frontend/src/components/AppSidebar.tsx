import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Shield, Bot, Crosshair, BookOpen,
  Activity, ChevronLeft, ChevronRight, Swords, Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { StreakFlame } from '@/components/animations/StreakFlame';

const navItems = [
  { path: '/dashboard',             label: 'Command Center', icon: LayoutDashboard, section: 'main' },
  { path: '/missions',              label: 'Missions',       icon: Swords,          section: 'main', badge: 'active' },
  { path: '/incidents',             label: 'Investigations', icon: Shield,          section: 'main' },
  { path: '/squad',                 label: 'Squad',          icon: Users,           section: 'ops' },
  { path: '/agents',                label: 'AI Agents',      icon: Bot,             section: 'ops' },
  { path: '/response',              label: 'Response Center',icon: Crosshair,       section: 'ops' },
  { path: '/codex',                 label: 'Codex',          icon: BookOpen,        section: 'intel' },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { gameState, incidents, missions, notifications } = useStore();

  const activeMissionCount = missions.filter((m) => m.status === 'active').length;
  const bossMissionCount   = missions.filter((m) => m.status === 'active' && m.bossFight).length;
  const investigationPath = incidents[0] ? `/incidents/${incidents[0].id}` : '/dashboard';

  const sections = [
    { key: 'main',  label: 'Operations' },
    { key: 'ops',   label: 'Team' },
    { key: 'intel', label: 'Intel' },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen sticky top-0 flex flex-col border-r border-border/50 bg-sidebar overflow-hidden"
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50 shrink-0">
        <motion.div
          className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 relative"
          whileHover={{ scale: 1.08 }}
          style={{ border: '1px solid hsl(155 100% 50% / 0.25)', boxShadow: '0 0 12px hsl(155 100% 50% / 0.2)' }}
        >
          <Activity className="h-5 w-5 text-primary" />
          {bossMissionCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
        </motion.div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <h1 className="text-sm font-black tracking-wide neon-text">ASE</h1>
              <p className="text-[10px] text-muted-foreground">Agentic SOC Engine</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Rank / XP mini strip ─────────────────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2.5 border-b border-border/30 shrink-0"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="rank-badge text-[9px]">{gameState.rank}</span>
              <StreakFlame streak={gameState.streak} size="sm" />
            </div>
            <div className="xp-bar-track h-1">
              <motion.div
                className="xp-bar-fill h-full"
                style={{ width: `${Math.min(100, (gameState.xp / gameState.xpToNextRank) * 100)}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground font-mono mt-0.5 text-right">
              {gameState.xp.toLocaleString()} XP
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto scrollbar-thin">
        {sections.map((section) => {
          const sectionItems = navItems.filter((n) => n.section === section.key);
          return (
            <div key={section.key}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1"
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {sectionItems.map((item) => {
                  const path = item.path === '/incidents' ? investigationPath : item.path;
                  const isActive = location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/'));
                  const isMission = item.path === '/missions';
                  const hasBoss = isMission && bossMissionCount > 0;

                  return (
                    <Link
                      key={item.path}
                      to={path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative group',
                        isActive
                          ? hasBoss
                            ? 'bg-destructive/10 text-red-400'
                            : 'bg-primary/10 text-primary glow-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      {/* Active bar */}
                      {isActive && (
                        <motion.div
                          layoutId="active-bar"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                          style={{ background: hasBoss ? 'hsl(0 84% 60%)' : 'hsl(155 100% 50%)' }}
                        />
                      )}

                      <item.icon className="h-4 w-4 shrink-0" />

                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-medium flex-1 truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Badge for missions */}
                      {!collapsed && isMission && activeMissionCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            'text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center',
                            hasBoss
                              ? 'bg-destructive/15 text-red-400 border border-destructive/30'
                              : 'bg-warning/15 text-yellow-400 border border-warning/30'
                          )}
                        >
                          {activeMissionCount}
                        </motion.span>
                      )}

                      {/* Notification badge for response */}
                      {!collapsed && item.path === '/response' && notifications > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 min-w-[18px] text-center"
                        >
                          {notifications}
                        </motion.span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Collapse toggle ──────────────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}
