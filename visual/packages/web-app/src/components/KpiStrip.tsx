import React from 'react';

export interface KpiItem {
  label: string;
  value: string | number;
  detail: string;
  delta?: string;
  tone?: 'default' | 'accent' | 'ok' | 'danger' | 'warn';
}

const TONE_COLOR: Record<NonNullable<KpiItem['tone']>, string> = {
  default: 'var(--ink)',
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  danger: 'var(--danger)',
  warn: 'var(--warn)',
};

export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sdd-rule-t sdd-rule-b"
      style={{ backgroundColor: 'var(--paper)' }}
    >
      {items.map((item, idx) => (
        <div
          key={item.label}
          className="px-5 py-6 flex flex-col justify-between"
          style={{
            borderRight: idx < items.length - 1 ? '1px solid var(--rule)' : undefined,
            borderBottom: '1px solid var(--rule)',
          }}
        >
          <div className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
            {item.label}
          </div>
          <div
            className="font-semibold tracking-tight leading-none my-3"
            style={{ fontSize: 'var(--t-kpi)', color: TONE_COLOR[item.tone || 'default'] }}
          >
            {item.value}
          </div>
          <div className="text-[13px] leading-snug" style={{ color: 'var(--ink-2)' }}>
            {item.detail}
          </div>
          {item.delta && (
            <div className="font-mono-sdd text-[11px] mt-2" style={{ color: 'var(--accent)' }}>
              {item.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
