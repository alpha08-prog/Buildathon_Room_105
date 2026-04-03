import { motion } from 'framer-motion';
import { Brain, Search, Tag } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard } from '@/components/ui/stat-card';
import { mockMemoryEntries } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function Memory() {
  const [search, setSearch] = useState('');
  const filtered = mockMemoryEntries.filter(
    (m) => m.incidentTitle.toLowerCase().includes(search.toLowerCase()) ||
           m.attackType.toLowerCase().includes(search.toLowerCase()) ||
           m.tags.some((t) => t.includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Memory & Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Past incidents and vector similarity search</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past incidents, attack types, tags..."
            className="h-10 w-full rounded-xl bg-secondary border border-border/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{entry.incidentTitle}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.attackType} · {entry.date}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        <span className="font-medium text-foreground">Resolution:</span> {entry.resolution}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-[10px] text-muted-foreground border border-border/30">
                            <Tag className="h-2.5 w-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Similarity</p>
                    <p className={cn(
                      'text-lg font-bold',
                      entry.similarity >= 0.9 ? 'text-primary' :
                      entry.similarity >= 0.8 ? 'text-warning' : 'text-muted-foreground'
                    )}>
                      {Math.round(entry.similarity * 100)}%
                    </p>
                    <div className="w-16 h-1.5 rounded-full bg-secondary mt-1">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${entry.similarity * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
