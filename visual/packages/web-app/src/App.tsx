import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import type { ProjectSnapshot, ProjectSummary } from '@sdd/contracts';
import { ThemeProvider } from './theme/ThemeProvider';
import { Masthead, type NavSection } from './components/Masthead';
import { ConnectProjectModal } from './components/ConnectProjectModal';
import { LandingView } from './views/LandingView';
import { OverviewView } from './views/OverviewView';
import { PhaseExplorerView } from './views/PhaseExplorerView';
import { TelemetryView } from './views/TelemetryView';
import { GovernanceView } from './views/GovernanceView';
import { SkillsView } from './views/SkillsView';
import { DEMO_PROJECT_SNAPSHOT, DEMO_PROJECT_SUMMARY } from './data/demoSnapshot';
import {
  fetchCloudProjects,
  fetchCloudSnapshot,
  fetchLocalProjects,
  fetchLocalSnapshot,
  getBrowserSnapshot,
  getSupabaseClient,
  listBrowserProjects,
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
  const [showLanding, setShowLanding] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    setError(null);
    const sb = getSupabaseClient();
    let email: string | null = null;
    if (sb) {
      const { data } = await sb.auth.getUser();
      email = data.user?.email ?? null;
    }
    setCloudUserEmail(email);

    const [localList, cloudList, browserList] = await Promise.all([
      fetchLocalProjects(),
      email ? fetchCloudProjects() : Promise.resolve([]),
      listBrowserProjects(),
    ]);
    const combined = [...localList, ...cloudList, ...browserList];
    setProjects(combined);
    setActiveProject((prev) => {
      if (prev?.source === 'demo') return prev;
      if (prev && combined.some((p) => p.id === prev.id && p.source === prev.source)) return prev;
      return combined[0] || null;
    });
    if (combined.length === 0) {
      setShowLanding(true);
      setLoading(false);
    }
  }, []);

  const loadSnapshot = useCallback(async (proj: ProjectSummary | null) => {
    if (!proj) return;
    if (proj.source === 'demo') {
      setSnapshot(DEMO_PROJECT_SNAPSHOT);
      setSelectedPhaseId(DEMO_PROJECT_SNAPSHOT.activePhaseId);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      let data: ProjectSnapshot | null = null;
      if (proj.source === 'cloud') {
        data = await fetchCloudSnapshot(proj.id);
      } else if (proj.source === 'browser') {
        data = await getBrowserSnapshot(proj.id);
      } else {
        data = await fetchLocalSnapshot(proj.id);
      }
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

  const handleLaunchDemo = () => {
    setError(null);
    setProjects((prev) =>
      prev.some((p) => p.source === 'demo' && p.id === DEMO_PROJECT_SUMMARY.id)
        ? prev
        : [...prev, DEMO_PROJECT_SUMMARY],
    );
    setActiveProject(DEMO_PROJECT_SUMMARY);
    setSnapshot(DEMO_PROJECT_SNAPSHOT);
    setSelectedPhaseId(DEMO_PROJECT_SNAPSHOT.activePhaseId);
    setSection('overview');
    setShowLanding(false);
    setLoading(false);
  };

  const handleProjectImported = (
    summary: ProjectSummary,
    importedSnapshot: ProjectSnapshot,
  ) => {
    setError(null);
    setProjects((prev) => {
      const filtered = prev.filter((p) => !(p.id === summary.id && p.source === summary.source));
      return [summary, ...filtered];
    });
    setActiveProject(summary);
    setSnapshot(importedSnapshot);
    setSelectedPhaseId(importedSnapshot.activePhaseId || importedSnapshot.phases[0]?.id || null);
    setSection('overview');
    setShowLanding(false);
    setLoading(false);
  };

  const handleSelectProject = (p: ProjectSummary) => {
    setActiveProject(p);
    setSelectedPhaseId(null);
    setShowLanding(false);
  };

  const showWorkspace = !showLanding && Boolean(snapshot);

  return (
    <div className="min-h-screen flex flex-col">
      <Masthead
        activeSection={section}
        onSelectSection={setSection}
        showLanding={!showWorkspace}
        onOpenLanding={() => setShowLanding(true)}
        onOpenConnect={() => setConnectOpen(true)}
        drawerOpen={drawerOpen}
        onSetDrawerOpen={setDrawerOpen}
        projects={projects}
        activeProjectId={activeProject?.id ?? null}
        onSelectProject={handleSelectProject}
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

        {loading && !snapshot && !showLanding ? (
          <div className="py-20 text-center font-mono-sdd text-[13px]" style={{ color: 'var(--ink-3)' }}>
            Loading SDD workspace snapshot...
          </div>
        ) : !showWorkspace ? (
          <LandingView
            onLaunchDemo={handleLaunchDemo}
            onOpenConnect={() => setConnectOpen(true)}
            onOpenAuth={() => setDrawerOpen(true)}
            cloudUserEmail={cloudUserEmail}
            hasProjects={Boolean(snapshot)}
            onReturnToWorkspace={() => setShowLanding(false)}
          />
        ) : (
          snapshot && (
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
                  onSelectProject={handleSelectProject}
                />
              )}
            </>
          )
        )}
      </main>

      <ConnectProjectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onImported={handleProjectImported}
        cloudUserEmail={cloudUserEmail}
      />
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
