import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Bot, Cpu, DollarSign, Terminal } from 'lucide-react';
import type { ProjectSnapshot } from '@sdd/contracts';
import { KpiStrip } from '../components/KpiStrip';
import { DataTableToggle } from '../components/DataTableToggle';

export function TelemetryView({ snapshot }: { snapshot: ProjectSnapshot }) {
  const telemetry = snapshot.telemetry;
  const rollups = telemetry?.rollups || {
    totalUsd: 0,
    totalTokens: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
    byModel: [],
    byHarness: [],
  };

  const totalTokens =
    rollups.totalTokens.input +
    rollups.totalTokens.output +
    rollups.totalTokens.cache_read +
    rollups.totalTokens.cache_write;

  const attribution = telemetry?.attribution || [];
  const onboarding = telemetry?.onboarding || [];
  const phaseStarts = telemetry?.phaseStarts || [];
  const taskEvents = telemetry?.taskEvents || [];

  const kpis = [
    {
      label: '01 · Total API Cost',
      value: `$${rollups.totalUsd.toFixed(4)}`,
      detail: telemetry?.ratesAsOf ? `Rates as of ${telemetry.ratesAsOf}` : 'Priced from .sdd/metrics/rates.json',
      tone: 'accent' as const,
    },
    {
      label: '02 · Total Tokens',
      value: totalTokens > 1_000_000 ? `${(totalTokens / 1e6).toFixed(2)}M` : totalTokens.toLocaleString(),
      detail: `In ${rollups.totalTokens.input.toLocaleString()} · Out ${rollups.totalTokens.output.toLocaleString()} · Cache ${(rollups.totalTokens.cache_read + rollups.totalTokens.cache_write).toLocaleString()}`,
    },
    {
      label: '03 · Active Models',
      value: rollups.byModel.length || new Set(attribution.map((a) => a.model).filter((m) => m && m !== 'unknown')).size,
      detail: `${rollups.byHarness.length} harness adapter(s) with recorded usage`,
    },
    {
      label: '04 · Attribution Events',
      value: attribution.length,
      detail: `${onboarding.length} onboard · ${phaseStarts.length} phase starts · ${taskEvents.length} task transitions`,
      tone: 'ok' as const,
    },
  ];

  const chartData = rollups.byModel.map((m) => ({
    name: m.model,
    usd: Number(m.usd.toFixed(4)),
    tokens: m.tokens_in + m.tokens_out + m.tokens_cache_read + m.tokens_cache_write,
    provenance: m.provenance,
  }));

  return (
    <div className="flex flex-col gap-10 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 sdd-rule-b">
        <div>
          <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--ink-3)' }}>
            03 — Agent Attribution, Tokens &amp; API Cost
          </div>
          <h1 className="font-semibold tracking-tight" style={{ fontSize: 'var(--t-h2)' }}>
            Agent &amp; Cost Telemetry
          </h1>
        </div>
        <div className="font-mono-sdd text-[11px] px-3 py-1.5 sdd-surface">
          CLI: <code>bash .sdd/scripts/phase.sh usage &amp;&amp; bash .sdd/scripts/phase.sh report --write</code>
        </div>
      </div>

      <KpiStrip items={kpis} />

      {/* Cost & Token Breakdown by Model */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-5 sdd-surface">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                FIG. 02 · Spend by Model (USD)
              </div>
              <h2 className="text-[16px] font-semibold">API Cost Rollup</h2>
            </div>
            <DollarSign className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>

          {chartData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-2)' }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink-2)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--paper-raised)',
                      border: '1px solid var(--rule)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="usd" fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
              No usage rows recorded yet. Run <code className="font-mono-sdd">bash .sdd/scripts/phase.sh usage</code> followed by{' '}
              <code className="font-mono-sdd">bash .sdd/scripts/phase.sh report --write</code> to collect multi-harness token usage.
            </div>
          )}

          <DataTableToggle
            caption="Model token and USD cost breakdown"
            headers={['Model', 'Provider', 'Calls', 'Input', 'Output', 'Cache Read', 'Cache Write', 'USD', 'Provenance']}
            rows={rollups.byModel.map((m) => [
              m.model,
              m.provider,
              m.calls,
              m.tokens_in.toLocaleString(),
              m.tokens_out.toLocaleString(),
              m.tokens_cache_read.toLocaleString(),
              m.tokens_cache_write.toLocaleString(),
              `$${m.usd.toFixed(4)}`,
              m.provenance,
            ])}
          />
        </div>

        {/* Harness Summary */}
        <div className="lg:col-span-5 p-5 sdd-surface flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                Multi-Harness Adapters
              </div>
              <h2 className="text-[16px] font-semibold">Breakdown by Harness</h2>
            </div>
            <Cpu className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>

          {rollups.byHarness.length > 0 ? (
            <div className="flex flex-col gap-2">
              {rollups.byHarness.map((h) => (
                <div key={h.harness} className="p-3 sdd-rule-all flex items-center justify-between gap-2" style={{ backgroundColor: 'var(--paper)' }}>
                  <div>
                    <div className="font-mono-sdd text-[13px] font-semibold uppercase">{h.harness}</div>
                    <div className="font-mono-sdd text-[11px]" style={{ color: 'var(--ink-3)' }}>
                      {h.calls} calls · {h.tokens_total.toLocaleString()} tokens
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-sdd text-[14px] font-semibold">${h.usd.toFixed(4)}</div>
                    <span
                      className="font-mono-sdd text-[10px] uppercase px-1.5 py-0.5"
                      style={{
                        backgroundColor: h.provenance === 'measured' ? 'var(--ok-soft)' : 'var(--warn-soft)',
                        color: h.provenance === 'measured' ? 'var(--ok)' : 'var(--warn)',
                      }}
                    >
                      {h.provenance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[13px]" style={{ color: 'var(--ink-3)' }}>
              Supported adapters: <strong>Kiro</strong>, <strong>Claude Code</strong>, <strong>Codex</strong>, <strong>Gemini / Antigravity</strong>, and <strong>OpenCode</strong>.
            </div>
          )}
        </div>
      </section>

      {/* Onboarding, Phase Start & Task Attribution Ledger */}
      <section className="p-5 sdd-surface">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              .sdd/metrics/events.jsonl
            </div>
            <h2 className="text-[16px] font-semibold">
              Onboarding, Phase-Start &amp; Task Attribution Log
            </h2>
          </div>
          <Bot className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px] font-mono-sdd">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                <th className="px-3 py-2 uppercase">Timestamp</th>
                <th className="px-3 py-2 uppercase">Event</th>
                <th className="px-3 py-2 uppercase">Phase / Task</th>
                <th className="px-3 py-2 uppercase">Agent</th>
                <th className="px-3 py-2 uppercase">Harness</th>
                <th className="px-3 py-2 uppercase">Model</th>
                <th className="px-3 py-2 uppercase">Rev</th>
              </tr>
            </thead>
            <tbody>
              {[...attribution].reverse().slice(0, 50).map((ev, idx) => (
                <tr key={`${ev.ts}-${idx}`} style={{ borderBottom: '1px solid var(--rule)' }}>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--ink-3)' }}>
                    {new Date(ev.ts).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="px-1.5 py-0.5 uppercase text-[10px]"
                      style={{
                        backgroundColor:
                          ev.event === 'onboard'
                            ? 'var(--accent-soft)'
                            : ev.event === 'phase_start'
                              ? 'var(--ok-soft)'
                              : 'var(--paper)',
                        color:
                          ev.event === 'onboard'
                            ? 'var(--accent)'
                            : ev.event === 'phase_start'
                              ? 'var(--ok)'
                              : 'var(--ink)',
                        border: '1px solid var(--rule)',
                      }}
                    >
                      {ev.event}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {ev.phase || '—'} {ev.task ? `/ ${ev.task}` : ''}
                  </td>
                  <td className="px-3 py-2 font-semibold">{ev.agent}</td>
                  <td className="px-3 py-2">{ev.harness}</td>
                  <td className="px-3 py-2">{ev.model}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--ink-3)' }}>{ev.rev || '—'}</td>
                </tr>
              ))}
              {attribution.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center" style={{ color: 'var(--ink-3)' }}>
                    <Terminal className="w-4 h-4 inline mr-1.5" />
                    No attribution events yet. Run <code>bash .sdd/scripts/phase.sh onboard --agent antigravity --model gemini-4-neon-medium</code>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
