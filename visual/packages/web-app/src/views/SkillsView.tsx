import React, { useState } from 'react';
import { Cloud, HardDrive, Package } from 'lucide-react';
import type { ProjectSnapshot, ProjectSummary } from '@sdd/contracts';
import { MarkdownViewer } from '../components/MarkdownViewer';

interface SkillsViewProps {
  snapshot: ProjectSnapshot;
  projects: ProjectSummary[];
  activeProjectId: string | null;
  onSelectProject: (p: ProjectSummary) => void;
}

export function SkillsView({ snapshot, projects, activeProjectId, onSelectProject }: SkillsViewProps) {
  const skills = snapshot.skills || [];
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(skills[0]?.id || null);
  const activeSkill = skills.find((s) => s.id === selectedSkillId) || skills[0] || null;

  return (
    <div className="flex flex-col gap-10 pt-6">
      <div className="pb-4 sdd-rule-b">
        <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--ink-3)' }}>
          05 — Skills &amp; Connected Projects
        </div>
        <h1 className="font-semibold tracking-tight" style={{ fontSize: 'var(--t-h2)' }}>
          Workspace Directory &amp; Installed Skills
        </h1>
      </div>

      {/* Connected Projects */}
      <section>
        <h2 className="text-[15px] font-semibold mb-3">Connected Projects (Local &amp; Cloud)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const active = p.id === activeProjectId;
            return (
              <button
                key={`${p.source}:${p.id}`}
                type="button"
                onClick={() => onSelectProject(p)}
                className="text-left p-4 sdd-surface cursor-pointer flex flex-col gap-2"
                style={{ borderColor: active ? 'var(--accent)' : 'var(--rule)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[14px] truncate">{p.name}</span>
                  <span className="font-mono-sdd text-[10px] uppercase px-1.5 py-0.5 sdd-rule-all inline-flex items-center gap-1">
                    {p.source === 'cloud' ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                    {p.source}
                  </span>
                </div>
                <div className="font-mono-sdd text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  Active: {p.activePhaseId || 'None'} · {p.overallProgressPct}% complete
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Installed Skills */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-2">
          <div className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
            Installed Skills ({skills.length})
          </div>
          {skills.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSkillId(s.id)}
              className="text-left p-3.5 sdd-surface cursor-pointer"
              style={{ borderColor: s.id === activeSkill?.id ? 'var(--accent)' : 'var(--rule)' }}
            >
              <div className="flex items-center gap-2 font-mono-sdd text-[13px] font-semibold">
                <Package className="w-3.5 h-3.5" />
                <span>{s.name}</span>
              </div>
              <p className="text-[12px] mt-1 line-clamp-2" style={{ color: 'var(--ink-2)' }}>
                {s.description}
              </p>
            </button>
          ))}
          {skills.length === 0 && (
            <div className="p-4 sdd-surface text-[13px]" style={{ color: 'var(--ink-3)' }}>
              No installed skills found in <code className="font-mono-sdd">skills/</code>.
            </div>
          )}
        </div>

        <div className="lg:col-span-8 p-6 sdd-surface overflow-x-auto">
          {activeSkill?.content ? (
            <MarkdownViewer content={activeSkill.content} />
          ) : (
            <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>Select a skill to inspect its SKILL.md.</p>
          )}
        </div>
      </section>
    </div>
  );
}
