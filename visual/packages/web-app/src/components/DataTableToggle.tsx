import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DataTableToggleProps {
  caption: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export function DataTableToggle({ caption, headers, rows }: DataTableToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-mono-sdd uppercase tracking-wide cursor-pointer transition-colors"
        style={{
          border: '1px solid var(--ink)',
          backgroundColor: open ? 'var(--ink)' : 'transparent',
          color: open ? 'var(--paper)' : 'var(--ink)',
        }}
      >
        {open ? 'Hide data table' : 'Show data table'}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="mt-3 overflow-x-auto sdd-surface">
          <table className="w-full text-left border-collapse text-[13px]">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 font-mono-sdd text-[11px] uppercase tracking-wider font-medium"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--rule)' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 font-mono-sdd text-[12px]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={headers.length} className="px-3 py-4 text-center" style={{ color: 'var(--ink-3)' }}>
                    No recorded rows yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
