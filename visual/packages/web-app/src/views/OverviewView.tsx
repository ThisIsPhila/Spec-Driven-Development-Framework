import React, { useMemo, useState } from 'react';
import { ArrowRight, GitBranch, Sparkles } from 'lucide-react';
import type { PhaseRecord, ProjectSnapshot } from '@sdd/contracts';
import { KpiStrip } from '../components/KpiStrip';
import { DataTableToggle } from '../components/DataTableToggle';
import type { NavSection } from '../components/Masthead';

type MatrixFilter = 'all' | 'done' | 'doing' | 'todo';

interface OverviewViewProps {
  snapshot: ProjectSnapshot;
  onOpenPhase: (phaseId: string) => void;
  onNavigate: (sec: NavSection) => void;
}

export function OverviewView({ snapshot, onOpenPhase, onNavigate }: OverviewViewProps) {
  const [filter, setFilter] = useState<MatrixFilter>('all');
  const [hovered, setHovered] = useState<{ phase: string; id: string; title: string; status: string } | null>(null);

  const activePhase: PhaseRecord | undefined = useMemo(
    () => snapshot.phases.find((p) => p.id === snapshot.activePhaseId) || snapshot.phases[0],
    [snapshot],
  );

  const allTasks = useMemo(() => {
    const out: Array<{ phase: string; id: string; title: string; status: 'done' | 'doing' | 'todo' }> = [];
    for (const p of snapshot.phases) {
      for (const t of p.tasks || []) {
        out.push({ phase: p.id, id: t.id, title: t.title, status: t.status });
      }
    }
    return out;
  }, [snapshot]);

  const filteredTasks = useMemo(
    () => (filter === 'all' ? allTasks : allTasks.filter((t) => t.status === filter)),
    [allTasks, filter],
  );

  const rollups = snapshot.telemetry?.rollups;
  const totalTokens =
    (rollups?.totalTokens.input || 0) +
    (rollups?.totalTokens.output || 0) +
    (rollups?.totalTokens.cache_read || 0) +
    (rollups?.totalTokens.cache_write || 0);

  const latestOnboard = snapshot.telemetry?.onboarding?.[snapshot.telemetry.onboarding.length - 1];
  const latestStart = snapshot.telemetry?.phaseStarts?.[snapshot.telemetry.phaseStarts.length - 1];

  const kpis = [
    {
      label: '01 · Overall Completion',
      value: `${snapshot.metrics.overallProgressPct}%`,
      detail: `${snapshot.metrics.completedTasks} of ${snapshot.metrics.totalTasks} tasks complete across ${snapshot.phases.length} phases`,
      tone: 'accent' as const,
    },
    {
      label: '02 · Active Sprint',
      value: activePhase ? `${activePhase.taskCounts.percent}%` : '—',
      detail: activePhase ? `${activePhase.id} (${activePhase.taskCounts.completed}/${activePhase.taskCounts.total})` : 'No active phase registered',
      delta: activePhase?.liveSource ? `Worktree: ${activePhase.liveSource.branch}` : undefined,
    },
    {
      label: '03 · Recorded API Spend',
      value: `$${(rollups?.totalUsd || 0).toFixed(3)}`,
      detail: totalTokens > 0 ? `${totalTokens.toLocaleString()} tokens across ${rollups?.byModel.length || 0} model(s)` : 'Run metrics.cjs usage & report to populate',
      tone: 'default' as const,
    },
    {
      label: '04 · Traceability Coverage',
      value: `${snapshot.metrics.traceabilityCoveragePct}%`,
      detail: `${snapshot.metrics.totalRequirements} requirements · ${snapshot.metrics.orphanTaskCount} orphan tasks`,
      tone: snapshot.metrics.traceabilityCoveragePct >= 80 ? ('ok' as const) : ('warn' as const),
    },
  ];

  const statusColor = (status: string) => {
    if (status === 'done') return 'var(--accent)';
    if (status === 'doing') return 'var(--warn)';
    return 'var(--neutral-data)';
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Editorial 2-Column Hero Spread */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        <div className="lg:col-span-6 flex flex-col justify-between gap-6 lg:pr-8 lg:border-r" style={{ borderColor: 'var(--rule)' }}>
          <div>
            <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-3" style={{ color: 'var(--ink-3)' }}>
              01 — Spec-Driven Development Overview · v{snapshot.framework?.version || '2.3.0'}
            </div>
            <h1
              className="font-semibold tracking-tight leading-[1.05] mb-4"
              style={{ fontSize: 'var(--t-display)' }}
            >
              {snapshot.projectName || snapshot.projectId || 'SDD Workspace'}
            </h1>
            <p className="text-[15px] max-w-xl" style={{ color: 'var(--ink-2)' }}>
              Canonical specifications, phase approvals, requirement-to-task traceability, and multi-agent token &amp; API cost telemetry extracted directly from <code className="font-mono-sdd">.sdd/</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activePhase && (
              <button
                type="button"
                onClick={() => onOpenPhase(activePhase.id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium cursor-pointer"
                style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
              >
                <span>Inspect Active Phase</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('telemetry')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium cursor-pointer"
              style={{ border: '1px solid var(--ink)', color: 'var(--ink)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Agent &amp; Cost Telemetry</span>
            </button>
          </div>

          {/* Git + Agent Attribution Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 sdd-rule-t text-[12px] font-mono-sdd">
            <div className="flex items-center gap-2" style={{ color: 'var(--ink-2)' }}>
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {snapshot.account?.branch || 'local'} @ {snapshot.account?.headCommit || 'HEAD'}
              </span>
            </div>
            <div className="truncate" style={{ color: 'var(--ink-2)' }}>
              {latestStart
                ? `Started by: ${latestStart.agent} (${latestStart.model})`
                : latestOnboard
                  ? `Onboarded: ${latestOnboard.agent} (${latestOnboard.model})`
                  : 'Agent attribution: run phase.sh onboard'}
            </div>
          </div>
        </div>

        {/* Right: Task Unit Matrix (KHÔRA-inspired, SDD-native) */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-[14px] font-semibold">
                Task execution matrix, one square per spec task
              </div>
              <div className="flex items-center">
                {(['all', 'done', 'doing', 'todo'] as MatrixFilter[]).map((key) => {
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className="px-2.5 py-1 text-[11px] font-mono-sdd uppercase cursor-pointer"
                      style={{
                        border: '1px solid var(--ink)',
                        marginLeft: key === 'all' ? 0 : -1,
                        backgroundColor: active ? 'var(--ink)' : 'transparent',
                        color: active ? 'var(--paper)' : 'var(--ink)',
                      }}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="p-4 sdd-surface min-h-[156px]"
              aria-label="Task execution unit matrix"
            >
              <div className="flex flex-wrap gap-1.5">
                {filteredTasks.map((t, idx) => (
                  <button
                    key={`${t.phase}-${t.id}-${idx}`}
                    type="button"
                    onMouseEnter={() => setHovered(t)}
                    onFocus={() => setHovered(t)}
                    onClick={() => onOpenPhase(t.phase)}
                    title={`${t.phase} · ${t.id}: ${t.title} (${t.status})`}
                    className="w-4 h-4 cursor-pointer transition-transform hover:scale-125 focus:scale-125"
                    style={{ backgroundColor: statusColor(t.status) }}
                  />
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-[13px]" style={{ color: 'var(--ink-3)' }}>
                    No tasks match filter “{filter}”.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 text-[12px] font-mono-sdd min-h-[36px]" style={{ color: 'var(--ink-2)' }}>
              {hovered ? (
                <span>
                  <strong>{hovered.id}</strong> ({hovered.status}) · {hovered.phase} — {hovered.title}
                </span>
              ) : (
                <span>
                  FIG. 01 · {allTasks.length} total tasks across {snapshot.phases.length} phases. Hover or click any cell to inspect its phase.
                </span>
              )}
            </div>

            <DataTableToggle
              caption="Phase task execution summary"
              headers={['Phase', 'Scope', 'Done', 'Doing', 'Todo', 'Progress']}
              rows={snapshot.phases.map((p) => [
                p.id,
                p.category,
                p.taskCounts.completed,
                p.taskCounts.inProgress,
                p.taskCounts.todo,
                `${p.taskCounts.percent}%`,
              ])}
            />
          </div>
        </div>
      </section>

      {/* Giant 4-Column KPI Strip */}
      <KpiStrip items={kpis} />

      {/* Phase Directory Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              Phases Ledger
            </div>
            <h2 className="font-semibold tracking-tight" style={{ fontSize: 'var(--t-h2)' }}>
              Active &amp; Archived Phases
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshot.phases.map((phase) => (
            <button
              key={phase.id}
              type="button"
              onClick={() => onOpenPhase(phase.id)}
              className="text-left p-5 sdd-surface flex flex-col justify-between gap-4 cursor-pointer transition-colors hover:border-[var(--accent)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono-sdd text-[11px] uppercase px-1.5 py-0.5 sdd-rule-all" style={{ color: 'var(--ink-2)' }}>
                    {phase.category}
                  </span>
                  <span className="font-mono-sdd text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                    {phase.taskCounts.percent}%
                  </span>
                </div>
                <div className="text-[15px] font-semibold leading-snug mb-1">{phase.name}</div>
                <div className="font-mono-sdd text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  {phase.id}
                </div>
              </div>

              <div>
                <div className="w-full h-1.5 mb-2" style={{ backgroundColor: 'var(--neutral-data)' }}>
                  <div
                    className="h-full"
                    style={{ width: `${phase.taskCounts.percent}%`, backgroundColor: 'var(--accent)' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono-sdd" style={{ color: 'var(--ink-2)' }}>
                  <span>{phase.taskCounts.completed}/{phase.taskCounts.total} tasks</span>
                  <span>{phase.requirements.length} REQs</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
