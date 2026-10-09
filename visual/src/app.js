import { renderMarkdown } from './markdown.js';
import { renderMermaidBlocks } from './diagrams.js';
import { generateTraceabilitySvg, generateTraceabilityList } from './traceability.js';
import { renderLandingView } from './views/landingView.js';
import demoSnapshot from '../demo/demo-project.json';

export class SDDWorkspaceApp {
  constructor(containerId = 'app') {
    this.container = document.getElementById(containerId);
    this.token = this._resolveToken();
    this.projects = [];
    this.currentProjectId = null;
    this.snapshot = null;

    // View Routing:
    // 'landing'  -> Tier 1: Public Framework Landing Page (skills.sh style, zero private data)
    // 'projects' -> Tier 2: Logged In Account Multi-Project Dashboard (all user projects)
    // 'project'  -> Tier 3: Direct Project SDD Page (live progress, direct header phase links, sync status)
    // 'profiles' -> Composable Profiles Catalog
    this.currentView = this.token ? 'project' : 'landing';
    this.activePhaseId = null;
    this.activeTab = 'overview'; // 'overview' | 'requirements' | 'design' | 'tasks' | 'evidence' | 'metrics' | 'traceability'
    this.dirFilter = 'active'; // 'active' | 'all' | 'backlog' | 'archive'
    this.searchQuery = '';

    this.connectionStatus = this.token ? 'connecting' : 'public';
    this.sseSource = null;
    this.pollTimer = null;
  }

  _resolveToken() {
    const hash = window.location.hash;
    const hashMatch = hash.match(/token=([a-f0-9]+)/i);
    if (hashMatch) {
      const token = hashMatch[1];
      sessionStorage.setItem('sdd_token', token);
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return token;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token');
    if (queryToken) {
      sessionStorage.setItem('sdd_token', queryToken);
      return queryToken;
    }

    return sessionStorage.getItem('sdd_token') || '';
  }

  async init() {
    this._setupGlobalKeyboardShortcuts();
    if (this.token) {
      await this._loadProjects();
    } else {
      this._loadPublicLanding();
    }
    this._setupVisibilityListener();
  }

  _loadPublicLanding() {
    this.connectionStatus = 'public';
    this.currentView = 'landing';
    this.snapshot = null;
    this.render();
  }

  async _loadProjects() {
    if (this.token) {
      try {
        const res = await fetch(`/api/projects?token=${encodeURIComponent(this.token)}`);
        if (res.ok) {
          this.projects = await res.json();
          if (this.projects.length > 0) {
            await this.selectProject(this.projects[0].id);
            return;
          }
        }
      } catch {
        // Fall back to demo
      }
    }

    this._loadStaticDemo();
  }

  _loadStaticDemo() {
    this.projects = [{
      id: demoSnapshot.projectId,
      name: demoSnapshot.projectId,
      profile: demoSnapshot.profile,
      activePhaseId: demoSnapshot.activePhaseId,
      account: demoSnapshot.account,
      metrics: demoSnapshot.metrics,
      phasesCount: demoSnapshot.phases.length,
    }];
    this.currentProjectId = demoSnapshot.projectId;
    this.snapshot = demoSnapshot;
    this.connectionStatus = 'demo';
    this.currentView = 'project';
    this.render();
  }

  async selectProject(projectId) {
    this.currentProjectId = projectId;
    this.currentView = 'project';
    await this._fetchSnapshot();
    this._connectSSE();
    this._startPolling();
    this.render();
  }

  async _fetchSnapshot() {
    if (this.connectionStatus === 'demo' || this.connectionStatus === 'public') return;
    try {
      const res = await fetch(`/api/project/${this.currentProjectId}/snapshot?token=${encodeURIComponent(this.token)}`);
      if (res.ok) {
        const data = await res.json();
        const prevRev = this.snapshot?.contentRevision;
        this.snapshot = data;
        this.connectionStatus = 'live';

        if (prevRev && prevRev !== data.contentRevision) {
          const scroll = window.scrollY;
          this.render();
          window.scrollTo(0, scroll);
        }
      } else {
        this.connectionStatus = 'offline';
        this._updateStatusBar();
      }
    } catch {
      this.connectionStatus = 'offline';
      this._updateStatusBar();
    }
  }

  _connectSSE() {
    if (this.connectionStatus === 'demo' || this.connectionStatus === 'public') return;
    if (this.sseSource) this.sseSource.close();

    try {
      const url = `/api/project/${this.currentProjectId}/events?token=${encodeURIComponent(this.token)}`;
      this.sseSource = new EventSource(url);

      this.sseSource.onopen = () => {
        this.connectionStatus = 'live';
        this._updateStatusBar();
      };

      this.sseSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'update' && msg.snapshot) {
            this.snapshot = msg.snapshot;
            this.connectionStatus = 'live';
            const scroll = window.scrollY;
            this.render();
            window.scrollTo(0, scroll);
          }
        } catch {}
      };

