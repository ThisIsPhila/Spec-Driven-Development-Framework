import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Cloud,
  Cpu,
  FolderOpen,
  GitBranch,
  Layers,
  Play,
  ShieldCheck,
  Terminal,
  UserCheck,
} from 'lucide-react';

interface LandingViewProps {
  onLaunchDemo: () => void;
  onOpenConnect: () => void;
  onOpenAuth: () => void;
  cloudUserEmail: string | null;
  hasProjects: boolean;
  onReturnToWorkspace: () => void;
}

const FEATURES = [
  {
    num: '01',
    icon: Layers,
    title: 'Visual Spec Lifecycle',
    detail:
      'Navigate Requirements → Design → Tasks with approval gates, requirement-to-task traceability, sanitized Markdown & Mermaid diagrams, and verification evidence.',
  },
  {
    num: '02',
    icon: Cpu,
    title: 'Agent, Token & Cost Telemetry',
    detail:
      'Track onboarding, phase-start, and per-task attribution across Claude, Codex, Gemini, Kiro, and OpenCode with Measured vs. Estimated USD cost rollups.',
  },
  {
    num: '03',
    icon: Cloud,
    title: 'Zero-CLI & Cloud Workspace Sync',
    detail:
      'Load a local .sdd/ folder directly in your browser, import from any GitHub repository, or sign in to keep portable snapshots synced across devices via Supabase RLS.',
  },
];

const TELEMETRY_SPECIMEN = [
  { label: 'Spec Traceability', value: '100%', note: 'Requirements mapped & evidenced' },
  { label: 'Harness Adapters', value: '05', note: 'Claude · Codex · Gemini · Kiro · OpenCode' },
  { label: 'Editorial Themes', value: '04', note: 'WCAG 2.2 AA contrast verified' },
  { label: 'CLI Required', value: '0', note: 'Demo, folder & GitHub in browser' },
];

