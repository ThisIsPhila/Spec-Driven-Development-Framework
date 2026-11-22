import React, { useState } from 'react';
import { SlidersHorizontal, X, Wifi, Cloud, HardDrive, Copy, Check } from 'lucide-react';
import type { ProjectSummary } from '@sdd/contracts';
import { THEMES, useTheme } from '../theme/ThemeProvider';
import { isCloudConfigured, signInCloud, signOutCloud, signUpCloud } from '../services/dataSource';

export type NavSection = 'overview' | 'phases' | 'telemetry' | 'governance' | 'skills';

const SECTIONS: Array<{ id: NavSection; num: string; label: string }> = [
  { id: 'overview', num: '01', label: 'Overview' },
  { id: 'phases', num: '02', label: 'Phases & Specs' },
  { id: 'telemetry', num: '03', label: 'Agent Telemetry' },
  { id: 'governance', num: '04', label: 'Governance' },
  { id: 'skills', num: '05', label: 'Skills & Projects' },
];

interface MastheadProps {
  activeSection: NavSection;
  onSelectSection: (s: NavSection) => void;
  projects: ProjectSummary[];
  activeProjectId: string | null;
  onSelectProject: (p: ProjectSummary) => void;
  sseConnected: boolean;
  cloudUserEmail: string | null;
  onAuthChange: () => void;
}

