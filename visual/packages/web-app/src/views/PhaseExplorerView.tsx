import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock, FileText, GitBranch, Bot } from 'lucide-react';
import type { AgentAttributionEvent, ProjectSnapshot } from '@sdd/contracts';
import { MarkdownViewer } from '../components/MarkdownViewer';

type SpecTab = 'requirements' | 'design' | 'tasks' | 'traceability' | 'evidence';

interface PhaseExplorerViewProps {
  snapshot: ProjectSnapshot;
  selectedPhaseId: string | null;
  onSelectPhase: (id: string) => void;
}

export function PhaseExplorerView({ snapshot, selectedPhaseId, onSelectPhase }: PhaseExplorerViewProps) {
  const [tab, setTab] = useState<SpecTab>('tasks');

  const phase = useMemo(
    () =>
      snapshot.phases.find((p) => p.id === selectedPhaseId) ||
      snapshot.phases.find((p) => p.id === snapshot.activePhaseId) ||
      snapshot.phases[0],
    [snapshot, selectedPhaseId],
  );

  const phaseStartEvent = useMemo(
    () => (snapshot.telemetry?.phaseStarts || []).find((e) => e.phase === phase?.id),
    [snapshot, phase],
  );

  const taskAttributionMap = useMemo(() => {
    const map = new Map<string, AgentAttributionEvent>();
    for (const ev of snapshot.telemetry?.taskEvents || []) {
      if (ev.phase === phase?.id && ev.task) {
        map.set(ev.task, ev);
      }
    }
    return map;
  }, [snapshot, phase]);

  if (!phase) {
    return (
      <div className="p-8 sdd-surface text-center">
        <p className="text-[14px]" style={{ color: 'var(--ink-2)' }}>
          No phases found in <code className="font-mono-sdd">.sdd/specs/</code>.
        </p>
      </div>
    );
  }

  const lifecycleSteps = [
    { key: 'requirements', label: '01 Requirements', status: phase.artifacts.requirements?.status || 'MISSING' },
    { key: 'design', label: '02 Design', status: phase.artifacts.design?.status || 'MISSING' },
    { key: 'tasks', label: '03 Tasks', status: phase.artifacts.tasks?.status || 'MISSING' },
    { key: 'impl', label: '04 Execution', status: `${phase.taskCounts.completed}/${phase.taskCounts.total} DONE` },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
      {/* Left Rail: Phase List */}
      <aside className="lg:col-span-3 flex flex-col gap-2">
        <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--ink-3)' }}>
          02 — Phases ({snapshot.phases.length})
        </div>
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
          {snapshot.phases.map((p) => {
            const active = p.id === phase.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPhase(p.id)}
                className="text-left px-3 py-2.5 shrink-0 lg:shrink cursor-pointer transition-colors"
                style={{
                  border: active ? '1px solid var(--accent)' : '1px solid var(--rule)',
                  backgroundColor: active ? 'var(--accent-soft)' : 'var(--paper-raised)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-sdd text-[11px] uppercase" style={{ color: 'var(--ink-3)' }}>
                    {p.category}
                  </span>
                  <span className="font-mono-sdd text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                    {p.taskCounts.percent}%
                  </span>
                </div>
                <div className="text-[13px] font-medium mt-0.5 truncate max-w-[220px] lg:max-w-none">{p.name}</div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content: Lifecycle Rail + Spec Tabs */}
      <div className="lg:col-span-9 flex flex-col gap-6 min-w-0">
        {/* Phase Header */}
        <div className="pb-4 sdd-rule-b">
          <div className="flex flex-wrap items-center gap-2 mb-2 font-mono-sdd text-[11px]">
            <span className="px-2 py-0.5 uppercase sdd-rule-all">{phase.category}</span>
            <span>{phase.id}</span>
            {phase.liveSource && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5" style={{ backgroundColor: 'var(--ok-soft)', color: 'var(--ok)' }}>
                <GitBranch className="w-3 h-3" /> Worktree: {phase.liveSource.branch}
              </span>
            )}
            {phaseStartEvent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Bot className="w-3 h-3" /> Started by {phaseStartEvent.agent} ({phaseStartEvent.model})
              </span>
            )}
          </div>
          <h1 className="font-semibold tracking-tight" style={{ fontSize: 'var(--t-h2)' }}>
            {phase.name}
          </h1>
        </div>

        {/* Sequential Approval Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 sdd-surface">
          {lifecycleSteps.map((step, idx) => (
            <div
              key={step.key}
              className="px-4 py-3"
              style={{ borderRight: idx < lifecycleSteps.length - 1 ? '1px solid var(--rule)' : undefined }}
            >
              <div className="font-mono-sdd text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                {step.label}
              </div>
              <div className="font-mono-sdd text-[12px] font-semibold mt-1 truncate">
                {step.status}
              </div>
            </div>
          ))}
        </div>

        {/* Spec Document Tabs */}
        <div className="flex flex-wrap items-center gap-1 sdd-rule-b pb-3">
          {(['tasks', 'requirements', 'design', 'traceability', 'evidence'] as SpecTab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="px-3 py-1.5 text-[12px] font-mono-sdd uppercase cursor-pointer"
                style={{
                  border: '1px solid var(--ink)',
                  backgroundColor: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--paper)' : 'var(--ink)',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        {tab === 'tasks' && (
          <div className="flex flex-col gap-2">
            {phase.tasks.map((task) => {
              const attr = taskAttributionMap.get(task.id);
              return (
                <div
                  key={task.id}
                  className="p-4 sdd-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--ok)' }} />
                    ) : task.status === 'doing' ? (
                      <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--warn)' }} />
                    ) : (
                      <Circle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--ink-3)' }} />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-sdd text-[12px] font-semibold">{task.id}</span>
                        <span className="text-[14px] font-medium">{task.title}</span>
                      </div>
                      {task.reqRefs && task.reqRefs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {task.reqRefs.map((req) => (
                            <span key={req} className="font-mono-sdd text-[10px] px-1.5 py-0.5 sdd-rule-all" style={{ color: 'var(--ink-2)' }}>
                              {req}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono-sdd text-[11px]">
                    {attr && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5"
                        style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
                        title={`Harness: ${attr.harness} · Provider: ${attr.provider} · Rev: ${attr.rev}`}
                      >
                        <Bot className="w-3 h-3" /> {attr.agent} · {attr.model}
                      </span>
                    )}
                    <span className="uppercase px-2 py-0.5 sdd-rule-all" style={{ color: 'var(--ink-2)' }}>
                      {task.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {phase.tasks.length === 0 && (
              <div className="p-6 sdd-surface text-[13px]" style={{ color: 'var(--ink-3)' }}>
                No top-level tasks recorded in tasks.md yet.
              </div>
            )}
          </div>
        )}

        {tab === 'requirements' && (
          <div className="p-6 sdd-surface overflow-x-auto">
            {phase.artifacts.requirements?.content ? (
              <MarkdownViewer content={phase.artifacts.requirements.content} />
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>requirements.md not found.</p>
            )}
          </div>
        )}

        {tab === 'design' && (
          <div className="p-6 sdd-surface overflow-x-auto">
            {phase.artifacts.design?.content ? (
              <MarkdownViewer content={phase.artifacts.design.content} />
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>design.md not created yet (approve requirements first).</p>
            )}
          </div>
        )}

        {tab === 'traceability' && (
          <div className="sdd-surface overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                  <th className="px-4 py-2.5 font-mono-sdd text-[11px] uppercase">Requirement</th>
                  <th className="px-4 py-2.5 font-mono-sdd text-[11px] uppercase">Title</th>
                  <th className="px-4 py-2.5 font-mono-sdd text-[11px] uppercase">Linked Tasks</th>
                </tr>
              </thead>
              <tbody>
                {phase.requirements.map((req) => {
                  const linked = phase.tasks.filter((t) => (t.reqRefs || []).includes(req.id));
                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td className="px-4 py-2.5 font-mono-sdd font-semibold">{req.id}</td>
                      <td className="px-4 py-2.5">{req.title}</td>
                      <td className="px-4 py-2.5 font-mono-sdd text-[12px]">
                        {linked.length ? linked.map((t) => `${t.id} (${t.status})`).join(', ') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'evidence' && (
          <div className="flex flex-col gap-4">
            {(phase.artifacts.evidence || []).map((ev) => (
              <div key={ev.id} className="p-5 sdd-surface">
                <div className="flex items-center gap-2 font-mono-sdd text-[12px] font-semibold mb-3">
                  <FileText className="w-4 h-4" />
                  <span>{ev.title || ev.filename}</span>
                </div>
                <MarkdownViewer content={ev.content} />
              </div>
            ))}
            {(!phase.artifacts.evidence || phase.artifacts.evidence.length === 0) && (
              <div className="p-6 sdd-surface text-[13px]" style={{ color: 'var(--ink-3)' }}>
                No verification evidence recorded under <code className="font-mono-sdd">.sdd/evidence/{phase.id}/</code> yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
