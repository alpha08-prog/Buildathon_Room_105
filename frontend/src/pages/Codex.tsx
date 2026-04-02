import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Search, BookOpen, Tag, Calendar, ChevronRight,
  Lock, Zap, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/stat-card';
import { AchievementTrophy } from '@/components/3d/AchievementTrophy';
import { useStore } from '@/store/useStore';
import { mockMemoryEntries } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/data/mockData';

// ── Rarity config ────────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  common:    { color: 'hsl(220 10% 60%)',  glow: 'none',                                   stars: 1 },
  rare:      { color: 'hsl(217 91% 60%)',  glow: '0 0 12px hsl(217 91% 60% / 0.25)',       stars: 2 },
  epic:      { color: 'hsl(271 91% 65%)',  glow: '0 0 18px hsl(271 91% 65% / 0.3)',        stars: 3 },
  legendary: { color: 'hsl(45 100% 55%)',  glow: '0 0 28px hsl(45 100% 55% / 0.35)',       stars: 4 },
};

import {
  Trophy as TrophyIcon, Zap as ZapIcon, Flame, ShieldOff, Ghost, BookOpen as BookOpenIcon,
  Search as SearchIcon, Sword,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy: TrophyIcon, Zap: ZapIcon, Flame, ShieldOff, Ghost, BookOpen: BookOpenIcon,
  Search: SearchIcon, Sword,
};

// ── Achievement Trophy Card ──────────────────────────────────────────────────
function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  const cfg = RARITY_CONFIG[achievement.rarity];
  const Icon = ICON_MAP[achievement.icon] ?? TrophyIcon;
  const unlocked = !!achievement.unlockedAt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 250 }}
      className={cn(
        'glass-card p-4 flex flex-col items-center gap-3 text-center relative overflow-hidden transition-all duration-300',
        `rarity-${achievement.rarity}`,
        !unlocked && 'opacity-50 grayscale'
      )}
      style={{ boxShadow: unlocked ? cfg.glow : 'none' }}
    >
      <AchievementTrophy
        rarity={achievement.rarity}
        showUnlock={unlocked && achievement.rarity === 'legendary'}
        size={76}
        className="shrink-0"
      />

      {/* Shine for legendary */}
      {unlocked && achievement.rarity === 'legendary' && (
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />
      )}

      {/* Icon */}
      <motion.div
        className="w-12 h-12 rounded-xl flex items-center justify-center relative"
        style={{
          background: unlocked ? `${cfg.color}15` : 'hsl(220 20% 14%)',
          border: `1.5px solid ${unlocked ? cfg.color + '50' : 'hsl(220 20% 25%)'}`,
        }}
        animate={unlocked ? { rotateY: [0, 360] } : {}}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
      >
        {unlocked
          ? <Icon className="w-6 h-6" style={{ color: cfg.color }} />
          : <Lock className="w-5 h-5 text-muted-foreground" />
        }
      </motion.div>

      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Star
            key={i}
            className="w-3 h-3"
            style={{
              color: i < cfg.stars && unlocked ? cfg.color : 'hsl(220 20% 25%)',
              fill: i < cfg.stars && unlocked ? cfg.color : 'transparent',
            }}
          />
        ))}
      </div>

      {/* Info */}
      <div>
        <p className={cn('text-xs font-black', unlocked ? 'text-foreground' : 'text-muted-foreground')}>{achievement.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{achievement.description}</p>
      </div>

      {/* Rarity + XP */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
          style={{
            background: `${cfg.color}10`,
            border: `1px solid ${cfg.color}35`,
            color: cfg.color,
          }}
        >
          {achievement.rarity}
        </span>
        {unlocked && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: 'hsl(48 96% 60%)' }}>
            <Zap className="w-3 h-3" />+{achievement.xpReward}
          </span>
        )}
      </div>

      {/* Unlock date */}
      {unlocked && achievement.unlockedAt && (
        <p className="text-[9px] text-muted-foreground font-mono">
          {new Date(achievement.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}

// ── Campaign History Entry ────────────────────────────────────────────────────
function CampaignEntry({ entry, index }: { entry: (typeof mockMemoryEntries)[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-card p-4 cursor-pointer transition-all duration-200 hover:border-primary/30"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{entry.incidentTitle}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />{entry.date}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/60 border border-border/30 text-muted-foreground">
                {entry.attackType}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Similarity bar */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] text-muted-foreground">Similarity</span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, hsl(155 100% 40%), hsl(155 100% 60%))' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${entry.similarity * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.06 }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-primary">{Math.round(entry.similarity * 100)}%</span>
            </div>
          </div>
          <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Resolution</p>
                <p className="text-xs text-foreground leading-relaxed">{entry.resolution}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-primary/8 border border-primary/20 text-primary">
                    <Tag className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Codex() {
  const { achievements, gameState } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'trophies' | 'campaigns'>('trophies');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;
  const totalXpFromAch = achievements.filter((a) => a.unlockedAt).reduce((s, a) => s + a.xpReward, 0);

  const filteredAchievements = achievements.filter((a) => {
    const matchSearch = searchQuery === '' || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRarity = rarityFilter === 'all' || a.rarity === rarityFilter;
    return matchSearch && matchRarity;
  });

  const filteredCampaigns = mockMemoryEntries.filter((e) =>
    searchQuery === '' ||
    e.incidentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.tags.some((t) => t.includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest">
              <span className="text-primary drop-shadow-[0_0_8px_rgba(0,255,128,0.5)]">Codex</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Unlocked tactics, achievements, and campaign history</p>
          </div>

          <div className="flex gap-3">
            <div className="hud-panel">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Unlocked</p>
                <p className="text-sm font-black text-yellow-400">{unlockedCount}/{achievements.length}</p>
              </div>
            </div>
            <div className="hud-panel">
              <Zap className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">From Achievements</p>
                <p className="text-sm font-black text-yellow-400">{totalXpFromAch.toLocaleString()} XP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search codex…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex gap-1 bg-secondary/40 rounded-xl p-1 border border-border/30">
            {(['trophies', 'campaigns'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn('px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                  tab === t
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'trophies' ? 'Trophies' : 'Campaigns'}
              </button>
            ))}
          </div>

          {tab === 'trophies' && (
            <div className="flex gap-1 flex-wrap">
              {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all',
                    rarityFilter === r
                      ? r === 'legendary' ? 'bg-yellow-400/15 text-yellow-400 border-yellow-400/35'
                        : r === 'epic'   ? 'bg-purple-400/15 text-purple-400 border-purple-400/35'
                        : r === 'rare'   ? 'bg-blue-400/15 text-blue-400 border-blue-400/35'
                        : 'bg-primary/15 text-primary border-primary/30'
                      : 'text-muted-foreground border-border/30 hover:text-foreground'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'trophies' ? (
            <motion.div key="trophies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredAchievements.map((ach, i) => (
                  <AchievementCard key={ach.id} achievement={ach} index={i} />
                ))}
              </div>
              {filteredAchievements.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">No achievements match your search.</div>
              )}
            </motion.div>
          ) : (
            <motion.div key="campaigns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {filteredCampaigns.map((e, i) => <CampaignEntry key={e.id} entry={e} index={i} />)}
              {filteredCampaigns.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">No campaigns match your search.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
