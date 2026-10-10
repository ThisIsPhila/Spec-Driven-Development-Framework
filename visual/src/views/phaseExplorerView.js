import { phaseOrder } from './projectOverviewView.js';
import { escapeHtml } from '../sanitize.js';
import { escapeDisplayModel } from '../sanitize.js';
import { renderMarkdown } from '../markdown.js';
import { renderOverviewView } from './overviewView.js';
import { renderSpecView } from './specView.js';
import { renderEvidenceView } from './evidenceView.js';
import { generateTraceabilitySvg, generateTraceabilityList } from '../traceability.js';
import { ICONS } from '../icons.js';

/**
 * On-Screen Phase Explorer & Phase Workspace
 * Scalable navigation designed to effortlessly manage 50+ phases without cluttering the header.
 * Surfaces all phase contents: requirements, design, tasks, evidence, acceptance, remediations, future work.
 */
export function renderPhaseExplorerView(snapshot, state) {
  snapshot = escapeDisplayModel(snapshot);
  if (!snapshot) return `<div class="empty-state">No project loaded.</div>`;

  const phases = [...(snapshot.phases || [])].sort(phaseOrder);
  const activePhaseIdInSnapshot = snapshot.activePhaseId;
  const currentPhaseId = state.activePhaseId;
  const currentTab = state.phaseTab || 'overview';
  const scopeFilter = state.phaseScopeFilter || 'all';
  const searchQuery = (state.phaseSearchQuery || '').toLowerCase().trim();

  // Filter phases by scope and search query
  const filteredPhases = phases.filter(p => {
    if (scopeFilter !== 'all' && p.category !== scopeFilter) return false;
    if (searchQuery) {
      const matchId = p.id.toLowerCase().includes(searchQuery);
      const matchName = (p.name || '').toLowerCase().includes(searchQuery);
      const matchTask = (p.tasks || []).some(t => t.id.toLowerCase().includes(searchQuery) || (t.title || '').toLowerCase().includes(searchQuery));
      const matchReq = (p.requirements || []).some(r => r.id.toLowerCase().includes(searchQuery) || (r.title || '').toLowerCase().includes(searchQuery));
      if (!matchId && !matchName && !matchTask && !matchReq) return false;
    }
    return true;
  });

  const activeCount = phases.filter(p => p.category === 'active').length;
  const backlogCount = phases.filter(p => p.category === 'backlog').length;
  const archiveCount = phases.filter(p => p.category === 'archive').length;

  // Selected phase
  const selectedPhase = phases.find(p => p.id === currentPhaseId) || null;

  return `
    <div class="phase-explorer-container">
      <!-- LEFT PANEL: Scalable On-Screen Phase navigation -->
      <aside class="phase-nav-sidebar" aria-label="Phase navigation">
        <div class="phase-nav-sidebar-header">
          <div class="nav-sidebar-title-row">
            <span class="nav-sidebar-kicker font-mono">PHASES</span>
            <button class="all-sprints-btn font-mono ${currentPhaseId === null ? 'active' : ''}" id="toggle-all-sprints-btn">
              All phases
            </button>
          </div>

          <!-- Scope Filter Bar -->
          <div class="phase-scope-bar font-mono">
            <button class="scope-btn ${scopeFilter === 'all' ? 'active' : ''}" data-scope-filter="all">
              All (${phases.length})
            </button>
            <button class="scope-btn ${scopeFilter === 'active' ? 'active' : ''}" data-scope-filter="active">
              Active (${activeCount})
            </button>
            <button class="scope-btn ${scopeFilter === 'backlog' ? 'active' : ''}" data-scope-filter="backlog">
              Backlog (${backlogCount})
            </button>
            <button class="scope-btn ${scopeFilter === 'archive' ? 'active' : ''}" data-scope-filter="archive">
              Archive (${archiveCount})
            </button>
          </div>

          <!-- Real-Time Search Box for 50+ Phases -->
          <div class="phase-nav-search-wrapper">
            <span class="search-glyph">${ICONS.search}</span>
            <input
              type="text"
              id="phase-search-field"
              placeholder="Find a phase, task or requirement"
              value="${escapeHtml(state.phaseSearchQuery || '')}"
              class="phase-search-input font-mono"
              autocomplete="off"
              spellcheck="false"
            />
            ${state.phaseSearchQuery ? `<button class="search-clear-glyph" id="clear-phase-search">×</button>` : ''}
          </div>
        </div>

        <!-- Scrollable Phase Items List -->
        <div class="phase-items-scrollable-list" role="list">
          ${filteredPhases.length === 0 ? `
            <div class="empty-state font-mono" style="padding:2rem 1rem; font-size:0.8rem;">
              No phases match "${escapeHtml(state.phaseSearchQuery)}".
            </div>
          ` : filteredPhases.map(p => {
            const isSelected = selectedPhase && selectedPhase.id === p.id;
            const isLiveActive = p.id === activePhaseIdInSnapshot;
            const cleanNumber = p.id;
            const percent = p.taskCounts?.percent || 0;

            return `
              <div
                class="phase-list-card ${isSelected ? 'selected' : ''} ${isLiveActive ? 'is-active-sprint' : ''}"
                data-phase-select="${p.id}"
                role="listitem"
                tabindex="0"
              >
                <div class="phase-card-header-row">
                  <div class="phase-id-group font-mono">
                    <span class="scope-dot dot-${p.category}"></span>
                    <span class="phase-p-tag">${cleanNumber}</span>
                    ${isLiveActive ? `<span class="active-pulse-badge">CURRENT PHASE</span>` : ''}
                  </div>
                  <span class="phase-status-pill font-mono status-clean-${p.category}">
                    ${p.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div class="phase-card-title font-mono">${p.name || p.id}</div>

                <div class="phase-card-progress-row">
                  <div class="mini-progress-track">
                    <div class="mini-progress-fill" style="width: ${percent}%;"></div>
                  </div>
                  <span class="mini-progress-text font-mono">
                    ${percent}% (${p.taskCounts?.completed || 0}/${p.taskCounts?.total || 0})
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </aside>

      <!-- RIGHT CANVAS: Phase Workspace or All Sprints Master Overview -->
      <main class="phase-workspace-main">
        ${selectedPhase === null
          ? renderAllSprintsOverview(snapshot)
          : renderSelectedPhaseWorkspace(selectedPhase, currentTab, snapshot, state)
        }
      </main>
    </div>
  `;
}

/**
 * Renders the Selected Phase Workspace with all 7 sub-tabs
 */
function renderSelectedPhaseWorkspace(phase, activeTab, snapshot, state) {
  const pHealth = phase.metrics?.healthScore ?? 0;
  const pGrade = phase.metrics?.healthGrade || 'UNKNOWN';
  const cleanId = phase.id;
  const acceptanceCount = phase.acceptanceCriteria?.length || 0;
  const limitationsCount = phase.limitations?.length || 0;
  const evCount = phase.artifacts?.evidence?.length || 0;

  return `
    <div class="phase-workspace-container">
      <!-- Phase Top Banner -->
      <header class="phase-workspace-header">
        <div class="phase-header-meta">
          <div class="phase-kicker-line font-mono">
            <span class="scope-dot dot-${phase.category}"></span>
            <span class="category-tag text-uppercase">${phase.category} PHASE</span>
            <span class="header-slash">•</span>
            <span class="phase-id-label">${cleanId}</span>
            <span class="header-slash">•</span>
            <span class="freshness-tag font-mono">${phase.metrics?.verificationAssurance?.freshness === 'HEAD_MATCH_ONLY' ? 'GIT HEAD MATCH' : 'LOCAL BASELINE'}</span>
          </div>
          <h1 class="phase-main-title">${phase.id}</h1>
        </div>

        <div class="phase-header-kpi-bar font-mono">
          <div class="kpi-chip">
            <span class="kpi-chip-label">STATUS</span>
            <span class="kpi-chip-val text-accent">${phase.status.replace(/_/g, ' ')}</span>
          </div>
          <div class="kpi-chip">
            <span class="kpi-chip-label">PROGRESS</span>
            <span class="kpi-chip-val">${phase.taskCounts?.percent || 0}% (${phase.taskCounts?.completed || 0}/${phase.taskCounts?.total || 0})</span>
          </div>
          <div class="kpi-chip">
            <span class="kpi-chip-label">SPEC COMPLETENESS</span>
            <span class="kpi-chip-val text-accent">${pHealth}/100</span>
          </div>
        </div>
      </header>

      <!-- 7 Comprehensive Sub-Tabs for this Phase -->
      <nav class="phase-subtabs-bar font-mono" aria-label="Phase sub-navigation">
        <button class="phase-subtab-btn ${activeTab === 'overview' ? 'active' : ''}" data-phase-tab="overview">
          Overview
        </button>
        <button class="phase-subtab-btn ${activeTab === 'requirements' ? 'active' : ''}" data-phase-tab="requirements">
          requirements.md (${phase.requirements?.length || 0})
        </button>
        <button class="phase-subtab-btn ${activeTab === 'design' ? 'active' : ''}" data-phase-tab="design">
          design.md
        </button>
        <button class="phase-subtab-btn ${activeTab === 'tasks' ? 'active' : ''}" data-phase-tab="tasks">
          tasks.md (${phase.tasks?.length || 0})
        </button>
        <button class="phase-subtab-btn ${activeTab === 'evidence' ? 'active' : ''}" data-phase-tab="evidence">
          Evidence & Acceptance (${evCount + acceptanceCount})
        </button>
        <button class="phase-subtab-btn ${activeTab === 'remediations' ? 'active' : ''}" data-phase-tab="remediations">
          Remediations & Future (${limitationsCount + (phase.futureWork?.length || 0)})
        </button>
        <button class="phase-subtab-btn ${activeTab === 'traceability' ? 'active' : ''}" data-phase-tab="traceability">
          Traceability Graph
        </button>
      </nav>

      <!-- Tab Content Area -->
      <div class="phase-subtab-content-area">
        ${renderSubTabContent(phase, activeTab, snapshot, state)}
      </div>
    </div>
  `;
}

function renderSubTabContent(phase, tab, snapshot, state) {
  if (tab === 'overview') {
    return renderOverviewView(phase);
  }
  if (tab === 'requirements') {
    return renderSpecView(phase, 'requirements');
  }
  if (tab === 'design') {
    return renderSpecView(phase, 'design');
  }
  if (tab === 'tasks') {
    return renderSpecView(phase, 'tasks', state.taskFilter || 'all');
  }
  if (tab === 'evidence') {
    return renderEvidenceAndAcceptanceView(phase);
  }
  if (tab === 'remediations') {
    return renderRemediationsAndFutureView(phase);
  }
  if (tab === 'traceability') {
    return `
      <div class="traceability-view">
        <div class="section-bar-header">
          <span>Requirement → Task → Evidence Dependency Matrix</span>
        </div>
        <div class="traceability-svg-container">
          ${generateTraceabilitySvg(phase)}
        </div>
        <div style="margin-top:2rem;">
          ${generateTraceabilityList(phase)}
        </div>
      </div>
    `;
  }
  return `<div class="empty-state">Unknown tab: ${escapeHtml(tab)}</div>`;
}

/**
 * Evidence & Acceptance Combined View
 */
function renderEvidenceAndAcceptanceView(phase) {
  const criteria = phase.acceptanceCriteria || [];
  return `
    <div class="evidence-acceptance-layout">
      <!-- Formal Acceptance Criteria Checklist -->
      <section class="acceptance-criteria-section">
        <div class="section-bar-header">
          <span>Formal Acceptance Criteria (${criteria.length})</span>
        </div>
        ${criteria.length > 0 ? `
          <div class="criteria-list font-mono" style="margin-top:1rem;">
            ${criteria.map(c => `
              <div class="criteria-item">
                <span class="criteria-check-icon ${c.done ? 'text-accent' : 'text-muted-foreground'}">
                  ${c.done ? ICONS.checkCircle : ICONS.circle}
                </span>
                <div class="criteria-body">
                  ${c.reqId ? `<span class="criteria-req-tag">${c.reqId}</span>` : ''}
                  <span class="criteria-text ${c.done ? 'done-text' : ''}">${c.text}${c.declaredDone ? ' (source checkbox checked; acceptance unassessed)' : ''}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="text-muted-foreground font-mono text-xs" style="padding: 1rem 0;">
            No structured acceptance criteria checklist detected in requirements.md.
          </p>
        `}
      </section>

      <!-- Verification Evidence Records -->
      <section class="evidence-section" style="margin-top:2.5rem;">
        <div class="section-bar-header">
          <span>Verification Evidence Records</span>
        </div>
        ${renderEvidenceView(phase)}
      </section>
    </div>
  `;
}

/**
 * Remediations, Limitations, and Future Work View
 */
function renderRemediationsAndFutureView(phase) {
  const limitations = phase.limitations || [];
  const remediations = phase.remediations || [];
  const future = phase.futureWork || [];

  return `
    <div class="remediations-future-layout">
      <!-- Recorded Limitations -->
      <section class="limitations-section">
        <div class="section-bar-header">
          <span>Observed Limitations & Environment Constraints (${limitations.length})</span>
        </div>
        ${limitations.length > 0 ? `
          <div class="limitations-grid font-mono" style="margin-top:1rem;">
            ${limitations.map(l => `
              <div class="limitation-card">
                <div class="limitation-source">From Evidence: <strong>${l.source}</strong></div>
                <div class="limitation-text">${l.text}</div>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="text-muted-foreground font-mono text-xs" style="padding: 1rem 0;">
            Zero blocking limitations reported in evidence records.
          </p>
        `}
      </section>

      <!-- Remediations & Diagnostics -->
      <section class="remediations-section" style="margin-top: 2.5rem;">
        <div class="section-bar-header">
          <span>Remediations & Tracked Diagnostics (${remediations.length})</span>
        </div>
        ${remediations.length > 0 ? `
          <div class="remediations-list font-mono" style="margin-top:1rem;">
            ${remediations.map(r => `
              <div class="remediation-item">
                <span class="remediation-badge">${r.severity || 'WARNING'}</span>
                <span class="remediation-text">${r.issue}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="text-muted-foreground font-mono text-xs" style="padding: 1rem 0;">
            No active unresolved remediations or diagnostic warnings in this phase.
          </p>
        `}
      </section>

      <!-- Future Work & Out of Scope Boundaries -->
      <section class="future-work-section" style="margin-top: 2.5rem;">
        <div class="section-bar-header">
          <span>Future Work & Scope Hand-Off Boundaries (${future.length})</span>
        </div>
        ${future.length > 0 ? `
          <div class="future-list font-mono" style="margin-top:1rem;">
            ${future.map(item => `
              <div class="future-item">
                <span class="future-bullet">→</span>
                <span class="future-text">${item}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="text-muted-foreground font-mono text-xs" style="padding: 1rem 0;">
            No structured future work recorded items or out-of-scope boundaries defined.
          </p>
        `}
      </section>
    </div>
  `;
}

/**
 * Master All phases View
 */
function renderAllSprintsOverview(snapshot) {
  const phases = [...(snapshot.phases || [])].sort(phaseOrder);
  const metrics = snapshot.metrics || {};

  return `
    <div class="all-sprints-overview-container">
      <header class="domain-header">
        <div>
          <span class="domain-kicker font-mono">PROJECT PORTFOLIO</span>
          <h1 class="domain-title">All phases</h1>
          <p class="domain-subtitle font-mono">
            Recorded task progress across phases.
          </p>
        </div>
        <div class="domain-stats-pill font-mono">
          <span>${phases.length} Phases</span> • <span>${metrics.overallProgressPct || 0}% Overall Progress</span>
        </div>
      </header>

      <!-- Phases Completion overview Grid -->
      <div class="all-phases-grid font-mono" style="margin-top: 1.5rem;">
        ${phases.map(p => {
          const percent = p.taskCounts?.percent || 0;
          return `
            <div class="all-phase-card" data-phase-select="${p.id}" role="button" tabindex="0">
              <div class="all-phase-card-top">
                <span class="scope-dot dot-${p.category}"></span>
                <span class="all-phase-id">${p.id}</span>
                <span class="status-clean-${p.category}">${p.status.replace(/_/g, ' ')}</span>
              </div>
              <h3 class="all-phase-name">${p.name || p.id}</h3>
              <div class="all-phase-stats-row">
                <span>${p.taskCounts?.completed || 0}/${p.taskCounts?.total || 0} Tasks</span>
                <span class="text-accent">${percent}%</span>
              </div>
              <div class="mini-progress-track">
                <div class="mini-progress-fill" style="width: ${percent}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
