import { escapeDisplayModel } from '../sanitize.js';
import { generateTraceabilitySvg, generateTraceabilityList } from '../traceability.js';
import { ICONS } from '../icons.js';

/**
 * Overview View Component
 */

export function renderOverviewView(phase) {
  if (!phase) {
    return `<div class="empty-state">No phase selected.</div>`;
  }

  const { taskCounts, artifacts, requirements, tasks, warnings } = phase;

  // Determine Lifecycle Step Statuses
  const cleanStatus = value => String(value || 'MISSING').replace(/\p{Extended_Pictographic}|[\uFE0F\u200D✅]/gu, '').trim();
  const reqStatus = cleanStatus(artifacts?.requirements?.status);
  const desStatus = cleanStatus(artifacts?.design?.status);
  const tskStatus = cleanStatus(artifacts?.tasks?.status);
  const evCount = artifacts?.evidence?.length || 0;

  const reqApproved = reqStatus.toUpperCase().includes('APPROVED');
  const desApproved = desStatus.toUpperCase().includes('APPROVED');
  const tskReady = tskStatus.toUpperCase().includes('READY') || tskStatus.toUpperCase().includes('APPROVED');
  const evRecorded = evCount > 0;

  const counts = ['done','doing','todo'].map(status => (tasks || []).filter(t => status === 'todo' ? !['done','doing'].includes(t.status) : t.status === status).length);
  const total = counts.reduce((a,b)=>a+b,0);
  const chart = `<section class="insight-panel"><h3>Task distribution</h3>${['Completed','In progress','Pending'].map((label,i)=>`<div class="phase-distribution-row"><span>${label}</span><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${total ? counts[i]/total*100 : 0}%"></div></div><strong>${counts[i]}</strong></div>`).join('')}<p>${total ? 'Recorded task status' : 'No recognized tasks; progress unassessed'}</p></section>`;

  // Find active task
  const activeTask = (tasks || []).find(t => t.status === 'doing');

  return `
    <div class="overview-view compact-phase-insights">
      <!-- Lifecycle Strip -->
      <section class="lifecycle-section" aria-label="Phase Lifecycle Progress">

        <div class="lifecycle-strip">
          <div class="lifecycle-step ${reqApproved ? 'step-approved' : 'step-pending'}">
            <div class="step-num">1</div>
            <div class="step-meta">
              <span class="step-name">Requirements</span>
              <span class="step-state">${reqStatus}</span>
            </div>
          </div>
          <div class="lifecycle-connector ${reqApproved ? 'conn-active' : ''}"></div>
          <div class="lifecycle-step ${desApproved ? 'step-approved' : 'step-pending'}">
            <div class="step-num">2</div>
            <div class="step-meta">
              <span class="step-name">Design</span>
              <span class="step-state">${desStatus}</span>
            </div>
          </div>
          <div class="lifecycle-connector ${desApproved ? 'conn-active' : ''}"></div>
          <div class="lifecycle-step ${tskReady ? 'step-approved' : 'step-pending'}">
            <div class="step-num">3</div>
            <div class="step-meta">
              <span class="step-name">Task Plan</span>
              <span class="step-state">${tskStatus}</span>
            </div>
          </div>
          <div class="lifecycle-connector ${tskReady ? 'conn-active' : ''}"></div>
          <div class="lifecycle-step ${evRecorded ? 'step-approved' : 'step-pending'}">
            <div class="step-num">4</div>
            <div class="step-meta">
              <span class="step-name">Evidence</span>
              <span class="step-state">${evCount} recorded</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Metrics Grid -->
      <section class="metrics-grid">
        <div class="metric-card progress-card">
          <div class="metric-header">
            <h4>Task Execution Progress</h4>
            <span class="percent-badge">${taskCounts?.percent || 0}%</span>
          </div>
          <div class="progress-bar-bg" role="progressbar" aria-valuenow="${taskCounts?.percent || 0}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar-fill" style="width: ${taskCounts?.percent || 0}%;"></div>
          </div>
          <div class="metric-breakdown">
            <div class="breakdown-item text-success">
              <span class="breakdown-dot dot-success"></span>
              <strong>${taskCounts?.completed || 0}</strong> Completed
            </div>
            <div class="breakdown-item text-warning">
              <span class="breakdown-dot dot-warning"></span>
              <strong>${taskCounts?.inProgress || 0}</strong> In Progress
            </div>
            <div class="breakdown-item text-muted">
              <span class="breakdown-dot dot-pending"></span>
              <strong>${taskCounts?.pending || 0}</strong> Pending
            </div>
            <div class="breakdown-item">
              <strong>${taskCounts?.total || 0}</strong> Total
            </div>
          </div>
        </div>

        <div class="metric-card summary-card">
          <h4>Phase Scope Counts</h4>
          <div class="counts-grid">
            <div class="count-box">
              <span class="count-value">${requirements?.length || 0}</span>
              <span class="count-label">Requirements</span>
            </div>
            <div class="count-box">
              <span class="count-value">${tasks?.length || 0}</span>
              <span class="count-label">Tasks</span>
            </div>
            <div class="count-box">
              <span class="count-value">${evCount}</span>
              <span class="count-label">Evidence Files</span>
            </div>
            <div class="count-box">
              <span class="count-value">${phase.relationships?.length || 0}</span>
              <span class="count-label">Trace Links</span>
            </div>
          </div>
        </div>

        <!-- Verification & Test Assurance Card -->
        <div class="metric-card verification-metric-card">
          <div class="metric-header">
            <h4>Test &amp; Verification Assurance</h4>
            <span class="freshness-badge freshness-${String(phase.metrics?.verificationAssurance?.freshness || 'UNLINKED').toLowerCase()}">
              ${phase.metrics?.verificationAssurance?.freshness === 'HEAD_MATCH_ONLY' ? 'Matches HEAD' : phase.metrics?.verificationAssurance?.freshness === 'FRESH' ? 'Fresh' : phase.metrics?.verificationAssurance?.freshness === 'STALE' ? 'Stale' : 'Unlinked'}
            </span>
          </div>
          <div class="verification-stats-row font-mono">
            <div class="vstat-item">
              <span class="vstat-val">${evCount}</span>
              <span class="vstat-lbl">Runs</span>
            </div>
            <div class="vstat-item text-success">
              <span class="vstat-val">${phase.metrics?.verificationAssurance?.passCount || 0}</span>
              <span class="vstat-lbl">Pass</span>
            </div>
            <div class="vstat-item ${phase.metrics?.verificationAssurance?.failCount ? 'text-destructive' : 'text-muted'}">
              <span class="vstat-val">${phase.metrics?.verificationAssurance?.failCount || 0}</span>
              <span class="vstat-lbl">Fail</span>
            </div>
            <div class="vstat-item">
              <span class="vstat-val text-accent">${phase.metrics?.verificationAssurance?.passRate !== null && phase.metrics?.verificationAssurance?.passRate !== undefined ? `${phase.metrics.verificationAssurance.passRate}%` : evCount ? '100%' : 'N/A'}</span>
              <span class="vstat-lbl">Rate</span>
            </div>
          </div>
          <div class="progress-bar-bg" style="margin-top:0.6rem;">
            <div class="progress-bar-fill progress-fill-emerald" style="width: ${phase.metrics?.verificationAssurance?.passRate ?? (evCount ? 100 : 0)}%;"></div>
          </div>
        </div>

        <!-- Quality & Health Score Pillars Card -->
        <div class="metric-card pillars-metric-card">
          <div class="metric-header">
            <h4>Framework Quality Pillars</h4>
            <span class="health-score-badge font-mono">${phase.metrics?.healthScore || 0}/100</span>
          </div>
          <div class="pillars-mini-grid font-mono">
            <div class="pillar-row">
              <span class="pillar-label">Spec Definition</span>
              <div class="pillar-bar-bg"><div class="pillar-bar-fill" style="width:${Math.round(((phase.metrics?.pillars?.definition || 0)/25)*100)}%;"></div></div>
              <span class="pillar-score">${phase.metrics?.pillars?.definition || 0}/25</span>
            </div>
            <div class="pillar-row">
              <span class="pillar-label">Governance</span>
              <div class="pillar-bar-bg"><div class="pillar-bar-fill" style="width:${Math.round(((phase.metrics?.pillars?.governance || 0)/25)*100)}%;"></div></div>
              <span class="pillar-score">${phase.metrics?.pillars?.governance || 0}/25</span>
            </div>
            <div class="pillar-row">
              <span class="pillar-label">Execution</span>
              <div class="pillar-bar-bg"><div class="pillar-bar-fill" style="width:${Math.round(((phase.metrics?.pillars?.execution || 0)/25)*100)}%;"></div></div>
              <span class="pillar-score">${phase.metrics?.pillars?.execution || 0}/25</span>
            </div>
            <div class="pillar-row">
              <span class="pillar-label">Verification</span>
              <div class="pillar-bar-bg"><div class="pillar-bar-fill" style="width:${Math.round(((phase.metrics?.pillars?.verification || 0)/25)*100)}%;"></div></div>
              <span class="pillar-score">${phase.metrics?.pillars?.verification || 0}/25</span>
            </div>
          </div>
        </div>
      </section>

      <section class="insight-panel phase-overview-graph"><h3>Requirements → tasks → evidence</h3><p>Explicit source links. Select a node to inspect its source.</p><div class="phase-graph-canvas">${generateTraceabilitySvg(phase)}</div><details><summary>Accessible relationship list</summary>${generateTraceabilityList(phase)}</details></section>
      <!-- Active Task Highlight -->
      ${
        activeTask
          ? `
          <section class="active-task-banner">
            <div class="active-task-header">
              <span class="pulse-indicator"></span>
              <span class="active-tag">CURRENTLY IN PROGRESS</span>
              <span class="task-id-badge">${activeTask.id}</span>
            </div>
            <h3 class="active-task-title">${activeTask.title}</h3>
            ${activeTask.contract ? `<div class="active-task-contract">${activeTask.contract}</div>` : ''}
          </section>
        `
          : ''
      }

      <!-- Diagnostics / Warnings -->
      ${
        warnings && warnings.length > 0
          ? `
          <section class="warnings-card" role="alert">
            <div class="warnings-header">
              <span class="warning-icon">${ICONS.alertTriangle}</span>
              <h4>Diagnostics & Unresolved References (${warnings.length})</h4>
            </div>
            <ul class="warnings-list">
              ${warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </section>
        `
          : ''
      }
    </div>
  `;
}
