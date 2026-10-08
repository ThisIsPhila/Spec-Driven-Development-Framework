import { renderOverviewView } from './views/overviewView.js';
import { renderSpecView } from './views/specView.js';
import { renderEvidenceView } from './views/evidenceView.js';
import { renderRelationshipsView } from './views/relationshipsView.js';
import { renderLandingView } from './views/landingView.js';
import { renderMermaidBlocks } from './diagrams.js';

export class SDDWorkspaceApp {
  constructor(containerId = 'app') {
    this.container = document.getElementById(containerId);
    this.token = this._resolveToken();
    this.viewMode = this.token ? 'workspace' : 'landing'; // 'landing' | 'workspace'
    this.projects = [];
    this.currentProjectId = null;
    this.snapshot = null;
    this.activePhaseId = null;
    this.activeTab = 'overview'; // 'overview' | 'requirements' | 'design' | 'tasks' | 'evidence' | 'relationships'
    this.taskFilter = 'all';
    this.relMode = 'svg';
    this.connectionStatus = 'connecting'; // 'live' | 'polling' | 'stale' | 'demo'
    this.sseSource = null;
    this.pollTimer = null;
    this.lastUpdateTime = null;
  }

  _resolveToken() {
    // 1. Check URL fragment (#token=xyz)
    const hash = window.location.hash;
    const hashMatch = hash.match(/token=([a-f0-9]+)/i);
    if (hashMatch) {
      const token = hashMatch[1];
      sessionStorage.setItem('sdd_token', token);
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return token;
    }

    // 2. Check query string (?token=xyz)
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token');
    if (queryToken) {
      sessionStorage.setItem('sdd_token', queryToken);
      return queryToken;
    }

    // 3. Check sessionStorage
    return sessionStorage.getItem('sdd_token') || '';
  }

  async init() {
    this._renderSkeleton();
    await this._loadProjects();
    this._setupVisibilityListener();
  }

  async _loadProjects() {
    if (this.token) {
      try {
        const res = await fetch(`/api/projects?token=${encodeURIComponent(this.token)}`);
        if (res.ok) {
          this.projects = await res.json();
          if (this.projects.length > 0) {
            this.viewMode = 'workspace';
            await this.selectProject(this.projects[0].id);
            return;
          }
        }
      } catch {
        // Fall through to demo loader
      }
    }

    // If no token or fetch failed, prepare static demo dataset
    await this._loadStaticDemo();
  }

  async _loadStaticDemo() {
    try {
      const res = await fetch('/demo/demo-project.json');
      if (res.ok) {
        const demoSnapshot = await res.json();
        this.projects = [{
          id: demoSnapshot.projectId,
          name: demoSnapshot.projectId,
          profile: demoSnapshot.profile,
          activePhaseId: demoSnapshot.activePhaseId,
        }];
        this.currentProjectId = demoSnapshot.projectId;
        this.snapshot = demoSnapshot;
        this.connectionStatus = 'demo';
        this._selectInitialPhase();
        this.render();
        return;
      }
    } catch {
      // Demo fetch error
    }

    if (this.viewMode === 'workspace') {
      this.connectionStatus = 'stale';
      this._renderError('Could not connect to SDD local server. Make sure `npm run workspace` is running.');
    } else {
      this.render();
    }
  }

  async selectProject(projectId) {
    this.currentProjectId = projectId;
    await this._fetchSnapshot();
    this._selectInitialPhase();
    this._connectSSE();
    this._startPolling();
    this.render();
  }

  _selectInitialPhase() {
    if (!this.snapshot) return;
    const activeId = this.snapshot.activePhaseId;
    const hasActive = this.snapshot.phases?.some(p => p.id === activeId);
    if (hasActive) {
      this.activePhaseId = activeId;
    } else if (this.snapshot.phases?.length > 0) {
      this.activePhaseId = this.snapshot.phases[0].id;
    }
  }

