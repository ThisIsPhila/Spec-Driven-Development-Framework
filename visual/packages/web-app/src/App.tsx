import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import type { ProjectSnapshot, ProjectSummary } from '@sdd/contracts';
import { ThemeProvider } from './theme/ThemeProvider';
import { Masthead, type NavSection } from './components/Masthead';
import { OverviewView } from './views/OverviewView';
import { PhaseExplorerView } from './views/PhaseExplorerView';
import { TelemetryView } from './views/TelemetryView';
import { GovernanceView } from './views/GovernanceView';
import { SkillsView } from './views/SkillsView';
import {
  fetchCloudProjects,
  fetchCloudSnapshot,
  fetchLocalProjects,
  fetchLocalSnapshot,
  getSupabaseClient,
} from './services/dataSource';

function WorkspaceApp() {
  const [section, setSection] = useState<NavSection>('overview');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(null);
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [cloudUserEmail, setCloudUserEmail] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setError(null);
    const sb = getSupabaseClient();
    let email: string | null = null;
    if (sb) {
      const { data } = await sb.auth.getUser();
      email = data.user?.email ?? null;
    }
    setCloudUserEmail(email);

    const [localList, cloudList] = await Promise.all([
      fetchLocalProjects(),
      email ? fetchCloudProjects() : Promise.resolve([]),
    ]);
    const combined = [...localList, ...cloudList];
    setProjects(combined);
    setActiveProject((prev) => {
      if (prev && combined.some((p) => p.id === prev.id && p.source === prev.source)) return prev;
      return combined[0] || null;
    });
    if (combined.length === 0) setLoading(false);
  }, []);

  const loadSnapshot = useCallback(async (proj: ProjectSummary | null) => {
    if (!proj) return;
    try {
      setError(null);
      const data =
        proj.source === 'cloud'
          ? await fetchCloudSnapshot(proj.id)
          : await fetchLocalSnapshot(proj.id);
      if (!data) {
        setError(`Could not load snapshot for ${proj.name}.`);
      } else {
        setSnapshot(data);
        setSelectedPhaseId((prev) => prev || data.activePhaseId || data.phases[0]?.id || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project snapshot.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadSnapshot(activeProject);
  }, [activeProject, loadSnapshot]);

  // Live SSE updates for local-first mode
  useEffect(() => {
    if (activeProject?.source !== 'local') {
      setSseConnected(false);
      return;
    }
    const es = new EventSource('/api/events');
    es.addEventListener('connected', () => setSseConnected(true));
    es.addEventListener('snapshot-updated', () => {
      loadSnapshot(activeProject);
    });
    es.onerror = () => setSseConnected(false);
    return () => es.close();
  }, [activeProject, loadSnapshot]);

  const handleOpenPhase = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    setSection('phases');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Masthead
        activeSection={section}
        onSelectSection={setSection}
        projects={projects}
        activeProjectId={activeProject?.id ?? null}
        onSelectProject={(p) => {
          setActiveProject(p);
          setSelectedPhaseId(null);
        }}
        sseConnected={sseConnected}
        cloudUserEmail={cloudUserEmail}
        onAuthChange={loadProjects}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 pb-16">
        {error && (
          <div
            className="mt-6 p-4 sdd-rule-all flex items-center justify-between gap-3 text-[13px]"
            style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadSnapshot(activeProject)}
              className="px-3 py-1 font-mono-sdd text-[11px] uppercase cursor-pointer sdd-rule-all inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {loading && !snapshot ? (
          <div className="py-20 text-center font-mono-sdd text-[13px]" style={{ color: 'var(--ink-3)' }}>
            Loading SDD workspace snapshot...
          </div>
        ) : !snapshot ? (
          <div className="mt-12 p-8 sdd-surface max-w-2xl mx-auto">
            <div className="font-mono-sdd text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--ink-3)' }}>
              No Project Connected
            </div>
            <h1 className="text-[24px] font-semibold mb-3">Launch locally or sign in to Cloud</h1>
            <p className="text-[14px] mb-4" style={{ color: 'var(--ink-2)' }}>
              Run the one-click local launcher inside any repository with <code className="font-mono-sdd">.sdd/</code> installed, or open the <strong>Control panel</strong> to sign in with Supabase Cloud.
            </p>
            <pre className="p-3 font-mono-sdd text-[12px] overflow-x-auto sdd-rule-all" style={{ backgroundColor: 'var(--paper)' }}>
              npm --prefix /path/to/framework/visual run launch -- --project .
            </pre>
          </div>
        ) : (
          <>
            {section === 'overview' && (
              <OverviewView snapshot={snapshot} onOpenPhase={handleOpenPhase} onNavigate={setSection} />
            )}
            {section === 'phases' && (
              <PhaseExplorerView
                snapshot={snapshot}
                selectedPhaseId={selectedPhaseId}
                onSelectPhase={setSelectedPhaseId}
              />
            )}
            {section === 'telemetry' && <TelemetryView snapshot={snapshot} />}
            {section === 'governance' && <GovernanceView snapshot={snapshot} />}
            {section === 'skills' && (
              <SkillsView
                snapshot={snapshot}
                projects={projects}
                activeProjectId={activeProject?.id ?? null}
                onSelectProject={setActiveProject}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <WorkspaceApp />
    </ThemeProvider>
  );
}

export default App;
