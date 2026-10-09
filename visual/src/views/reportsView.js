import { renderMarkdown } from '../markdown.js';
import { ICONS } from '../icons.js';

/**
 * Reports & Audits View
 * Surfaces formal milestone assessment reports, closeout signoffs, and product roadmap audits.
 */
export function renderReportsView(snapshot, activeReportId = null) {
  if (!snapshot) return `<div class="empty-state">No project loaded.</div>`;

  const reports = snapshot.reports || [];
  const currentReport = reports.find(r => r.id === activeReportId) || reports[0];

  return `
    <div class="domain-view-container">
      <header class="domain-header">
        <div>
          <span class="domain-kicker font-mono">AUDIT RECORDS & MILESTONES</span>
          <h1 class="domain-title">Assessment Reports & Phase Closeouts</h1>
          <p class="domain-subtitle font-mono">
            Formal closeout audits, verification assessments, and verified milestone retrospectives.
          </p>
        </div>
        <div class="domain-stats-pill font-mono">
          <span>${reports.length} Official Reports</span>
        </div>
      </header>

      <div class="domain-two-col-layout">
        <!-- Sidebar Navigation for Reports -->
        <aside class="domain-sidebar">
          <div class="sidebar-section-title font-mono">ALL ASSESSMENTS (${reports.length})</div>
          ${reports.map(r => `
            <button class="domain-nav-item ${currentReport && currentReport.id === r.id ? 'active' : ''}" data-report-id="${r.id}">
              <span class="item-icon">${ICONS.sparkles}</span>
              <div class="item-text-group">
                <span class="item-name">${r.title}</span>
                <span class="item-sub font-mono">${r.phase || 'framework'} • ${r.type}</span>
              </div>
            </button>
          `).join('')}
        </aside>

        <!-- Main Content Area: Report Reader -->
        <main class="domain-content-card">
          ${currentReport ? `
            <header class="doc-view-header">
              <div class="doc-title-row">
                <h2 class="doc-view-title">${currentReport.title}</h2>
                <span class="report-badge-pill font-mono">${currentReport.type.toUpperCase()}</span>
              </div>
              <div class="report-meta-row font-mono text-xs text-muted-foreground">
                <span>Phase: <strong class="text-foreground">${currentReport.phase}</strong></span>
                <span>File: <code>${currentReport.relativePath || currentReport.filename}</code></span>
              </div>
            </header>
            <div class="markdown-body">
              ${renderMarkdown(currentReport.content || 'No report content recorded.')}
            </div>
          ` : `
            <div class="empty-state">No reports found in <code>.sdd/reports/</code>.</div>
          `}
        </main>
      </div>
    </div>
  `;
}