  async _fetchSnapshot() {
    if (this.connectionStatus === 'demo') return;
    try {
      const res = await fetch(`/api/project/${this.currentProjectId}/snapshot?token=${encodeURIComponent(this.token)}`);
      if (res.ok) {
        const data = await res.json();
        const prevRevision = this.snapshot?.contentRevision;
        this.snapshot = data;
        this.lastUpdateTime = new Date();

        if (this.connectionStatus !== 'live') {
          this.connectionStatus = 'polling';
        }

        if (prevRevision && prevRevision !== data.contentRevision && this.viewMode === 'workspace') {
          this._softRerender();
        }
      } else {
        this.connectionStatus = 'stale';
        this._updateStatusBar();
      }
    } catch {
      this.connectionStatus = 'stale';
      this._updateStatusBar();
    }
  }

  _connectSSE() {
    if (this.connectionStatus === 'demo') return;
    if (this.sseSource) {
      this.sseSource.close();
    }

    try {
      const sseUrl = `/api/project/${this.currentProjectId}/events?token=${encodeURIComponent(this.token)}`;
      this.sseSource = new EventSource(sseUrl);

      this.sseSource.onopen = () => {
        this.connectionStatus = 'live';
        this._updateStatusBar();
      };

      this.sseSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'update' && msg.snapshot) {
            this.snapshot = msg.snapshot;
            this.lastUpdateTime = new Date();
            this.connectionStatus = 'live';
            if (this.viewMode === 'workspace') {
              this._softRerender();
            }
          }
        } catch (err) {
          console.warn('Failed parsing SSE update message:', err);
        }
      };

      this.sseSource.onerror = () => {
        if (this.connectionStatus === 'live') {
          this.connectionStatus = 'polling';
          this._updateStatusBar();
        }
      };
    } catch {
      this.connectionStatus = 'polling';
      this._updateStatusBar();
    }
  }

  _startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && this.viewMode === 'workspace') {
        this._fetchSnapshot();
      }
    }, 2000);
  }

  _setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.viewMode === 'workspace') {
        this._fetchSnapshot();
      }
    });
  }

  _softRerender() {
    const scrollY = window.scrollY;
    this.render();
    window.scrollTo(0, scrollY);
  }

  getActivePhase() {
    if (!this.snapshot?.phases) return null;
    return this.snapshot.phases.find(p => p.id === this.activePhaseId) || this.snapshot.phases[0] || null;
  }

  render() {
    if (!this.container) return;

    if (this.viewMode === 'landing') {
      this.container.innerHTML = `
        <div class="landing-layout">
          <header class="workspace-header">
            <div class="header-left">
              <div class="brand">
                <span class="brand-icon">⚡</span>
                <span class="brand-name">SDD Framework</span>
              </div>
            </div>
            <div class="header-right">
              <button id="nav-demo-btn" class="btn btn-secondary btn-sm">
                Explore Demo Cockpit
              </button>
              <a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer" class="link-muted">
                GitHub ↗
              </a>
            </div>
          </header>
          <main class="landing-main">
            ${renderLandingView()}
          </main>
        </div>
      `;
      this._bindLandingEvents();
      return;
    }

    // Workspace Mode
    const phase = this.getActivePhase();

    this.container.innerHTML = `
      <div class="workspace-layout">
        <!-- Top Navbar -->
        <header class="workspace-header">
          <div class="header-left">
            <div class="brand">
              <span class="brand-icon">⚡</span>
              <span class="brand-name">SDD Workspace</span>
            </div>
            <button id="nav-landing-btn" class="btn-text">
              ← Home / Docs
            </button>
            ${this._renderProjectSelector()}
          </div>

          <div class="header-right">
            <div id="status-badge-container">
              ${this._getStatusBadgeHtml()}
            </div>
            <span class="readonly-pill">Read-only Cockpit</span>
          </div>
        </header>

        <div class="workspace-body">
          <!-- Left Navigation Sidebar -->
          <aside class="workspace-sidebar" aria-label="Phases Navigation">
            <div class="sidebar-header">
              <span class="sidebar-title">Phases</span>
              <span class="profile-tag">${this.snapshot?.profile || 'general'}</span>
            </div>
            ${this._renderPhasesNav()}
          </aside>

          <!-- Main Content Area -->
          <main class="workspace-main">
            ${
              phase
                ? `
                <div class="phase-header">
                  <div class="phase-title-row">
                    <h2 class="phase-title">${phase.name || phase.id}</h2>
                    <span class="phase-category-badge category-${phase.category}">${phase.category.toUpperCase()}</span>
                  </div>
                  <div class="phase-meta-row">
                    <span class="mono text-muted">ID: ${phase.id}</span>
                    <span class="bullet">•</span>
                    <span>${phase.taskCounts?.completed || 0} / ${phase.taskCounts?.total || 0} tasks (${phase.taskCounts?.percent || 0}%)</span>
                  </div>
                </div>

                <!-- Navigation Tabs -->
                <nav class="phase-tabs-nav" role="tablist" aria-label="Phase Content Tabs">
                  <button class="tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" role="tab" aria-selected="${this.activeTab === 'overview'}" data-tab="overview">
                    📋 Overview
                  </button>
                  <button class="tab-btn ${this.activeTab === 'requirements' ? 'active' : ''}" role="tab" aria-selected="${this.activeTab === 'requirements'}" data-tab="requirements">
                    📝 Requirements
                  </button>
                  <button class="tab-btn ${this.activeTab === 'design' ? 'active' : ''}" role="tab" aria-selected="${this.activeTab === 'design'}" data-tab="design">
                    📐 Design
                  </button>
                  <button class="tab-btn ${this.activeTab === 'tasks' ? 'active' : ''}" role="tab" aria-selected="${this.activeTab === 'tasks'}" data-tab="tasks">
                    ✅ Tasks (${phase.taskCounts?.total || 0})
                  </button>
                  <button class="tab-btn ${this.activeTab === 'evidence' ? 'active' : ''}" role="tab" aria-selected="${this.activeTab === 'evidence'}" data-tab="evidence">
                    🛡️ Evidence (${phase.artifacts?.evidence?.length || 0})
                  </button>
                  <button class="tab-btn ${this.activeTab === 'relationships' ? 'active' : ''}" role="tab" aria-selected="${this.activeTab === 'relationships'}" data-tab="relationships">
                    🕸️ Traceability
                  </button>
                </nav>

                <!-- Active Tab Content Container -->
                <div class="tab-content-container" role="tabpanel">
                  ${this._renderActiveTabContent(phase)}
                </div>
              `
                : `<div class="empty-state">No phases registered in this project.</div>`
            }
          </main>
        </div>
      </div>
    `;

    this._bindWorkspaceEvents();

    if (this.activeTab === 'design') {
      renderMermaidBlocks(this.container);
    }
  }

  _renderProjectSelector() {
    if (this.projects.length <= 1) {
      return `<div class="project-pill mono">${this.currentProjectId || 'Project'}</div>`;
    }

    return `
      <select id="project-select" class="project-dropdown">
        ${this.projects.map(p => `
          <option value="${p.id}" ${p.id === this.currentProjectId ? 'selected' : ''}>
            ${p.name || p.id} (${p.profile})
          </option>
        `).join('')}
      </select>
    `;
  }

  _renderPhasesNav() {
    const phases = this.snapshot?.phases || [];
    const activePhases = phases.filter(p => p.category === 'active');
    const backlogPhases = phases.filter(p => p.category === 'backlog');
    const archivePhases = phases.filter(p => p.category === 'archive');

    const renderGroup = (title, list) => {
      if (list.length === 0) return '';
      return `
        <div class="nav-group">
          <div class="nav-group-title">${title} (${list.length})</div>
          <ul class="nav-list">
            ${list.map(p => `
              <li class="nav-item ${p.id === this.activePhaseId ? 'active' : ''}" data-phase-id="${p.id}">
                <div class="nav-item-content">
                  <div class="nav-item-title">${p.id}</div>
                  <div class="nav-item-meta">
                    <div class="nav-mini-progress">
                      <div class="mini-bar-fill" style="width: ${p.taskCounts?.percent || 0}%;"></div>
                    </div>
                    <span class="mini-pct mono">${p.taskCounts?.percent || 0}%</span>
                  </div>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    };

    return `
      <div class="phases-nav-scroll">
        ${renderGroup('Active Sprints', activePhases)}
        ${renderGroup('Backlog', backlogPhases)}
        ${renderGroup('Archive', archivePhases)}
      </div>
    `;
  }

  _renderActiveTabContent(phase) {
    switch (this.activeTab) {
      case 'overview':
        return renderOverviewView(phase);
      case 'requirements':
        return renderSpecView(phase, 'requirements');
      case 'design':
        return renderSpecView(phase, 'design');
      case 'tasks':
        return renderSpecView(phase, 'tasks', this.taskFilter);
      case 'evidence':
        return renderEvidenceView(phase);
      case 'relationships':
        return renderRelationshipsView(phase, this.relMode);
      default:
        return renderOverviewView(phase);
    }
  }

  _getStatusBadgeHtml() {
    const rev = (this.snapshot?.contentRevision || '').slice(0, 7) || 'init';
    if (this.connectionStatus === 'live') {
      return `<div class="status-badge status-live" title="Connected via Server-Sent Events (Live updates active)"><span class="status-dot"></span> Live • <span class="mono">${rev}</span></div>`;
    }
    if (this.connectionStatus === 'polling') {
      return `<div class="status-badge status-polling" title="Connected via 2s Polling"><span class="status-dot"></span> Polling • <span class="mono">${rev}</span></div>`;
    }
    if (this.connectionStatus === 'demo') {
      return `<div class="status-badge status-demo" title="Synthetic Static Demo"><span class="status-dot"></span> Demo</div>`;
    }
    return `<div class="status-badge status-stale" title="Connection offline or stale"><span class="status-dot"></span> Disconnected</div>`;
  }

  _updateStatusBar() {
    const el = document.getElementById('status-badge-container');
    if (el) el.innerHTML = this._getStatusBadgeHtml();
  }

  _bindLandingEvents() {
    const launchDemoBtn = document.getElementById('launch-demo-btn');
    if (launchDemoBtn) {
      launchDemoBtn.addEventListener('click', () => {
        this.viewMode = 'workspace';
        this.render();
      });
    }

    const navDemoBtn = document.getElementById('nav-demo-btn');
    if (navDemoBtn) {
      navDemoBtn.addEventListener('click', () => {
        this.viewMode = 'workspace';
        this.render();
      });
    }

    const copyBtn = document.getElementById('copy-cmd-btn');
    const cmdEl = document.getElementById('install-cmd');
    if (copyBtn && cmdEl) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(cmdEl.innerText.trim()).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        }).catch(() => {
          copyBtn.textContent = 'Copied!';
        });
      });
    }
  }

  _bindWorkspaceEvents() {
    const navLandingBtn = document.getElementById('nav-landing-btn');
    if (navLandingBtn) {
      navLandingBtn.addEventListener('click', () => {
        this.viewMode = 'landing';
        this.render();
      });
    }

    // Phase selection
    this.container.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const pId = el.getAttribute('data-phase-id');
        if (pId && pId !== this.activePhaseId) {
          this.activePhaseId = pId;
          this.render();
        }
      });
    });

    // Tab buttons
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab && tab !== this.activeTab) {
          this.activeTab = tab;
          this.render();
        }
      });
    });

    // Task filters
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        if (filter && filter !== this.taskFilter) {
          this.taskFilter = filter;
          this.render();
        }
      });
    });

    // Relationships mode buttons
    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-rel-mode');
        if (mode && mode !== this.relMode) {
          this.relMode = mode;
          this.render();
        }
      });
    });

    // Project select dropdown
    const projSelect = document.getElementById('project-select');
    if (projSelect) {
      projSelect.addEventListener('change', (e) => {
        this.selectProject(e.target.value);
      });
    }
  }

  _renderSkeleton() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; min-height:80vh;">
        <div style="text-align:center;">
          <div style="font-size:2rem; margin-bottom:1rem;">⚡</div>
          <div style="font-size:1.1rem; color:var(--text-secondary);">Loading SDD Workspace...</div>
        </div>
      </div>
    `;
  }

  _renderError(message) {
    if (!this.container) return;
    this.container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; min-height:80vh;">
        <div style="max-width:500px; padding:2rem; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; text-align:center;">
          <div style="font-size:2rem; margin-bottom:1rem;">⚠️</div>
          <h2 style="margin-bottom:0.5rem;">Connection Notice</h2>
          <p style="color:var(--text-secondary); margin-bottom:1.5rem;">${message}</p>
          <button id="retry-btn" style="padding:0.6rem 1.2rem; background:var(--accent-color); color:#fff; border:none; border-radius:6px; cursor:pointer;">Retry</button>
        </div>
      </div>
    `;
    const btn = document.getElementById('retry-btn');
    if (btn) btn.addEventListener('click', () => this.init());
  }
}