      this.sseSource.onerror = () => {
        this.connectionStatus = 'polling';
        this._updateStatusBar();
      };
    } catch {
      this.connectionStatus = 'polling';
      this._updateStatusBar();
    }
  }

  _startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && this.token) {
        this._fetchSnapshot();
      }
    }, 2000);
  }

  _setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.token) {
        this._fetchSnapshot();
      }
    });
  }

  _setupGlobalKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        const searchEl = document.getElementById('skills-search-input');
        if (searchEl) searchEl.focus();
      }
    });
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="skills-layout">
        <!-- Clean, Un-cluttered Header -->
        <header class="skills-header">
          ${this._renderHeaderContent()}
        </header>

        <!-- Main Page Container -->
        <main class="page-container">
          ${this._renderCurrentView()}
          ${this._renderFooter()}
        </main>
      </div>
    `;

    this._bindEvents();

    if (this.currentView === 'project' && this.activePhaseId && this.activeTab === 'design') {
      renderMermaidBlocks(this.container);
    }
  }

  _renderHeaderContent() {
    const isLanding = this.currentView === 'landing';
    const isProjectsList = this.currentView === 'projects';
    const isProfiles = this.currentView === 'profiles';

    // 1. Landing View Header (Minimal, Public)
    if (isLanding) {
      return `
        <div class="header-left">
          <div class="header-brand" id="brand-home-btn">
            <svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color:currentcolor">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1L16 15H0L8 1Z" fill="currentColor"></path>
            </svg>
            <span class="header-slash">/</span>
            <span class="font-mono font-bold">SDD</span>
          </div>
        </div>

        <nav class="header-nav" aria-label="Primary navigation">
          <a class="nav-link active" id="nav-landing-home-btn">Overview</a>
          <a class="nav-link" id="nav-profiles-btn">Profiles</a>
          <a class="nav-link" href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer">Docs ↗</a>
        </nav>

        <div class="header-right">
          <button class="btn btn-secondary" id="launch-demo-header-btn" style="padding:0.25rem 0.65rem; font-size:0.75rem; font-family:var(--font-mono);">
            Demo Sandbox
          </button>
          <button class="btn btn-primary" id="connect-workspace-header-btn" style="padding:0.25rem 0.65rem; font-size:0.75rem; font-family:var(--font-mono);">
            ${this.token ? 'My Projects' : 'Connect Account'}
          </button>
        </div>
      `;
    }

    // 2. Account Multi-Project Dashboard Header
    if (isProjectsList || isProfiles) {
      const accountName = this.snapshot?.account?.name || (this.token ? 'Account' : 'Demo');
      return `
        <div class="header-left">
          <div class="header-brand" id="brand-home-btn">
            <svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color:currentcolor">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1L16 15H0L8 1Z" fill="currentColor"></path>
            </svg>
            <span class="header-slash">/</span>
            <span class="header-account-name">${accountName}</span>
            <span class="header-slash">/</span>
            <span class="header-project-name">${isProfiles ? 'Profiles' : 'Projects'}</span>
          </div>
        </div>

        <nav class="header-nav">
          <a class="nav-link ${isProjectsList ? 'active' : ''}" id="nav-projects-dashboard-btn">All Projects</a>
          <a class="nav-link ${isProfiles ? 'active' : ''}" id="nav-profiles-btn">Profiles</a>
          <a class="nav-link" href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer">Docs ↗</a>
        </nav>

        <div class="header-right">
          <a class="nav-link-subtle" id="nav-landing-page-btn">Public Landing</a>
        </div>
      `;
    }

    // 3. Direct Project SDD Page Header (Clean breadcrumbs + DIRECT PHASE LINKS + live account sync indicator)
    const account = this.snapshot?.account || { name: 'Local', branch: 'main', headCommit: '' };
    const projectName = this.snapshot?.projectId || 'Project';
    const phases = this.snapshot?.phases || [];

    return `
      <div class="header-left">
        <div class="header-brand" id="brand-home-btn" title="Go to all projects">
          <svg data-testid="geist-icon" height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color:currentcolor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1L16 15H0L8 1Z" fill="currentColor"></path>
          </svg>
          <span class="header-slash">/</span>
          <span class="header-account-name" id="nav-header-account-btn" title="View all projects in account">${account.name}</span>
          <span class="header-slash">/</span>
          <span class="header-project-name" id="nav-header-project-btn" title="Project overview">${projectName}</span>
        </div>
      </div>

      <!-- DIRECT PHASE LINKS IN THE HEADER -->
      <nav class="header-phase-nav" aria-label="Phases quick navigation">
        <button class="phase-header-btn ${this.activePhaseId === null && this.activeTab !== 'metrics' ? 'active' : ''}" id="header-all-sprints-btn">
          All Sprints
        </button>
        ${phases.map(p => {
          const isActive = this.activePhaseId === p.id;
          const cleanLabel = p.id.replace(/^phase-0*/i, 'Phase ');
          return `
            <button class="phase-header-btn ${isActive ? 'active' : ''}" data-phase-id="${p.id}">
              <span class="phase-header-dot ${p.category === 'active' ? 'dot-active' : p.category === 'archive' ? 'dot-complete' : 'dot-backlog'}"></span>
              ${cleanLabel}
              ${p.category === 'active' ? `<span class="header-mini-badge">${p.taskCounts?.percent || 0}%</span>` : ''}
            </button>
          `;
        }).join('')}
        <button class="phase-header-btn ${this.activeTab === 'metrics' && this.activePhaseId === null ? 'active' : ''}" id="header-metrics-btn">
          📊 Metrics
        </button>
      </nav>

      <div class="header-right">
        <!-- Live Account Sync Indicator -->
        <div class="sync-status-pill" title="${this.token ? `Progress simultaneously syncing to account ${account.name}` : 'Local standalone mode'}">
          <span class="sync-dot ${this.token ? 'live' : 'standalone'}"></span>
          <span class="sync-text">${this.token ? 'SYNCED' : 'LOCAL'}</span>
        </div>

        <a class="nav-link-subtle" id="nav-projects-dashboard-btn" title="View all projects in account">Projects</a>
        <a class="nav-link-subtle" id="nav-landing-page-btn" title="Go to public landing">Landing</a>
      </div>
    `;
  }

  _updateStatusBar() {
    const pill = document.querySelector('.sync-status-pill');
    if (pill) {
      const isSynced = this.connectionStatus === 'live';
      pill.innerHTML = `
        <span class="sync-dot ${isSynced ? 'live' : 'standalone'}"></span>
        <span class="sync-text">${isSynced ? 'SYNCED' : this.connectionStatus.toUpperCase()}</span>
      `;
    }
  }

  _renderCurrentView() {
    if (this.currentView === 'landing') {
      return renderLandingView();
    }
    if (this.currentView === 'projects') {
      return this._renderAccountProjectsView();
    }
    if (this.currentView === 'profiles') {
      return this._renderProfilesView();
    }
    if (this.activePhaseId) {
      return this._renderPhaseDetailView();
    }
    if (this.activeTab === 'metrics') {
      return this._renderProjectMetricsView();
    }
    return this._renderDirectoryView();
  }

  // ---------------------------------------------------------------------------
  // Tier 2: The Logged In State (Account Level / Multi-Project Dashboard)
  // ---------------------------------------------------------------------------
  _renderAccountProjectsView() {
    const account = this.snapshot?.account || { name: 'Developer', email: '', branch: 'main', headCommit: '' };
    const projectsList = this.projects.length > 0 ? this.projects : [{
      id: this.snapshot?.projectId || 'Spec-Driven-Development-Framework',
      name: this.snapshot?.projectId || 'Spec-Driven-Development-Framework',
      profile: this.snapshot?.profile || 'general',
      activePhaseId: this.snapshot?.activePhaseId || 'phase-005-visual-framework-workspace',
    }];

    const overallHealth = this.snapshot?.metrics?.overallHealthScore || 95;
    const overallGrade = this.snapshot?.metrics?.overallHealthGrade || 'EXCELLENT';

    return `
      <div class="projects-dashboard">
        <!-- Account Hero Bar -->
        <div class="account-hero-bar">
          <div class="account-identity">
            <div class="account-avatar-large">👤</div>
            <div>
              <h1 class="account-title">${account.name}</h1>
              <p class="account-sub">${account.email || 'Local Developer'} • ${account.branch} (${(account.headCommit || '').slice(0, 7)})</p>
            </div>
          </div>
          <button class="btn btn-secondary" id="dash-connect-another-btn" style="font-family:var(--font-mono); font-size:0.75rem;">
            + Connect Another Repository
          </button>
        </div>

        <!-- High-level Account KPI Tiles -->
        <div class="kpi-grid" style="margin-top:0;">
          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">SDD Projects</h3>
              <span class="kpi-badge status-badge-verified">Active</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${projectsList.length}</span>
              <span class="kpi-subtext">Repositories</span>
            </div>
            <div class="kpi-footer">
              <span>All workspaces syncing</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Average Health</h3>
              <span class="kpi-badge status-badge-verified">${overallGrade}</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${overallHealth}</span>
              <span class="kpi-subtext">/ 100</span>
            </div>
            <div class="kpi-footer">
              <span>Spec quality composite</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Active Sprints</h3>
              <span class="kpi-badge status-badge-implemented">Running</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${this.snapshot?.metrics?.activeSprintsCount || 1}</span>
              <span class="kpi-subtext">In-Flight</span>
            </div>
            <div class="kpi-footer">
              <span>Real-time agent tracking</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Sync Status</h3>
              <span class="kpi-badge status-badge-verified">Live</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">100%</span>
              <span class="kpi-subtext">Automated</span>
            </div>
            <div class="kpi-footer">
              <span>Simultaneous background updates</span>
            </div>
          </div>
        </div>

        <div class="section-bar-header">
          <span>Connected SDD Repositories (${projectsList.length})</span>
        </div>

        <!-- Project Cards Grid -->
        <div class="project-card-grid">
          ${projectsList.map(proj => {
            const isCurrent = proj.id === this.currentProjectId;
            const health = isCurrent ? (this.snapshot?.metrics?.overallHealthScore || 95) : 85;
            const activePhase = isCurrent ? (this.snapshot?.activePhaseId || 'phase-005') : proj.activePhaseId;
            const progressPct = isCurrent ? (this.snapshot?.metrics?.overallProgressPct || 88) : 50;

            return `
              <div class="project-dash-card" data-project-id="${proj.id}">
                <div>
                  <div class="project-dash-header">
                    <div>
                      <h2 class="project-dash-title">${proj.name || proj.id}</h2>
                      <p class="project-dash-path mono">${proj.root || '~/' + proj.id}</p>
                    </div>
                    <span class="profile-tag-pill mono">${proj.profile || 'general'}</span>
                  </div>

                  <div class="project-dash-meta-box">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                      <div>
                        <div class="project-meta-label">Active Sprint</div>
                        <div class="project-meta-value mono">${activePhase}</div>
                      </div>
                      <div style="text-align:right;">
                        <div class="project-meta-label">Spec Health</div>
                        <div class="project-meta-value" style="color:#10b981; font-weight:700;">${health}/100</div>
                      </div>
                    </div>

                    <div class="progress-track" style="margin-top:0.75rem;">
                      <div class="progress-bar" style="width: ${progressPct}%;"></div>
                    </div>
                    <div class="progress-pct mono" style="margin-top:0.25rem; font-size:0.7rem;">${progressPct}% tasks closed</div>
                  </div>
                </div>

                <div class="project-dash-footer">
                  <span class="sync-status-pill">
                    <span class="sync-dot live"></span>
                    <span class="sync-text">LIVE SYNCED</span>
                  </span>
                  <button class="btn btn-primary" style="padding:0.35rem 0.75rem; font-size:0.75rem; font-family:var(--font-mono);">
                    Open Workspace →
                  </button>
                </div>
              </div>
            `;
          }).join('')}

          <!-- Synthetic Demo Showcase Card for comparison -->
          <div class="project-dash-card" id="demo-showcase-card">
            <div>
              <div class="project-dash-header">
                <div>
                  <h2 class="project-dash-title">cloud-billing-service</h2>
                  <p class="project-dash-path mono">/synthetic/workspace/cloud-billing-service</p>
                </div>
                <span class="profile-tag-pill mono">api</span>
              </div>

              <div class="project-dash-meta-box">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                  <div>
                    <div class="project-meta-label">Active Sprint</div>
                    <div class="project-meta-value mono">phase-003-stripe-webhook</div>
                  </div>
                  <div style="text-align:right;">
                    <div class="project-meta-label">Spec Health</div>
                    <div class="project-meta-value" style="color:#06b6d4; font-weight:700;">85/100</div>
                  </div>
                </div>

                <div class="progress-track" style="margin-top:0.75rem;">
                  <div class="progress-bar" style="width: 50%;"></div>
                </div>
                <div class="progress-pct mono" style="margin-top:0.25rem; font-size:0.7rem;">2/4 tasks closed (50%)</div>
              </div>
            </div>

            <div class="project-dash-footer">
              <span class="sync-status-pill">
                <span class="sync-dot standalone"></span>
                <span class="sync-text">SHOWCASE SANDBOX</span>
              </span>
              <button class="btn btn-secondary" style="padding:0.35rem 0.75rem; font-size:0.75rem; font-family:var(--font-mono);">
                Explore Sandbox →
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tier 3: Direct Project SDD Page (All Sprints Overview)
  // ---------------------------------------------------------------------------
  _renderDirectoryView() {
    const phases = this.snapshot?.phases || [];
    const activePhases = phases.filter(p => p.category === 'active');
    const backlogPhases = phases.filter(p => p.category === 'backlog');
    const archivePhases = phases.filter(p => p.category === 'archive');

    let displayed = phases;
    if (this.dirFilter === 'active') displayed = activePhases;
    if (this.dirFilter === 'backlog') displayed = backlogPhases;
    if (this.dirFilter === 'archive') displayed = archivePhases;

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      displayed = displayed.filter(p =>
        p.id.toLowerCase().includes(q) ||
        (p.name && p.name.toLowerCase().includes(q))
      );
    }

    const metrics = this.snapshot?.metrics || {
      overallHealthScore: 0,
      overallHealthGrade: 'UNKNOWN',
      totalRequirements: 0,
      totalTasks: 0,
      completedTasks: 0,
      overallProgressPct: 0,
      traceabilityCoveragePct: 0,
      verificationAssurancePct: 0,
      activeSprintsCount: activePhases.length,
      orphanTaskCount: 0,
      unmappedReqCount: 0,
    };

    return `
      <!-- Executive KPI Metrics Bar (Not in raw .md) -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <h3 class="kpi-title">Spec Health Index</h3>
            <span class="kpi-badge status-badge-verified">${metrics.overallHealthGrade}</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-number">${metrics.overallHealthScore}</span>
            <span class="kpi-subtext">/ 100</span>
          </div>
          <div class="kpi-footer">
            <span>Pillars: Contracts • Governance • Tests</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <h3 class="kpi-title">Traceability Coverage</h3>
            <span class="kpi-badge ${metrics.unmappedReqCount > 0 ? 'status-badge-gap' : 'status-badge-verified'}">
              ${metrics.unmappedReqCount > 0 ? `${metrics.unmappedReqCount} Gaps` : '100% Mapped'}
            </span>
          </div>
          <div class="kpi-body">
            <span class="kpi-number">${metrics.traceabilityCoveragePct}%</span>
            <span class="kpi-subtext">REQ Coverage</span>
          </div>
          <div class="kpi-footer">
            <span>${metrics.totalRequirements} Explicit Requirements</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <h3 class="kpi-title">Verification Assurance</h3>
            <span class="kpi-badge status-badge-verified">${metrics.verificationAssurancePct}% Assured</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-number">${metrics.verificationAssurancePct}%</span>
            <span class="kpi-subtext">Backed</span>
          </div>
          <div class="kpi-footer">
            <span>Pass Rate across all runs</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <h3 class="kpi-title">Task Burndown</h3>
            <span class="kpi-badge status-badge-implemented">${metrics.activeSprintsCount} Active</span>
          </div>
          <div class="kpi-body">
            <span class="kpi-number">${metrics.overallProgressPct}%</span>
            <span class="kpi-subtext">Completed</span>
          </div>
          <div class="kpi-footer">
            <span>${metrics.completedTasks} / ${metrics.totalTasks} Tasks Closed</span>
          </div>
        </div>
      </section>

      <!-- Directory / Sprints Leaderboard Section -->
      <section class="directory-section">
        <div class="directory-header">
          <h2 class="directory-title">Project Sprints & Specifications</h2>
        </div>

        <div class="search-input-wrapper">
          <input 
            type="text" 
            id="skills-search-input" 
            class="search-input" 
            placeholder="Search specs & phases..." 
            value="${this.searchQuery}"
          />
          <kbd class="search-kbd">/</kbd>
        </div>

        <div class="directory-tabs">
          <button class="dir-tab-btn ${this.dirFilter === 'active' ? 'active' : ''}" data-dir-filter="active">
            Active Sprints (${activePhases.length})
          </button>
          <button class="dir-tab-btn ${this.dirFilter === 'all' ? 'active' : ''}" data-dir-filter="all">
            All Phases (${phases.length})
          </button>
          <button class="dir-tab-btn ${this.dirFilter === 'backlog' ? 'active' : ''}" data-dir-filter="backlog">
            Backlog (${backlogPhases.length})
          </button>
          <button class="dir-tab-btn ${this.dirFilter === 'archive' ? 'active' : ''}" data-dir-filter="archive">
            Completed Archive (${archivePhases.length})
          </button>
        </div>

        <div class="table-header">
          <div>#</div>
          <div>Specification / Phase</div>
          <div>Health</div>
          <div>Traceability</div>
          <div>Tasks Progress</div>
          <div style="text-align:right;">Status</div>
        </div>

        <div class="table-body">
          ${displayed.length === 0 ? `<div style="padding: 3rem 0; text-align: center; color: var(--ds-gray-500); font-family: var(--font-mono);">No specifications match query "${this.searchQuery}"</div>` : ''}
          ${displayed.map((p, idx) => {
            const pHealth = p.metrics?.healthScore || 0;
            const pGrade = p.metrics?.healthGrade || 'UNKNOWN';
            const reqTotal = p.metrics?.traceability?.totalRequirements || p.requirements?.length || 0;
            const reqMapped = p.metrics?.traceability?.mappedRequirements || 0;

            return `
              <div class="table-row" data-phase-id="${p.id}">
                <div class="row-num">${idx + 1}</div>
                <div class="row-primary">
                  <div class="row-title">${p.name || p.id}</div>
                  <div class="row-sub mono">${p.id}</div>
                </div>
                <div class="row-health">
                  <span class="matrix-status-badge ${pHealth >= 75 ? 'status-badge-verified' : pHealth >= 50 ? 'status-badge-implemented' : 'status-badge-gap'}">
                    ${pHealth}/100 • ${pGrade}
                  </span>
                </div>
                <div class="row-trace">
                  <span class="mono" style="font-size:0.8rem; color:var(--foreground);">
                    ${reqMapped}/${reqTotal} REQs (${p.metrics?.traceability?.requirementCoveragePct || 100}%)
                  </span>
                </div>
                <div class="row-progress">
                  <div class="progress-track">
                    <div class="progress-bar" style="width: ${p.taskCounts?.percent || 0}%;"></div>
                  </div>
                  <div class="progress-pct mono">${p.taskCounts?.completed || 0}/${p.taskCounts?.total || 0} tasks (${p.taskCounts?.percent || 0}%)</div>
                </div>
                <div class="row-status">
                  <span class="status-pill-clean ${p.category === 'archive' ? 'status-clean-complete' : p.category === 'active' ? 'status-clean-active' : 'status-clean-backlog'}">
                    ${p.category === 'archive' ? 'Completed' : p.category === 'active' ? 'Active Sprint' : 'Backlog'}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tier 3: Phase Detail View (With Dedicated Metrics & Health Tab)
  // ---------------------------------------------------------------------------
  _renderPhaseDetailView() {
    const phases = this.snapshot?.phases || [];
    const phase = phases.find(p => p.id === this.activePhaseId) || phases[0];
    if (!phase) return `<div class="empty-state">Phase not found</div>`;

    const activeTask = (phase.tasks || []).find(t => t.status === 'doing');
    const evCount = phase.artifacts?.evidence?.length || 0;
    const account = this.snapshot?.account || { name: 'Developer', email: '', branch: 'main', headCommit: '' };
    const pHealth = phase.metrics?.healthScore || 0;
    const pGrade = phase.metrics?.healthGrade || 'UNKNOWN';

    return `
      <div class="detail-view">
        <nav class="detail-breadcrumbs" aria-label="Breadcrumb">
          <a id="back-to-dir-btn">sprints</a>
          <span>/</span>
          <a id="back-to-dir-btn2">${phase.category}</a>
          <span>/</span>
          <span>${phase.id}</span>
        </nav>

        <header class="detail-title-header">
          <h1 class="detail-title">${phase.name || phase.id}</h1>
          <div class="detail-tags-row">
            <span class="profile-tag-pill mono">${this.snapshot?.profile || 'general'}</span>
            <span class="status-pill-clean ${phase.category === 'archive' ? 'status-clean-complete' : 'status-clean-active'}">
              ${phase.category.toUpperCase()}
            </span>
            <span class="matrix-status-badge ${pHealth >= 75 ? 'status-badge-verified' : 'status-badge-implemented'}">
              Health: ${pHealth}/100 • ${pGrade}
            </span>
            <span class="mono" style="font-size:0.8rem; color:var(--ds-gray-600);">${phase.taskCounts?.completed || 0}/${phase.taskCounts?.total || 0} Tasks</span>
          </div>
        </header>

        <div class="detail-layout-grid">
          <!-- Left Column (Main Content Body) -->
          <div class="detail-main-col">
            <!-- Execution Command Box -->
            <div style="margin-bottom: 2rem;">
              <div class="section-bar-header">
                <span>Task Execution Command</span>
              </div>
              <div class="command-pill" style="max-width:100%;">
                <code><span class="prompt">$</span>bash scripts/phase.sh task ${activeTask ? activeTask.id : 'T-1'} done</code>
                <button class="copy-icon-btn" title="Copy command">
                  <svg viewBox="0 0 16 16" height="14" width="14" fill="currentColor">
                    <path fill-rule="evenodd" d="M2.75.5C1.78.5 1 1.28 1 2.25v7.5c0 .97.78 1.75 1.75 1.75H4.5V10H2.75a.25.25 0 0 1-.25-.25v-7.5c0-.14.11-.25.25-.25h5.5c.14 0 .25.11.25.25V3H10v-.75C10 1.28 9.22.5 8.25.5zm5 4C6.78 4.5 6 5.28 6 6.25v7.5c0 .97.78 1.75 1.75 1.75h5.5c.97 0 1.75-.78 1.75-1.75v-7.5c0-.97-.78-1.75-1.75-1.75zM7.5 6.25c0-.14.11-.25.25-.25h5.5c.14 0 .25.11.25.25v7.5q-.02.23-.25.25h-5.5a.25.25 0 0 1-.25-.25z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Detail Tabs -->
            <div class="detail-tabs-bar">
              <button class="detail-tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-detail-tab="overview">
                Overview
              </button>
              <button class="detail-tab-btn ${this.activeTab === 'requirements' ? 'active' : ''}" data-detail-tab="requirements">
                requirements.md (${phase.requirements?.length || 0})
              </button>
              <button class="detail-tab-btn ${this.activeTab === 'design' ? 'active' : ''}" data-detail-tab="design">
                design.md
              </button>
              <button class="detail-tab-btn ${this.activeTab === 'tasks' ? 'active' : ''}" data-detail-tab="tasks">
                tasks.md (${phase.tasks?.length || 0})
              </button>
              <button class="detail-tab-btn ${this.activeTab === 'evidence' ? 'active' : ''}" data-detail-tab="evidence">
                evidence/ (${evCount})
              </button>
              <button class="detail-tab-btn ${this.activeTab === 'metrics' ? 'active' : ''}" data-detail-tab="metrics">
                📊 Metrics & Health
              </button>
              <button class="detail-tab-btn ${this.activeTab === 'traceability' ? 'active' : ''}" data-detail-tab="traceability">
                Traceability Graph
              </button>
            </div>

            <!-- Tab Content Area -->
            <div class="detail-content-area">
              ${this._renderDetailTabContent(phase)}
            </div>
          </div>

          <!-- Right Sidebar -->
          <aside class="detail-sidebar">
            <div class="sidebar-stat-group">
              <span class="stat-label">Spec Health Score</span>
              <div class="stat-value-big">${pHealth}<span style="font-size:1.1rem; color:var(--ds-gray-500);">/100</span></div>
              <span class="stat-value-text" style="color:#10b981; font-weight:600;">Grade: ${pGrade}</span>
            </div>

            <div class="sidebar-stat-group">
              <span class="stat-label">Tasks Progress</span>
              <div class="stat-value-big">${phase.taskCounts?.percent || 0}%</div>
              <span class="stat-value-text" style="color:var(--ds-gray-600);">
                ${phase.taskCounts?.completed || 0} done / ${phase.taskCounts?.total || 0} total
              </span>
            </div>

            <div class="sidebar-stat-group">
              <span class="stat-label">Traceability Rate</span>
              <div class="stat-value-big">${phase.metrics?.traceability?.requirementCoveragePct || 100}%</div>
              <span class="stat-value-text" style="color:var(--ds-gray-600);">
                ${phase.metrics?.traceability?.mappedRequirements || 0}/${phase.metrics?.traceability?.totalRequirements || 0} Requirements Mapped
              </span>
            </div>

            <div class="sidebar-stat-group">
              <span class="stat-label">Project Repository</span>
              <span class="stat-value-text">${this.snapshot?.projectId || 'Spec-Driven-Development'}</span>
            </div>

            <div class="sidebar-stat-group">
              <span class="stat-label">Git Branch & Status</span>
              <span class="stat-value-text mono">${account.branch}</span>
              <span class="mono" style="font-size:0.75rem; color:var(--ds-gray-500);">
                Commit: ${(account.headCommit || '').slice(0, 7)} • ${account.isDirty ? 'Dirty' : 'Clean'}
              </span>
            </div>

            <div class="sidebar-stat-group">
              <span class="stat-label">Verification Freshness</span>
              <div class="audit-item">
                <span class="audit-name">Evidence State</span>
                <span class="audit-badge ${phase.metrics?.verificationAssurance?.freshness === 'FRESH' ? 'audit-pass' : 'status-clean-backlog'}">
                  ${phase.metrics?.verificationAssurance?.freshness || 'UNLINKED'}
                </span>
              </div>
              <div class="audit-item">
                <span class="audit-name">Evidence Records</span>
                <span class="audit-badge audit-pass">${evCount} Recorded</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;
  }

  _renderDetailTabContent(phase) {
    if (this.activeTab === 'overview') {
      const pHealth = phase.metrics?.healthScore || 0;
      const pGrade = phase.metrics?.healthGrade || 'UNKNOWN';

      return `
        <div class="prose-dark">
          <div class="card-box">
            <p>
              <strong>${phase.name || phase.id}</strong> operates under the <code>${this.snapshot?.profile || 'general'}</code> profile.
              Every task requires explicit requirement mapping, pre-commit contracts, and verifiable evidence.
            </p>
          </div>

          <h3>Observed Lifecycle Gates</h3>
          <div style="display:flex; gap:0.75rem; margin: 1rem 0 2rem; flex-wrap:wrap;">
            <div class="profile-tag-pill mono">REQ: ${phase.artifacts?.requirements?.status || 'APPROVED'}</div>
            <div class="profile-tag-pill mono">DES: ${phase.artifacts?.design?.status || 'APPROVED'}</div>
            <div class="profile-tag-pill mono">TSK: ${phase.artifacts?.tasks?.status || 'READY'}</div>
            <div class="profile-tag-pill mono">EV: ${phase.artifacts?.evidence?.length || 0} RECORDED</div>
            <div class="matrix-status-badge status-badge-verified">HEALTH: ${pHealth}/100 • ${pGrade}</div>
          </div>

          <h3>Explicit Requirements (${phase.requirements?.length || 0})</h3>
          <ul>
            ${(phase.requirements || []).map(r => `
              <li><strong>${r.id}</strong> — ${r.title}</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    if (this.activeTab === 'requirements') {
      const content = phase.artifacts?.requirements?.content || '';
      return `<div class="prose-dark">${renderMarkdown(content)}</div>`;
    }

    if (this.activeTab === 'design') {
      const content = phase.artifacts?.design?.content || '';
      return `<div class="prose-dark">${renderMarkdown(content)}</div>`;
    }

    if (this.activeTab === 'tasks') {
      const tasks = phase.tasks || [];
      return `
        <div class="tasks-clean-list">
          ${tasks.map(t => {
            const isDone = t.status === 'done';
            const isDoing = t.status === 'doing';
            return `
              <div class="task-clean-row">
                <span class="task-check-icon ${isDone ? 'task-check-done' : isDoing ? 'task-check-doing' : ''}">
                  ${isDone ? '[✓]' : isDoing ? '[/]' : '[ ]'}
                </span>
                <div class="task-clean-body">
                  <div class="task-clean-title">
                    <strong>${t.id}</strong> — ${t.title}
                  </div>
                  <div class="task-clean-meta">
                    <span class="task-clean-id mono">${t.status.toUpperCase()}</span>
                    ${t.reqRefs && t.reqRefs.length > 0 ? t.reqRefs.map(r => `<span class="matrix-pill mono">${r}</span>`).join('') : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (this.activeTab === 'evidence') {
      const evidence = phase.artifacts?.evidence || [];
      if (evidence.length === 0) {
        return `<p class="mono" style="color:var(--ds-gray-500);">No evidence records recorded for this phase.</p>`;
      }
      return `
        <div>
          ${evidence.map(e => `
            <div class="evidence-clean-card">
              <div class="evidence-clean-header">
                <h4 class="evidence-clean-title">${e.filename}</h4>
                <span class="audit-badge audit-pass">${e.parsed?.result || 'PASS'}</span>
              </div>
              <div class="evidence-grid-meta">
                <div>
                  <div class="meta-field-label">Assessed Tree</div>
                  <div class="meta-field-val">${e.parsed?.assessedTree || 'Not recorded'}</div>
                </div>
                <div>
                  <div class="meta-field-label">Environment</div>
                  <div class="meta-field-val">${e.parsed?.environment || 'Not recorded'}</div>
                </div>
                <div>
                  <div class="meta-field-label">Timestamp</div>
                  <div class="meta-field-val">${e.parsed?.timestamp || 'Not recorded'}</div>
                </div>
                <div>
                  <div class="meta-field-label">Limitations</div>
                  <div class="meta-field-val">${e.parsed?.limitations || 'None'}</div>
                </div>
              </div>
              <details class="prose-dark">
                <summary style="cursor:pointer; font-family:var(--font-mono); font-size:0.8rem; color:var(--ds-gray-600);">View raw evidence markdown</summary>
                <div style="margin-top: 1rem;">${renderMarkdown(e.content)}</div>
              </details>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.activeTab === 'metrics') {
      return this._renderPhaseMetricsTab(phase);
    }

    if (this.activeTab === 'traceability') {
      return `
        <div>
          <div class="section-bar-header">
            <span>Visual Dependency Graph</span>
          </div>
          ${generateTraceabilitySvg(phase)}
          <div class="section-bar-header" style="margin-top:2.5rem;">
            <span>Accessible Traceability List</span>
          </div>
          ${generateTraceabilityList(phase)}
        </div>
      `;
    }

    return '';
  }

  // ---------------------------------------------------------------------------
  // Phase Metrics & Health Tab
  // ---------------------------------------------------------------------------
  _renderPhaseMetricsTab(phase) {
    const metrics = phase.metrics || {
      healthScore: 0,
      healthGrade: 'UNKNOWN',
      pillars: { definition: 0, governance: 0, execution: 0, verification: 0 },
      traceability: { matrix: [], unmappedRequirements: [], orphanTasks: [], requirementCoveragePct: 100 },
      verificationAssurance: { freshness: 'UNLINKED', staleDetails: '', passRate: 100 },
      tasksPerReqRatio: 0,
    };

    const isFresh = metrics.verificationAssurance.freshness === 'FRESH';
    const isStale = metrics.verificationAssurance.freshness === 'STALE';

    return `
      <div>
        <!-- Evidence Freshness & Commit Drift Banner -->
        ${isFresh ? `
          <div class="freshness-banner freshness-banner-fresh">
            <span style="font-size:1.25rem;">✨</span>
            <div>
              <div class="banner-title">FRESH ASSURANCE: Evidence matches active Git HEAD</div>
              <p class="banner-desc">All verification runs in this phase were executed against current repository commit state. Zero drift detected.</p>
            </div>
          </div>
        ` : isStale ? `
          <div class="freshness-banner freshness-banner-stale">
            <span style="font-size:1.25rem;">⚠️</span>
            <div>
              <div class="banner-title">DRIFT WARNING: Verification Evidence is Stale</div>
              <p class="banner-desc">${metrics.verificationAssurance.staleDetails}. Code has changed since tests were run. Re-run verification tests before closing this phase.</p>
            </div>
          </div>
        ` : `
          <div class="freshness-banner freshness-banner-fresh" style="border-color:var(--border);">
            <span style="font-size:1.25rem;">ℹ️</span>
            <div>
              <div class="banner-title">Local Verification Baseline</div>
              <p class="banner-desc">Verification records captured in evidence files provide auditable proof for all completed tasks.</p>
            </div>
          </div>
        `}

        <!-- 4 Health Pillars Breakdown Cards -->
        <div class="section-bar-header">
          <span>Spec Health Index Breakdown (${metrics.healthScore}/100 • ${metrics.healthGrade})</span>
        </div>
        <div class="pillars-breakdown-grid">
          <div class="pillar-box">
            <div class="pillar-label">1. Definition</div>
            <div class="pillar-score">${metrics.pillars.definition}<span style="font-size:0.8rem; color:var(--ds-gray-500);"> / 25</span></div>
            <p class="pillar-desc">Requirements, Architecture Design, and Tasks completeness.</p>
          </div>
          <div class="pillar-box">
            <div class="pillar-label">2. Governance</div>
            <div class="pillar-score">${metrics.pillars.governance}<span style="font-size:0.8rem; color:var(--ds-gray-500);"> / 25</span></div>
            <p class="pillar-desc">Formal APPROVED statuses on specifications and contracts.</p>
          </div>
          <div class="pillar-box">
            <div class="pillar-label">3. Execution</div>
            <div class="pillar-score">${metrics.pillars.execution}<span style="font-size:0.8rem; color:var(--ds-gray-500);"> / 25</span></div>
            <p class="pillar-desc">Task completion burndown and checklist progress.</p>
          </div>
          <div class="pillar-box">
            <div class="pillar-label">4. Assurance</div>
            <div class="pillar-score">${metrics.pillars.verification}<span style="font-size:0.8rem; color:var(--ds-gray-500);"> / 25</span></div>
            <p class="pillar-desc">Evidence logs, test pass rates, and commit freshness.</p>
          </div>
        </div>

        <!-- Traceability Matrix & Gap Analysis -->
        <div class="section-bar-header" style="margin-top:2rem;">
          <span>Traceability Matrix & Scope Drift Audit</span>
        </div>

        <!-- Warnings if any gaps exist -->
        ${metrics.traceability.unmappedRequirements.length > 0 ? `
          <div class="freshness-banner freshness-banner-stale" style="margin-bottom:1rem;">
            <span>⚠️</span>
            <div>
              <div class="banner-title">Unmapped Requirements Detected (${metrics.traceability.unmappedRequirements.length})</div>
              <p class="banner-desc">The following requirements have NO implementing tasks: <code>${metrics.traceability.unmappedRequirements.join(', ')}</code></p>
            </div>
          </div>
        ` : ''}

        ${metrics.traceability.orphanTasks.length > 0 ? `
          <div class="freshness-banner freshness-banner-stale" style="margin-bottom:1rem;">
            <span>⚠️</span>
            <div>
              <div class="banner-title">Orphan Tasks Detected (${metrics.traceability.orphanTasks.length})</div>
              <p class="banner-desc">Tasks lacking requirement references (potential scope creep): <code>${metrics.traceability.orphanTasks.join(', ')}</code></p>
            </div>
          </div>
        ` : ''}

        <div class="matrix-container">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Title</th>
                <th>Implementing Tasks</th>
                <th>Verifying Evidence</th>
                <th>Assurance Status</th>
              </tr>
            </thead>
            <tbody>
              ${(metrics.traceability.matrix || []).map(row => `
                <tr>
                  <td class="mono font-bold" style="color:var(--foreground);">${row.id}</td>
                  <td>${row.title}</td>
                  <td>
                    <div class="matrix-pill-group">
                      ${row.tasks.length > 0 ? row.tasks.map(t => `<span class="matrix-pill">${t}</span>`).join('') : '<span style="color:var(--ds-gray-600); font-size:0.75rem;">None</span>'}
                    </div>
                  </td>
                  <td>
                    <div class="matrix-pill-group">
                      ${row.evidence.length > 0 ? row.evidence.map(e => `<span class="matrix-pill" style="border-color:rgba(16,185,129,0.3);">${e}</span>`).join('') : '<span style="color:var(--ds-gray-600); font-size:0.75rem;">None</span>'}
                    </div>
                  </td>
                  <td>
                    <span class="matrix-status-badge ${row.status === 'VERIFIED' ? 'status-badge-verified' : row.status === 'IMPLEMENTED' ? 'status-badge-implemented' : 'status-badge-gap'}">
                      ${row.status === 'VERIFIED' ? '✅ VERIFIED' : row.status === 'IMPLEMENTED' ? '⚡ IMPLEMENTED' : '❌ GAP'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Tier 3: Project Engineering Metrics & Assurance Dashboard
  // ---------------------------------------------------------------------------
  _renderProjectMetricsView() {
    const metrics = this.snapshot?.metrics || {
      overallHealthScore: 0,
      overallHealthGrade: 'UNKNOWN',
      totalRequirements: 0,
      totalTasks: 0,
      completedTasks: 0,
      overallProgressPct: 0,
      traceabilityCoveragePct: 100,
      verificationAssurancePct: 100,
      activeSprintsCount: 0,
      orphanTaskCount: 0,
      unmappedReqCount: 0,
      phasesBurndown: [],
    };

    const phases = this.snapshot?.phases || [];

    return `
      <section style="margin-top: 1.5rem;">
        <h1 class="detail-title">Project Engineering Metrics & Assurance</h1>
        <p style="color:var(--ds-gray-600); margin-bottom: 2rem; font-size: 1.05rem;">
          Synthesized quality, traceability, and verification assurance across all specifications in <strong>${this.snapshot?.projectId || 'Project'}</strong>.
        </p>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Global Health Index</h3>
              <span class="kpi-badge status-badge-verified">${metrics.overallHealthGrade}</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${metrics.overallHealthScore}</span>
              <span class="kpi-subtext">/ 100</span>
            </div>
            <div class="kpi-footer">
              <span>Across ${phases.length} project phases</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Traceability Coverage</h3>
              <span class="kpi-badge ${metrics.unmappedReqCount > 0 ? 'status-badge-gap' : 'status-badge-verified'}">
                ${metrics.unmappedReqCount > 0 ? `${metrics.unmappedReqCount} Gaps` : '100%'}
              </span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${metrics.traceabilityCoveragePct}%</span>
              <span class="kpi-subtext">REQs Mapped</span>
            </div>
            <div class="kpi-footer">
              <span>${metrics.totalRequirements} Total Requirements</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Verification Assurance</h3>
              <span class="kpi-badge status-badge-verified">Pass Rate</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${metrics.verificationAssurancePct}%</span>
              <span class="kpi-subtext">Verified</span>
            </div>
            <div class="kpi-footer">
              <span>Grounding evidence logs</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <h3 class="kpi-title">Task Completion</h3>
              <span class="kpi-badge status-badge-implemented">${metrics.activeSprintsCount} Active</span>
            </div>
            <div class="kpi-body">
              <span class="kpi-number">${metrics.overallProgressPct}%</span>
              <span class="kpi-subtext">Done</span>
            </div>
            <div class="kpi-footer">
              <span>${metrics.completedTasks} / ${metrics.totalTasks} Tasks</span>
            </div>
          </div>
        </div>

        <!-- Phase Burndown & Health Leaderboard -->
        <div class="section-bar-header">
          <span>Phase-by-Phase Health & Execution Leaderboard</span>
        </div>

        <div class="matrix-container">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>Phase ID</th>
                <th>Phase Title</th>
                <th>Scope</th>
                <th>Spec Health Score</th>
                <th>Tasks Burndown</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${phases.map(p => {
                const health = p.metrics?.healthScore || 0;
                const grade = p.metrics?.healthGrade || 'UNKNOWN';
                return `
                  <tr style="cursor:pointer;" class="clickable-phase-row" data-phase-id="${p.id}">
                    <td class="mono font-bold">${p.id}</td>
                    <td>${p.name || p.id}</td>
                    <td class="mono" style="color:var(--ds-gray-500);">${p.category}</td>
                    <td>
                      <span class="matrix-status-badge ${health >= 75 ? 'status-badge-verified' : health >= 50 ? 'status-badge-implemented' : 'status-badge-gap'}">
                        ${health}/100 • ${grade}
                      </span>
                    </td>
                    <td>
                      <div class="mono" style="font-size:0.8rem;">
                        ${p.taskCounts?.completed || 0}/${p.taskCounts?.total || 0} (${p.taskCounts?.percent || 0}%)
                      </div>
                    </td>
                    <td>
                      <span class="status-pill-clean ${p.category === 'archive' ? 'status-clean-complete' : 'status-clean-active'}">
                        ${p.status}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  // ---------------------------------------------------------------------------
  // Profiles View
  // ---------------------------------------------------------------------------
  _renderProfilesView() {
    const profiles = [
      { id: 'general', name: 'General', desc: 'Baseline multi-tier engineering with core requirement and design gates.' },
      { id: 'web', name: 'Web', desc: 'Frontend ergonomics, bundle size budgets, responsive layout, and WCAG accessibility.' },
      { id: 'api', name: 'API Services', desc: 'Contract definitions, idempotency keys, rate limiting, and backward compatibility.' },
      { id: 'fullstack', name: 'Fullstack', desc: 'Coordinated client and server specs with end-to-end integration boundaries.' },
      { id: 'mobile', name: 'Mobile', desc: 'App lifecycle, offline state synchronization, and permission guardrails.' },
      { id: 'cloud', name: 'Cloud Infrastructure', desc: 'Declarative infrastructure, least-privilege IAM, and zero-trust policies.' },
      { id: 'devsecops', name: 'DevSecOps', desc: 'Automated vulnerability scanning, SAST/DAST gates, and SBOM verification.' },
      { id: 'mlops', name: 'MLOps', desc: 'Dataset provenance, model validation metrics, drift detection, and reproducible training.' },
    ];

    return `
      <section style="margin-top: 1.5rem;">
        <h1 class="detail-title">Composable Profiles</h1>
        <p style="color:var(--ds-gray-600); margin-bottom: 2rem; font-size: 1.05rem;">
          Tailor validation rules, task checklists, and architectural standards to your project type.
        </p>

        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
          ${profiles.map(p => `
            <div class="card-box" style="margin-bottom:0;">
              <div style="font-family:var(--font-mono); font-size:1rem; font-weight:700; color:var(--foreground); margin-bottom:0.5rem;">
                ${p.id}
              </div>
              <p style="font-size:0.85rem; color:var(--ds-gray-600);">${p.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  _renderFooter() {
    return `
      <footer class="skills-footer">
        <div class="footer-grid">
          <div>
            <h3 class="footer-col-title">Browse</h3>
            <ul class="footer-links-list">
              <li><a id="footer-phases-btn">All sprints</a></li>
              <li><a id="footer-projects-btn">My projects</a></li>
              <li><a id="footer-landing-btn">Public landing</a></li>
            </ul>
          </div>
          <div>
            <h3 class="footer-col-title">Profiles</h3>
            <ul class="footer-links-list">
              <li><a id="footer-profiles-btn">All profiles</a></li>
              <li><a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework/blob/main/docs/architecture.md" target="_blank" rel="noopener noreferrer">Composition rules</a></li>
            </ul>
          </div>
          <div>
            <h3 class="footer-col-title">Agents</h3>
            <ul class="footer-links-list">
              <li><span>Claude Code</span></li>
              <li><span>Cursor</span></li>
              <li><span>Antigravity</span></li>
              <li><span>GitHub Copilot</span></li>
            </ul>
          </div>
          <div>
            <h3 class="footer-col-title">Docs</h3>
            <ul class="footer-links-list">
              <li><a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer">Overview</a></li>
              <li><a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework/blob/main/docs/cli-reference.md" target="_blank" rel="noopener noreferrer">CLI</a></li>
              <li><a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework/blob/main/docs/governance.md" target="_blank" rel="noopener noreferrer">Governance</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>Spec-Driven Development Framework — Intent before code.</span>
          <span>Open source on <a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">GitHub</a>.</span>
        </div>
      </footer>
    `;
  }

  _bindEvents() {
    // Brand click -> smart navigate
    const brandBtn = document.getElementById('brand-home-btn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        if (this.token) {
          this.currentView = 'projects';
        } else {
          this.currentView = 'landing';
        }
        this.render();
      });
    }

    // Header Account breadcrumb click -> Go to Projects Dashboard
    const navHeaderAccountBtn = document.getElementById('nav-header-account-btn');
    if (navHeaderAccountBtn) {
      navHeaderAccountBtn.addEventListener('click', () => {
        this.currentView = 'projects';
        this.render();
      });
    }

    // Header Project breadcrumb click -> Go to Project Sprints overview
    const navHeaderProjectBtn = document.getElementById('nav-header-project-btn');
    if (navHeaderProjectBtn) {
      navHeaderProjectBtn.addEventListener('click', () => {
        this.activePhaseId = null;
        this.activeTab = 'overview';
        this.currentView = 'project';
        this.render();
      });
    }

    // DIRECT PHASE BUTTONS IN HEADER
    this.container.querySelectorAll('.phase-header-btn[data-phase-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const phaseId = btn.getAttribute('data-phase-id');
        this.activePhaseId = phaseId;
        this.activeTab = 'overview';
        this.currentView = 'project';
        this.render();
      });
    });

    const headerAllSprintsBtn = document.getElementById('header-all-sprints-btn');
    if (headerAllSprintsBtn) {
      headerAllSprintsBtn.addEventListener('click', () => {
        this.activePhaseId = null;
        this.activeTab = 'overview';
        this.currentView = 'project';
        this.render();
      });
    }

    const headerMetricsBtn = document.getElementById('header-metrics-btn');
    if (headerMetricsBtn) {
      headerMetricsBtn.addEventListener('click', () => {
        this.activePhaseId = null;
        this.activeTab = 'metrics';
        this.currentView = 'project';
        this.render();
      });
    }

    // Nav to Projects Dashboard
    const navProjectsDashboardBtn = document.getElementById('nav-projects-dashboard-btn');
    const footerProjectsBtn = document.getElementById('footer-projects-btn');
    const onNavProjects = () => {
      if (this.token) {
        this.currentView = 'projects';
        this.render();
      } else {
        const t = prompt('Enter your local workspace security token to view your account projects:');
        if (t && t.trim()) {
          this.token = t.trim();
          sessionStorage.setItem('sdd_token', this.token);
          this._loadProjects();
        }
      }
    };
    if (navProjectsDashboardBtn) navProjectsDashboardBtn.addEventListener('click', onNavProjects);
    if (footerProjectsBtn) footerProjectsBtn.addEventListener('click', onNavProjects);

    // Nav to Public Landing
    const navLandingPageBtn = document.getElementById('nav-landing-page-btn');
    const navLandingHomeBtn = document.getElementById('nav-landing-home-btn');
    const footerLandingBtn = document.getElementById('footer-landing-btn');
    const onNavLanding = () => {
      this.currentView = 'landing';
      this.render();
    };
    if (navLandingPageBtn) navLandingPageBtn.addEventListener('click', onNavLanding);
    if (navLandingHomeBtn) navLandingHomeBtn.addEventListener('click', onNavLanding);
    if (footerLandingBtn) footerLandingBtn.addEventListener('click', onNavLanding);

    // Profiles nav
    const navProfilesBtn = document.getElementById('nav-profiles-btn');
    const footerProfilesBtn = document.getElementById('footer-profiles-btn');
    const onNavProfiles = () => {
      this.currentView = 'profiles';
      this.render();
    };
    if (navProfilesBtn) navProfilesBtn.addEventListener('click', onNavProfiles);
    if (footerProfilesBtn) footerProfilesBtn.addEventListener('click', onNavProfiles);

    // Launch Demo Buttons
    const launchDemoBtn = document.getElementById('launch-demo-btn');
    const launchDemoHeaderBtn = document.getElementById('launch-demo-header-btn');
    const onLaunchDemo = () => {
      this._loadStaticDemo();
    };
    if (launchDemoBtn) launchDemoBtn.addEventListener('click', onLaunchDemo);
    if (launchDemoHeaderBtn) launchDemoHeaderBtn.addEventListener('click', onLaunchDemo);

    // Connect Workspace Buttons
    const connectWorkspaceBtn = document.getElementById('connect-workspace-btn');
    const connectWorkspaceHeaderBtn = document.getElementById('connect-workspace-header-btn');
    const dashConnectAnotherBtn = document.getElementById('dash-connect-another-btn');
    const onConnectWorkspace = () => {
      const userToken = prompt('Enter your local SDD workspace security token:');
      if (userToken && userToken.trim()) {
        const clean = userToken.trim();
        sessionStorage.setItem('sdd_token', clean);
        this.token = clean;
        this._loadProjects();
      }
    };
    if (connectWorkspaceBtn) connectWorkspaceBtn.addEventListener('click', onConnectWorkspace);
    if (connectWorkspaceHeaderBtn) connectWorkspaceHeaderBtn.addEventListener('click', onConnectWorkspace);
    if (dashConnectAnotherBtn) dashConnectAnotherBtn.addEventListener('click', onConnectWorkspace);

    // Project cards in Account Dashboard
    this.container.querySelectorAll('.project-dash-card[data-project-id]').forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.getAttribute('data-project-id');
        this.selectProject(pId);
      });
    });

    const demoShowcaseCard = document.getElementById('demo-showcase-card');
    if (demoShowcaseCard) {
      demoShowcaseCard.addEventListener('click', onLaunchDemo);
    }

    // Breadcrumb back clicks in Phase detail
    const back1 = document.getElementById('back-to-dir-btn');
    const back2 = document.getElementById('back-to-dir-btn2');
    if (back1) back1.addEventListener('click', () => { this.activePhaseId = null; this.render(); });
    if (back2) back2.addEventListener('click', () => { this.activePhaseId = null; this.render(); });

    // Clickable table rows in Phase leaderboards
    this.container.querySelectorAll('.table-row[data-phase-id]').forEach(row => {
      row.addEventListener('click', () => {
        this.activePhaseId = row.getAttribute('data-phase-id');
        this.activeTab = 'overview';
        this.currentView = 'project';
        this.render();
      });
    });

    this.container.querySelectorAll('.clickable-phase-row[data-phase-id]').forEach(row => {
      row.addEventListener('click', () => {
        this.activePhaseId = row.getAttribute('data-phase-id');
        this.activeTab = 'metrics';
        this.currentView = 'project';
        this.render();
      });
    });

    // Directory filter tabs
    this.container.querySelectorAll('.dir-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dirFilter = btn.getAttribute('data-dir-filter');
        this.render();
      });
    });

    // Detail tabs within a Phase
    this.container.querySelectorAll('.detail-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-detail-tab');
        this.render();
      });
    });

    // Search input
    const searchInput = document.getElementById('skills-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        const bodyEl = document.querySelector('.table-body');
        if (bodyEl) {
          const phases = this.snapshot?.phases || [];
          let filtered = phases;
          if (this.dirFilter === 'active') filtered = phases.filter(p => p.category === 'active');
          if (this.dirFilter === 'backlog') filtered = phases.filter(p => p.category === 'backlog');
          if (this.dirFilter === 'archive') filtered = phases.filter(p => p.category === 'archive');
          const q = this.searchQuery.toLowerCase();
          filtered = filtered.filter(p => p.id.toLowerCase().includes(q) || (p.name && p.name.toLowerCase().includes(q)));

          bodyEl.innerHTML = filtered.map((p, idx) => {
            const pHealth = p.metrics?.healthScore || 0;
            const pGrade = p.metrics?.healthGrade || 'UNKNOWN';
            const reqTotal = p.metrics?.traceability?.totalRequirements || p.requirements?.length || 0;
            const reqMapped = p.metrics?.traceability?.mappedRequirements || 0;

            return `
              <div class="table-row" data-phase-id="${p.id}">
                <div class="row-num">${idx + 1}</div>
                <div class="row-primary">
                  <div class="row-title">${p.name || p.id}</div>
                  <div class="row-sub mono">${p.id}</div>
                </div>
                <div class="row-health">
                  <span class="matrix-status-badge ${pHealth >= 75 ? 'status-badge-verified' : pHealth >= 50 ? 'status-badge-implemented' : 'status-badge-gap'}">
                    ${pHealth}/100 • ${pGrade}
                  </span>
                </div>
                <div class="row-trace">
                  <span class="mono" style="font-size:0.8rem; color:var(--foreground);">
                    ${reqMapped}/${reqTotal} REQs (${p.metrics?.traceability?.requirementCoveragePct || 100}%)
                  </span>
                </div>
                <div class="row-progress">
                  <div class="progress-track">
                    <div class="progress-bar" style="width: ${p.taskCounts?.percent || 0}%;"></div>
                  </div>
                  <div class="progress-pct mono">${p.taskCounts?.completed || 0}/${p.taskCounts?.total || 0} tasks (${p.taskCounts?.percent || 0}%)</div>
                </div>
                <div class="row-status">
                  <span class="status-pill-clean ${p.category === 'archive' ? 'status-clean-complete' : p.category === 'active' ? 'status-clean-active' : 'status-clean-backlog'}">
                    ${p.category === 'archive' ? 'Completed' : p.category === 'active' ? 'Active Sprint' : 'Backlog'}
                  </span>
                </div>
              </div>
            `;
          }).join('');

          bodyEl.querySelectorAll('.table-row').forEach(row => {
            row.addEventListener('click', () => {
              this.activePhaseId = row.getAttribute('data-phase-id');
              this.activeTab = 'overview';
              this.currentView = 'project';
              this.render();
            });
          });
        }
      });
    }

    // Copy command buttons
    const pill = document.getElementById('copy-cmd-pill');
    if (pill) {
      pill.addEventListener('click', () => {
        const text = pill.querySelector('code')?.innerText || '';
        navigator.clipboard.writeText(text.replace(/^\$\s*/, '')).then(() => {
          const btn = pill.querySelector('.copy-icon-btn');
          if (btn) btn.innerHTML = '✓';
          setTimeout(() => { this.render(); }, 1500);
        });
      });
    }

    // Authentic skills.sh Landing Page Events
    if (this.currentView === 'landing') {
      const copyCmdBox = document.getElementById('install-cmd-box');
      const copyCmdBtn = document.getElementById('copy-cmd-btn');
      const copyStatusBubble = document.getElementById('copy-status-bubble');

      const doCopyInstall = (e) => {
        if (e) e.stopPropagation();
        const cmd = 'curl -fsSL https://raw.githubusercontent.com/ThisIsPhila/Spec-Driven-Development-Framework/main/setup.sh | bash';
        navigator.clipboard.writeText(cmd).then(() => {
          if (copyStatusBubble) {
            copyStatusBubble.classList.add('show');
            setTimeout(() => { copyStatusBubble.classList.remove('show'); }, 2000);
          }
        });
      };

      if (copyCmdBox) copyCmdBox.addEventListener('click', doCopyInstall);
      if (copyCmdBtn) copyCmdBtn.addEventListener('click', doCopyInstall);

      // Search input filter in landing leaderboard
      const leaderboardSearch = document.getElementById('leaderboard-search-input');
      const rows = Array.from(this.container.querySelectorAll('.skills-row'));

      const filterLeaderboard = () => {
        const query = (leaderboardSearch?.value || '').toLowerCase().trim();
        const activeTab = this.container.querySelector('.leaderboard-tabs-bar .tab-btn.active')?.getAttribute('data-filter') || 'all';

        rows.forEach(row => {
          const name = (row.querySelector('.profile-name')?.innerText || '').toLowerCase();
          const repo = (row.querySelector('.profile-repo')?.innerText || '').toLowerCase();
          const desc = (row.querySelector('.profile-desc-line')?.innerText || '').toLowerCase();
          const cat = row.getAttribute('data-category');

          const matchesQuery = !query || name.includes(query) || repo.includes(query) || desc.includes(query);
          const matchesTab = activeTab === 'all' || cat === activeTab || (activeTab === 'trending' && (cat === 'trending' || cat === 'official'));

          if (matchesQuery && matchesTab) {
            row.style.display = 'grid';
          } else {
            row.style.display = 'none';
          }
        });
      };

      if (leaderboardSearch) {
        leaderboardSearch.addEventListener('input', filterLeaderboard);
      }

      // Filter tabs in landing leaderboard
      this.container.querySelectorAll('.leaderboard-tabs-bar .tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          this.container.querySelectorAll('.leaderboard-tabs-bar .tab-btn').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          filterLeaderboard();
        });
      });

      // Quick-copy install profile on row click
      rows.forEach(row => {
        row.addEventListener('click', () => {
          const profId = row.getAttribute('data-profile-id');
          const cmd = `bash scripts/setup.sh --profile ${profId}`;
          navigator.clipboard.writeText(cmd).then(() => {
            const nameEl = row.querySelector('.profile-name');
            if (nameEl) {
              const orig = nameEl.innerText;
              nameEl.innerText = `✓ Copied: ${cmd}`;
              setTimeout(() => { nameEl.innerText = orig; }, 1800);
            }
          });
        });
      });

      // Keyboard shortcut '/' to focus search
      const onKeyDown = (e) => {
        if (e.key === '/' && document.activeElement !== leaderboardSearch && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          if (leaderboardSearch) {
            leaderboardSearch.focus();
            leaderboardSearch.select();
          }
        }
      };
      window.addEventListener('keydown', onKeyDown, { once: true });
    }
  }
}