export function Masthead({
  activeSection,
  onSelectSection,
  projects,
  activeProjectId,
  onSelectProject,
  sseConnected,
  cloudUserEmail,
  onAuthChange,
}: MastheadProps) {
  const { theme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;
  const activeMeta = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthMessage(null);
    const fn = authMode === 'signin' ? signInCloud : signUpCloud;
    const res = await fn(email, password);
    setAuthBusy(false);
    if (res.error) {
      setAuthMessage(res.error);
    } else {
      setAuthMessage(authMode === 'signup' ? 'Account created. Check email if confirmation is enabled.' : 'Signed in.');
      setEmail('');
      setPassword('');
      onAuthChange();
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full"
        style={{ backgroundColor: 'var(--band)', color: 'var(--band-ink)' }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-12 flex items-center justify-between gap-3">
          {/* Left: Folio mark + active project */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono-sdd text-[12px] font-semibold tracking-wider shrink-0">
              {activeMeta.num}
            </span>
            <span className="text-[13px] font-medium truncate">
              {activeProject ? activeProject.name : 'SDD Platform'}
            </span>
            <span
              className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 font-mono-sdd text-[10px] uppercase tracking-wider shrink-0"
              style={{ border: '1px solid currentColor', opacity: 0.85 }}
            >
              {activeProject?.source === 'cloud' ? (
                <>
                  <Cloud className="w-3 h-3" /> Cloud
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3" /> {sseConnected ? 'Live Local' : 'Local'}
                </>
              )}
            </span>
          </div>

          {/* Center: Numbered editorial jump nav */}
          <nav aria-label="Primary sections" className="hidden lg:flex items-center gap-1.5">
            {SECTIONS.map((sec) => {
              const active = sec.id === activeSection;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSelectSection(sec.id)}
                  className="px-2.5 py-1 text-[12px] font-mono-sdd transition-colors cursor-pointer flex items-center gap-1.5"
                  style={{
                    backgroundColor: active ? 'var(--band-ink)' : 'transparent',
                    color: active ? 'var(--band)' : 'var(--band-ink)',
                  }}
                >
                  <span>{sec.num}</span>
                  <span className="font-sans text-[12px]">{sec.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Copy link + Control panel */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyUrl}
              title="Copy workspace link"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-mono-sdd cursor-pointer"
              style={{ border: '1px solid currentColor' }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy link'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium cursor-pointer"
              style={{ backgroundColor: 'var(--band-ink)', color: 'var(--band)' }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Control panel</span>
            </button>
          </div>
        </div>

        {/* Mobile/Tablet section rail */}
        <div
          className="lg:hidden overflow-x-auto px-4 sm:px-8 py-1.5 flex items-center gap-1.5"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--band-ink) 25%, transparent)' }}
        >
          {SECTIONS.map((sec) => {
            const active = sec.id === activeSection;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectSection(sec.id)}
                className="px-2.5 py-1 text-[11px] font-mono-sdd whitespace-nowrap cursor-pointer"
                style={{
                  backgroundColor: active ? 'var(--band-ink)' : 'transparent',
                  color: active ? 'var(--band)' : 'var(--band-ink)',
                }}
              >
                {sec.num} {sec.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Slide-over Control Panel Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div
            className="w-full max-w-md h-full overflow-y-auto p-6 flex flex-col gap-6"
            style={{ backgroundColor: 'var(--paper-raised)', color: 'var(--ink)', borderLeft: '1px solid var(--rule)' }}
          >
            <div className="flex items-center justify-between pb-3 sdd-rule-b">
              <div>
                <div className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                  Control Panel
                </div>
                <h2 className="text-[18px] font-semibold">Workspace, Theme &amp; Cloud</h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close control panel"
                className="p-1.5 cursor-pointer sdd-rule-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Project Switcher */}
            <section>
              <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--ink-3)' }}>
                Connected Projects ({projects.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {projects.map((p) => {
                  const selected = p.id === activeProject?.id;
                  return (
                    <button
                      key={`${p.source}:${p.id}`}
                      type="button"
                      onClick={() => {
                        onSelectProject(p);
                        setDrawerOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 cursor-pointer"
                      style={{
                        border: selected ? '1px solid var(--accent)' : '1px solid var(--rule)',
                        backgroundColor: selected ? 'var(--accent-soft)' : 'var(--paper)',
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{p.name}</div>
                        <div className="font-mono-sdd text-[11px]" style={{ color: 'var(--ink-3)' }}>
                          {p.activePhaseId || 'No active phase'} · {p.overallProgressPct}%
                        </div>
                      </div>
                      <span className="font-mono-sdd text-[10px] uppercase px-1.5 py-0.5 sdd-rule-all shrink-0 flex items-center gap-1">
                        {p.source === 'cloud' ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                        {p.source}
                      </span>
                    </button>
                  );
                })}
                {projects.length === 0 && (
                  <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>
                    No local or cloud projects connected yet.
                  </p>
                )}
              </div>
            </section>

            {/* Theme Switcher */}
            <section>
              <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--ink-3)' }}>
                Editorial Theme (WCAG 2.2 AA)
              </div>
              <div className="grid grid-cols-1 gap-2">
                {THEMES.map((t) => {
                  const active = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className="text-left px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer"
                      style={{
                        border: active ? '1px solid var(--accent)' : '1px solid var(--rule)',
                        backgroundColor: active ? 'var(--accent-soft)' : 'var(--paper)',
                      }}
                    >
                      <div>
                        <div className="text-[13px] font-medium">{t.label}</div>
                        <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>{t.desc}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {t.swatch.map((hex) => (
                          <span
                            key={hex}
                            className="w-4 h-4 inline-block"
                            style={{ backgroundColor: hex, border: '1px solid var(--rule)' }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Supabase Cloud Account */}
            <section className="pt-3 sdd-rule-t">
              <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--ink-3)' }}>
                Cloud Account (Supabase + Vercel)
              </div>
              {cloudUserEmail ? (
                <div className="p-3 sdd-rule-all flex flex-col gap-2" style={{ backgroundColor: 'var(--paper)' }}>
                  <div className="text-[13px]">
                    Signed in as <strong className="font-mono-sdd">{cloudUserEmail}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOutCloud();
                      onAuthChange();
                    }}
                    className="self-start px-3 py-1.5 text-[12px] font-mono-sdd uppercase cursor-pointer sdd-rule-all"
                  >
                    Sign out
                  </button>
                </div>
              ) : !isCloudConfigured() ? (
                <div className="p-3 sdd-rule-all text-[12px]" style={{ backgroundColor: 'var(--paper)', color: 'var(--ink-2)' }}>
                  Running in <strong>100% Local-First Mode</strong>. Set{' '}
                  <code className="font-mono-sdd">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono-sdd">VITE_SUPABASE_ANON_KEY</code> to enable cloud account sync across devices.
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="flex-1 py-1.5 text-[12px] font-mono-sdd uppercase cursor-pointer"
                      style={{
                        border: '1px solid var(--ink)',
                        backgroundColor: authMode === 'signin' ? 'var(--ink)' : 'transparent',
                        color: authMode === 'signin' ? 'var(--paper)' : 'var(--ink)',
                      }}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="flex-1 py-1.5 text-[12px] font-mono-sdd uppercase cursor-pointer"
                      style={{
                        border: '1px solid var(--ink)',
                        backgroundColor: authMode === 'signup' ? 'var(--ink)' : 'transparent',
                        color: authMode === 'signup' ? 'var(--paper)' : 'var(--ink)',
                      }}
                    >
                      Create account
                    </button>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="px-3 py-2 text-[13px] sdd-rule-all"
                    style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 8 chars)"
                    className="px-3 py-2 text-[13px] sdd-rule-all"
                    style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                  />
                  <button
                    type="submit"
                    disabled={authBusy}
                    className="py-2 text-[12px] font-mono-sdd uppercase tracking-wide cursor-pointer"
                    style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
                  >
                    {authBusy ? 'Working...' : authMode === 'signin' ? 'Sign in to Cloud' : 'Create Cloud Account'}
                  </button>
                  {authMessage && (
                    <div className="text-[12px] font-mono-sdd" style={{ color: 'var(--accent)' }}>
                      {authMessage}
                    </div>
                  )}
                </form>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
