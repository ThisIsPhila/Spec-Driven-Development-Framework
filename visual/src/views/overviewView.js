import { escapeDisplayModel } from '../sanitize.js';
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
  const reqStatus = artifacts?.requirements?.status || 'MISSING';
  const desStatus = artifacts?.design?.status || 'MISSING';
  const tskStatus = artifacts?.tasks?.status || 'MISSING';
  const evCount = artifacts?.evidence?.length || 0;

  const reqApproved = reqStatus.toUpperCase().includes('APPROVED');
  const desApproved = desStatus.toUpperCase().includes('APPROVED');
  const tskReady = tskStatus.toUpperCase().includes('READY') || tskStatus.toUpperCase().includes('APPROVED');
  const evRecorded = evCount > 0;

  // Find active task
  const activeTask = (tasks || []).find(t => t.status === 'doing');

  return `
    <div class="overview-view">
      <p class="graph-entry-point">See how this phase connects: <button class="btn btn-secondary" data-phase-tab="traceability">Open Traceability Graph</button> <span class="text-muted-foreground">Requirement, task and evidence links are visible without live activity.</span></p>
      <!-- Lifecycle Strip -->
      <section class="lifecycle-section" aria-label="Phase Lifecycle Progress">
        <h3 class="section-subtitle">Observed Lifecycle Stages</h3>
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

      <!-- Progress Metric Card -->
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
      </section>

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