export function LandingView({
  onLaunchDemo,
  onOpenConnect,
  onOpenAuth,
  cloudUserEmail,
  hasProjects,
  onReturnToWorkspace,
}: LandingViewProps) {
  const [cliOpen, setCliOpen] = useState(false);

  return (
    <div className="flex flex-col gap-12 pt-6 sm:pt-10 pb-12">
      {/* Editorial Hero Spread */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 sdd-rule-b">
        <div className="lg:col-span-7 flex flex-col justify-between gap-6 lg:pr-8 lg:border-r min-w-0" style={{ borderColor: 'var(--rule)' }}>
          <div>
            <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-3" style={{ color: 'var(--ink-3)' }}>
              Spec-Driven Development Platform · v2.4.0 · Cloud &amp; Browser Edition
            </div>
            <h1
              className="font-semibold tracking-tight leading-[1.03] mb-4"
              style={{ fontSize: 'var(--t-display)' }}
            >
              Specs before code.
              <br />
              Telemetry without guesswork.
            </h1>
            <p className="text-[15px] sm:text-[16px] max-w-2xl leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              Inspect active phases, approval gates, requirement-to-task traceability, and multi-agent token &amp; USD API costs in one editorial workspace—straight from your browser, GitHub, or cloud account.
            </p>
          </div>

          {/* Primary Zero-CLI CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onLaunchDemo}
              className="inline-flex items-center gap-2 px-5 py-3 text-[13px] font-medium cursor-pointer"
              style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
            >
              <Play className="w-4 h-4" />
              <span>Try Interactive Demo</span>
            </button>

            <button
              type="button"
              onClick={onOpenConnect}
              className="inline-flex items-center gap-2 px-5 py-3 text-[13px] font-medium cursor-pointer"
              style={{ border: '1px solid var(--ink)', color: 'var(--ink)', backgroundColor: 'var(--paper-raised)' }}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Connect Project</span>
            </button>

            <button
              type="button"
              onClick={cloudUserEmail && hasProjects ? onReturnToWorkspace : onOpenAuth}
              className="inline-flex items-center gap-2 px-4 py-3 text-[13px] font-medium cursor-pointer sdd-rule-all"
              style={{ color: 'var(--ink)', backgroundColor: 'transparent' }}
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {cloudUserEmail ? `Cloud: ${cloudUserEmail}` : 'Sign In / Create Cloud Account'}
              </span>
            </button>
          </div>

          {hasProjects && (
            <div>
              <button
                type="button"
                onClick={onReturnToWorkspace}
                className="inline-flex items-center gap-1.5 font-mono-sdd text-[12px] uppercase tracking-wider cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                <span>Return to active workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Swiss Specimen KPI Ledger */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 min-w-0">
          <div className="sdd-surface p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 mb-4 sdd-rule-b">
              <span className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                Platform Specimen · Live Architecture
              </span>
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>

            <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {TELEMETRY_SPECIMEN.map((item) => (
                <div key={item.label} className="p-4 flex flex-col justify-between" style={{ backgroundColor: 'var(--paper-raised)' }}>
                  <div className="font-mono-sdd text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                    {item.label}
                  </div>
                  <div
                    className="font-semibold tracking-tight leading-none my-2"
                    style={{ fontSize: 'clamp(26px, 2.8vw, 40px)', color: 'var(--accent)' }}
                  >
                    {item.value}
                  </div>
                  <div className="text-[12px] leading-snug" style={{ color: 'var(--ink-2)' }}>
                    {item.note}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 sdd-rule-t flex flex-wrap items-center justify-between gap-2 font-mono-sdd text-[11px]" style={{ color: 'var(--ink-3)' }}>
              <span className="inline-flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                Folder · GitHub · Supabase RLS
              </span>
              <span>No terminal required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Breakdown — 3-Column Hairline Grid */}
      <section aria-labelledby="landing-features-heading">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <div>
            <div className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              Capabilities
            </div>
            <h2 id="landing-features-heading" className="font-semibold tracking-tight" style={{ fontSize: 'var(--t-h2)' }}>
              Built for spec clarity and multi-agent accountability
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 sdd-rule-all" style={{ backgroundColor: 'var(--paper-raised)' }}>
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.num}
                className="p-6 flex flex-col gap-3 min-w-0"
                style={{
                  borderBottom: '1px solid var(--rule)',
                  borderRight: idx < FEATURES.length - 1 ? '1px solid var(--rule)' : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-sdd text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                    {feat.num}
                  </span>
                  <Icon className="w-4 h-4" style={{ color: 'var(--ink-2)' }} />
                </div>
                <h3 className="text-[17px] font-semibold tracking-tight">{feat.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                  {feat.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Optional Collapsible Local CLI Section */}
      <section className="sdd-surface">
        <button
          type="button"
          onClick={() => setCliOpen((v) => !v)}
          aria-expanded={cliOpen}
          className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Terminal className="w-4 h-4 shrink-0" style={{ color: 'var(--ink-2)' }} />
            <span className="text-[14px] font-medium">Local CLI (Optional for power users)</span>
            <span className="hidden sm:inline font-mono-sdd text-[11px]" style={{ color: 'var(--ink-3)' }}>
              Live SSE file watcher &amp; git worktree daemon
            </span>
          </div>
          {cliOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        </button>

        {cliOpen && (
          <div className="px-5 pb-5 pt-3 sdd-rule-t flex flex-col gap-3">
            <p className="text-[13px]" style={{ color: 'var(--ink-2)' }}>
              Prefer live SSE updates while editing <code className="font-mono-sdd">.sdd/</code> files or git worktrees locally? Run the loopback launcher inside any SDD repository:
            </p>
            <pre className="p-3 font-mono-sdd text-[12px] overflow-x-auto sdd-rule-all" style={{ backgroundColor: 'var(--paper)' }}>
              npm --prefix /path/to/framework/visual run launch -- --project .
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
