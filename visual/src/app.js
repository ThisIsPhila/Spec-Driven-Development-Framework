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

    // View Routing: 'landing' | 'directory' | 'phase-detail' | 'metrics' | 'profiles'
    this.currentView = this.token ? 'directory' : 'landing';
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
        // Fall back to public demo
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
    }];
    this.currentProjectId = demoSnapshot.projectId;
    this.snapshot = demoSnapshot;
    this.connectionStatus = 'demo';
    this.currentView = 'directory';
    this.render();
  }

  async selectProject(projectId) {
    this.currentProjectId = projectId;
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

    const isLanding = this.currentView === 'landing';
    const hasActiveToken = Boolean(this.token);

    this.container.innerHTML = `
      <div class="skills-layout">
        ${isLanding && hasActiveToken ? `
          <div style="background:rgba(6,182,212,0.1); border-bottom:1px solid rgba(6,182,212,0.25); padding:0.5rem 1.5rem; display:flex; justify-content:space-between; align-items:center; font-family:var(--font-mono); font-size:0.75rem; color:#06b6d4;">
            <span>🌐 <strong>Public Landing Preview</strong>: Real project and account details are isolated and hidden from public view.</span>
            <button id="return-workspace-banner-btn" class="preview-mode-tag">← Return to Workspace</button>
          </div>
        ` : ''}

        <!-- Header -->
        <header class="skills-header">
          <div class="header-brand" id="brand-home-btn" style="cursor:pointer;">
            <svg data-testid="geist-icon" height="18" stroke-linejoin="round" viewBox="0 0 16 16" width="18" style="color:currentcolor">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1L16 15H0L8 1Z" fill="currentColor"></path>
            </svg>
            <span class="header-slash">/</span>
            <span class="font-mono">SDD</span>
          </div>

          ${this._renderHeaderContext()}

          <nav class="header-nav" aria-label="Primary navigation">
            ${this._renderHeaderNav()}
          </nav>

          <div class="header-right">
            ${this._renderStatusBadge()}
          </div>
        </header>

        <!-- Main Page Container -->
        <main class="page-container">
          ${this._renderCurrentView()}
          ${this._renderFooter()}
        </main>
      </div>
    `;

    this._bindEvents();

    if (this.currentView === 'phase-detail' && this.activeTab === 'design') {
      renderMermaidBlocks(this.container);
    }
  }

  _renderHeaderContext() {
    if (this.currentView === 'landing' && !this.token) {
      return '';
    }

    const account = this.snapshot?.account || {
      name: 'Local Developer',
      email: '',
      branch: 'main',
      headCommit: '',
      isDirty: false,
      dirtyCount: 0,
    };

    const projectName = this.snapshot?.projectId || 'Project';

    return `
      <div class="header-context-row">
        <!-- Project Pill -->
        <div class="context-pill" title="Project: ${projectName}">
          <span class="icon">📁</span>
          <span class="font-bold">${projectName}</span>
        </div>

        <!-- Git Branch & Clean/Dirty Pill -->
        <div class="context-pill" title="Branch: ${account.branch} (${account.headCommit ? account.headCommit.slice(0, 7) : 'head'})">
          <span class="icon">🌿</span>
          <span>${account.branch}</span>
          <span style="color:var(--ds-gray-500); font-size:0.7rem;">(${account.headCommit ? account.headCommit.slice(0, 7) : 'local'})</span>
          <span class="${account.isDirty ? 'dirty-dot' : 'clean-dot'}" title="${account.isDirty ? `${account.dirtyCount} modified file(s)` : 'Working tree clean'}"></span>
        </div>

        <!-- Account Pill -->
        <div class="context-pill" title="${account.email ? `User: ${account.name} <${account.email}>` : `User: ${account.name}`}">
          <span class="icon">👤</span>
          <span>${account.name}</span>
        </div>
      </div>
    `;
  }

  _renderHeaderNav() {
    if (this.currentView === 'landing' && !this.token) {
      return `
        <a class="nav-link active" id="nav-landing-home-btn">Overview</a>
        <a class="nav-link" id="nav-profiles-btn">Profiles</a>
        <a class="nav-link" href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer">Docs ↗</a>
      `;
    }

    return `
      <a class="nav-link ${this.currentView === 'directory' ? 'active' : ''}" id="nav-dir-btn">Phases</a>
      <a class="nav-link" id="nav-sprints-btn">Active Sprints</a>
      <a class="nav-link ${this.currentView === 'metrics' ? 'active' : ''}" id="nav-metrics-btn">📊 Metrics & Health</a>
      <a class="nav-link ${this.currentView === 'profiles' ? 'active' : ''}" id="nav-profiles-btn">Profiles</a>
      <a class="nav-link ${this.currentView === 'landing' ? 'active' : ''}" id="nav-landing-preview-btn" title="Inspect sanitized Public Landing view">🌐 Public Landing</a>
      <a class="nav-link" href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer">Docs ↗</a>
    `;
  }

  _renderStatusBadge() {
    if (this.currentView === 'landing' && !this.token) {
      return `
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <button class="btn btn-secondary" id="launch-demo-header-btn" style="padding:0.25rem 0.6rem; font-size:0.75rem; font-family:var(--font-mono);">
            Demo Sandbox
          </button>
          <button class="btn btn-primary" id="connect-workspace-header-btn" style="padding:0.25rem 0.6rem; font-size:0.75rem; font-family:var(--font-mono);">
            Connect Local
          </button>
        </div>
      `;
    }

    const rev = (this.snapshot?.contentRevision || '').slice(0, 7) || 'local';
    if (this.connectionStatus === 'live') {
      return `<div class="live-badge" title="Live Server-Sent Events sync"><span class="live-dot"></span> LIVE • ${rev}</div>`;
    }
    if (this.connectionStatus === 'demo') {
      return `<div class="live-badge" title="Synthetic Showcase Dataset"><span class="live-dot demo"></span> DEMO</div>`;
    }
    if (this.connectionStatus === 'polling') {
      return `<div class="live-badge" title="Polling every 2 seconds"><span class="live-dot demo"></span> POLL • ${rev}</div>`;
    }
    return `<div class="live-badge" title="Offline"><span class="live-dot offline"></span> OFFLINE</div>`;
  }

  _updateStatusBar() {
    const el = document.querySelector('.header-right');
    if (el) el.innerHTML = this._renderStatusBadge();
  }

  _renderCurrentView() {
    if (this.currentView === 'landing') {
      return renderLandingView();
    }
    if (this.currentView === 'phase-detail') {
      return this._renderPhaseDetailView();
    }
    if (this.currentView === 'metrics') {
      return this._renderProjectMetricsView();
    }
    if (this.currentView === 'profiles') {
      return this._renderProfilesView();
    }
    return this._renderDirectoryView();
  }

  // ---------------------------------------------------------------------------
  // 1. Directory View (skills.sh Home Leaderboard + Actionable KPI Bar)
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
      <!-- Hero Section (skills.sh grid) -->
      <section class="hero-grid">
        <div class="hero-ascii-col">
          <pre class="ascii-banner" aria-hidden="true"> ██████╗ ██████╗ ██████╗ 
