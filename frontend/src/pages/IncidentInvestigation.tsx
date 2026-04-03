import { useParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { Clock, FileText, Brain, Shield } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { GlassCard, SeverityBadge, StatusDot } from '@/components/ui/stat-card';
import { mockIncidents, attackGraphNodes, attackGraphEdges } from '@/data/mockData';
import { cn } from '@/lib/utils';

function AttackGraph() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    // edges
    g.selectAll('line')
      .data(attackGraphEdges)
      .join('line')
      .attr('x1', (d) => attackGraphNodes.find((n) => n.id === d.source)!.x)
      .attr('y1', (d) => attackGraphNodes.find((n) => n.id === d.source)!.y)
      .attr('x2', (d) => attackGraphNodes.find((n) => n.id === d.target)!.x)
      .attr('y2', (d) => attackGraphNodes.find((n) => n.id === d.target)!.y)
      .attr('stroke', 'hsl(155 100% 50% / 0.3)')
      .attr('stroke-width', 2);

    // edge labels
    g.selectAll('.edge-label')
      .data(attackGraphEdges)
      .join('text')
      .attr('class', 'edge-label')
      .attr('x', (d) => {
        const s = attackGraphNodes.find((n) => n.id === d.source)!;
        const t = attackGraphNodes.find((n) => n.id === d.target)!;
        return (s.x + t.x) / 2;
      })
      .attr('y', (d) => {
        const s = attackGraphNodes.find((n) => n.id === d.source)!;
        const t = attackGraphNodes.find((n) => n.id === d.target)!;
        return (s.y + t.y) / 2 - 8;
      })
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '10px')
      .text((d) => d.label);

    // nodes
    const nodeColors: Record<string, string> = {
      ip: '#ff4d4f',
      system: '#00ff9f',
      user: '#facc15',
    };

    g.selectAll('circle')
      .data(attackGraphNodes)
      .join('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 20)
      .attr('fill', (d) => `${nodeColors[d.type]}20`)
      .attr('stroke', (d) => nodeColors[d.type])
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // node labels
    g.selectAll('.node-label')
      .data(attackGraphNodes)
      .join('text')
      .attr('class', 'node-label')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e5e7eb')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text((d) => d.label);
  }, []);

  return (
    <svg ref={svgRef} width="100%" height="350" className="rounded-xl bg-secondary/30" />
  );
}

export default function IncidentInvestigation() {
  const { id } = useParams();
  const incident = mockIncidents.find((i) => i.id === id) || mockIncidents[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{incident.id}</h1>
            <SeverityBadge severity={incident.severity} />
            <StatusDot status={incident.status} />
          </div>
          <p className="text-lg font-medium">{incident.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{incident.attackType} · Assigned to {incident.assignedAgent}</p>
        </div>

        {/* AI Summary */}
        <GlassCard>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            AI-Generated Summary
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{incident.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {incident.affectedSystems.map((sys) => (
              <span key={sys} className="px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-mono">{sys}</span>
            ))}
          </div>
        </GlassCard>

        {/* Attack Graph */}
        <GlassCard>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Attack Chain Visualization
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Interactive graph — scroll to zoom, drag to pan</p>
          <AttackGraph />
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full border-2 border-destructive bg-destructive/20" /> Attacker IP</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full border-2 border-primary bg-primary/20" /> System</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full border-2 border-warning bg-warning/20" /> User</span>
          </div>
        </GlassCard>

        {/* Timeline */}
        <GlassCard>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Event Timeline
          </h2>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border/50" />
            {incident.events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="absolute left-[-18px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                <div className="bg-secondary/50 rounded-xl p-3 border border-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary">{event.type}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">Source: {event.source}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Evidence */}
        <GlassCard>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Evidence & Logs
          </h2>
          <div className="bg-secondary/50 rounded-xl p-4 font-mono text-xs space-y-1 text-muted-foreground max-h-48 overflow-auto scrollbar-thin">
            <p><span className="text-destructive">[CRITICAL]</span> Failed login attempt from 185.220.101.34 - user: admin</p>
            <p><span className="text-destructive">[CRITICAL]</span> Successful VPN auth - user: svc_backup - src: 185.220.101.34</p>
            <p><span className="text-warning">[WARNING]</span> AD enumeration query: (objectClass=computer) from DC-01</p>
            <p><span className="text-warning">[WARNING]</span> RDP session established: svc_backup → WEB-03</p>
            <p><span className="text-destructive">[CRITICAL]</span> Process created: mimikatz.exe on WEB-03</p>
            <p><span className="text-warning">[WARNING]</span> SMB lateral movement: WEB-03 → DB-02</p>
            <p><span className="text-primary">[INFO]</span> Alert correlated with MITRE ATT&CK: T1021, T1078, T1003</p>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
