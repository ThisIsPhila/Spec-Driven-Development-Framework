import React from 'react';
import { Shield, Terminal } from 'lucide-react';
import type { ProjectSnapshot } from '@sdd/contracts';
import { MarkdownViewer } from '../components/MarkdownViewer';

export function GovernanceView({ snapshot }: { snapshot: ProjectSnapshot }) {
  const constitution = snapshot.framework?.constitution?.content || '';
  const hooks = snapshot.hooks?.configured || [];
  const runs = snapshot.hooks?.runs || [];
  const diagnostics = snapshot.diagnostics || [];

  return (
    <div className="flex flex-col gap-8 pt-6">
      <div className="pb-4 sdd-rule-b">
        <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--ink-3)' }}>
          04 — Constitution, Hooks &amp; Diagnostics
        </div>
        <h1 className="font-semibold tracking-tight" style={{ fontSize: 'var(--t-h2)' }}>
          Governance &amp; Verification
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-5 sdd-surface">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold">Configured Git Hooks</h2>
              <Terminal className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="flex flex-col gap-2">
              {hooks.map((h) => (
                <div key={h.name} className="px-3 py-2 sdd-rule-all flex items-center justify-between font-mono-sdd text-[12px]">
                  <span>{h.name}</span>
                  <span style={{ color: h.exists ? 'var(--ok)' : 'var(--ink-3)' }}>
                    {h.exists ? 'INSTALLED' : 'NOT INSTALLED'}
                  </span>
                </div>
              ))}
              {hooks.length === 0 && (
                <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>No hook configuration extracted.</p>
              )}
            </div>
            <div className="mt-3 font-mono-sdd text-[11px]" style={{ color: 'var(--ink-3)' }}>
              Observed gate runs: {runs.length}
            </div>
          </div>

          <div className="p-5 sdd-surface">
            <h2 className="text-[15px] font-semibold mb-3">Extractor Diagnostics ({diagnostics.length})</h2>
            <div className="flex flex-col gap-2">
              {diagnostics.map((d, idx) => (
                <div key={idx} className="p-2.5 sdd-rule-all text-[12px] font-mono-sdd" style={{ backgroundColor: 'var(--paper)' }}>
                  <span className="uppercase mr-2" style={{ color: 'var(--accent)' }}>[{d.type}]</span>
                  <span>{d.message}</span>
                </div>
              ))}
              {diagnostics.length === 0 && (
                <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>No diagnostics reported.</p>
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-7 p-6 sdd-surface overflow-x-auto">
          <div className="flex items-center gap-2 mb-4 pb-3 sdd-rule-b">
            <Shield className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-[15px] font-semibold">Project Constitution (.sdd/constitution.md)</h2>
          </div>
          {constitution ? (
            <MarkdownViewer content={constitution} />
          ) : (
            <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>Constitution document not present.</p>
          )}
        </section>
      </div>
    </div>
  );
}