██╔════╝ ██╔══██╗██╔══██╗
╚█████╗  ██║  ██║██║  ██║
 ╚═══██╗ ██║  ██║██║  ██║
██████╔╝ ██████╔╝██████╔╝
╚═════╝  ╚═════╝ ╚═════╝ </pre>
          <p class="ascii-kicker">THE OPEN SPEC-DRIVEN ECOSYSTEM</p>
        </div>

        <div class="hero-desc-col">
          <p class="hero-headline">
            <strong>Specifications define intent before code.</strong> Local git guardrails and evidence verification prevent autonomous agent drift.
          </p>

          <div>
            <div class="section-label-kicker">Try it now</div>
            <div class="command-pill" id="copy-cmd-pill">
              <code><span class="prompt">$</span>bash scripts/phase.sh start &lt;phase&gt;</code>
              <button class="copy-icon-btn" title="Copy command">
                <svg viewBox="0 0 16 16" height="14" width="14" fill="currentColor">
                  <path fill-rule="evenodd" d="M2.75.5C1.78.5 1 1.28 1 2.25v7.5c0 .97.78 1.75 1.75 1.75H4.5V10H2.75a.25.25 0 0 1-.25-.25v-7.5c0-.14.11-.25.25-.25h5.5c.14 0 .25.11.25.25V3H10v-.75C10 1.28 9.22.5 8.25.5zm5 4C6.78 4.5 6 5.28 6 6.25v7.5c0 .97.78 1.75 1.75 1.75h5.5c.97 0 1.75-.78 1.75-1.75v-7.5c0-.97-.78-1.75-1.75-1.75zM7.5 6.25c0-.14.11-.25.25-.25h5.5c.14 0 .25.11.25.25v7.5q-.02.23-.25.25h-5.5a.25.25 0 0 1-.25-.25z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="agents-section">
            <div class="section-label-kicker">Compatible with these agents</div>
            <div class="agents-row">
              <span class="agent-tag">Claude Code</span>
              <span class="agent-tag">Cursor</span>
              <span class="agent-tag">Antigravity</span>
              <span class="agent-tag">GitHub Copilot</span>
              <span class="agent-tag">Gemini</span>
              <span class="agent-tag">Windsurf</span>
              <span class="agent-tag">Codex</span>
              <span class="agent-tag">Cline</span>
              <span class="agent-tag">OpenCode</span>
            </div>
          </div>
        </div>
      </section>

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

      <!-- Directory / Leaderboard Section -->
      <section class="directory-section">
        <div class="directory-header">
          <h2 class="directory-title">Phases & Specifications Directory</h2>
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
            const evCount = p.artifacts?.evidence?.length || 0;

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
  // 2. Phase Detail View (With Dedicated Metrics & Health Tab)
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
          <a id="back-to-dir-btn">phases</a>
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
              <span class="stat-label">Signed In As</span>
              <span class="stat-value-text">${account.name}</span>
              ${account.email ? `<span class="mono" style="font-size:0.75rem; color:var(--ds-gray-500);">${account.email}</span>` : ''}
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
  // 3. Dedicated Metrics & Health Tab (Actionable Engineering Insights)
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
  // 4. Project-Wide Metrics & Health Dashboard View
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
  // 5. Profiles View
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
              <li><a id="footer-phases-btn">All phases</a></li>
              <li><a id="footer-sprints-btn">Active sprints</a></li>
              <li><a id="footer-archive-btn">Archive</a></li>
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
          <span>Made for autonomous & pair engineering.</span>
          <span>Open source on <a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">GitHub</a>.</span>
        </div>
      </footer>
    `;
  }

  _bindEvents() {
    // Brand click -> home
    const brandBtn = document.getElementById('brand-home-btn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        if (this.token) {
          this.currentView = 'directory';
        } else {
          this.currentView = 'landing';
        }
        this.render();
      });
    }

    const navDirBtn = document.getElementById('nav-dir-btn');
    if (navDirBtn) {
      navDirBtn.addEventListener('click', () => {
        this.currentView = 'directory';
        this.dirFilter = 'all';
        this.render();
      });
    }

    const navSprintsBtn = document.getElementById('nav-sprints-btn');
    if (navSprintsBtn) {
      navSprintsBtn.addEventListener('click', () => {
        this.currentView = 'directory';
        this.dirFilter = 'active';
        this.render();
      });
    }

    const navMetricsBtn = document.getElementById('nav-metrics-btn');
    if (navMetricsBtn) {
      navMetricsBtn.addEventListener('click', () => {
        this.currentView = 'metrics';
        this.render();
      });
    }

    const navProfilesBtn = document.getElementById('nav-profiles-btn');
    if (navProfilesBtn) {
      navProfilesBtn.addEventListener('click', () => {
        this.currentView = 'profiles';
        this.render();
      });
    }

    const navLandingPreviewBtn = document.getElementById('nav-landing-preview-btn');
    if (navLandingPreviewBtn) {
      navLandingPreviewBtn.addEventListener('click', () => {
        this.currentView = 'landing';
        this.render();
      });
    }

    const returnWorkspaceBannerBtn = document.getElementById('return-workspace-banner-btn');
    if (returnWorkspaceBannerBtn) {
      returnWorkspaceBannerBtn.addEventListener('click', () => {
        this.currentView = 'directory';
        this.render();
      });
    }

    const navLandingHomeBtn = document.getElementById('nav-landing-home-btn');
    if (navLandingHomeBtn) {
      navLandingHomeBtn.addEventListener('click', () => {
        this.currentView = 'landing';
        this.render();
      });
    }

    // Launch Demo Buttons
    const launchDemoBtn = document.getElementById('launch-demo-btn');
    const launchDemoHeaderBtn = document.getElementById('launch-demo-header-btn');
    const launchDemoNavBtn = document.getElementById('launch-demo-nav-btn');
    const onLaunchDemo = () => {
      this._loadStaticDemo();
    };
    if (launchDemoBtn) launchDemoBtn.addEventListener('click', onLaunchDemo);
    if (launchDemoHeaderBtn) launchDemoHeaderBtn.addEventListener('click', onLaunchDemo);
    if (launchDemoNavBtn) launchDemoNavBtn.addEventListener('click', onLaunchDemo);

    // Connect Workspace Buttons
    const connectWorkspaceBtn = document.getElementById('connect-workspace-btn');
    const connectWorkspaceHeaderBtn = document.getElementById('connect-workspace-header-btn');
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

    // Breadcrumb back clicks
    const back1 = document.getElementById('back-to-dir-btn');
    const back2 = document.getElementById('back-to-dir-btn2');
    if (back1) back1.addEventListener('click', () => { this.currentView = 'directory'; this.render(); });
    if (back2) back2.addEventListener('click', () => { this.currentView = 'directory'; this.render(); });

    // Clickable table rows in Project Metrics view
    this.container.querySelectorAll('.clickable-phase-row').forEach(row => {
      row.addEventListener('click', () => {
        this.activePhaseId = row.getAttribute('data-phase-id');
        this.currentView = 'phase-detail';
        this.activeTab = 'metrics';
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
              this.currentView = 'phase-detail';
              this.render();
            });
          });
        }
      });
    }

    // Directory filter tabs
    this.container.querySelectorAll('.dir-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dirFilter = btn.getAttribute('data-dir-filter');
        this.render();
      });
    });

    // Directory table rows -> open phase detail
    this.container.querySelectorAll('.table-row').forEach(row => {
      row.addEventListener('click', () => {
        this.activePhaseId = row.getAttribute('data-phase-id');
        this.currentView = 'phase-detail';
        this.render();
      });
    });

    // Detail tabs
    this.container.querySelectorAll('.detail-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-detail-tab');
        this.render();
      });
    });

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
  }
}
