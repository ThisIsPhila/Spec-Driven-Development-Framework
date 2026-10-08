import { renderMarkdown } from '../markdown.js';

/**
 * Evidence Records Reader Component
 */

export function renderEvidenceView(phase) {
  if (!phase) return `<div class="empty-state">No phase loaded.</div>`;

  const evidenceRecords = phase.artifacts?.evidence || [];

  if (evidenceRecords.length === 0) {
    return `
      <div class="empty-state">
        <p>No verification evidence records found in <code>.sdd/evidence/</code> for this phase.</p>
        <p class="text-muted">Evidence documents record verified test runs, environments, and assessed revisions.</p>
      </div>
    `;
  }

  return `
    <div class="evidence-view">
      <div class="evidence-header-note">
        <p>Evidence records verified-local behavior. Verification claims are bounded to the explicit procedure and environment recorded below.</p>
      </div>

      <div class="evidence-cards-container">
        ${evidenceRecords.map(record => renderEvidenceCard(record, phase)).join('')}
      </div>
    </div>
  `;
}

function renderEvidenceCard(record, phase) {
  const p = record.parsed || {};
  const isPass = (p.result || '').toUpperCase().includes('PASS');
  const resultClass = isPass ? 'badge-pass' : 'badge-fail';

  return `
    <article class="evidence-card" aria-label="Evidence record: ${record.filename}">
      <header class="evidence-card-header">
        <div class="evidence-title-group">
          <span class="file-icon">🛡️</span>
          <h3 class="evidence-filename">${record.filename}</h3>
        </div>
        <div class="evidence-outcome-badge ${resultClass}">
          ${p.result || 'Not recorded'}
        </div>
      </header>

      <!-- Structured Metadata Grid -->
      <div class="evidence-meta-grid">
        <div class="meta-field">
          <span class="meta-label">Assessed Tree / Revision</span>
          <span class="meta-value mono">${p.assessedTree || 'Not recorded'}</span>
        </div>
        <div class="meta-field">
          <span class="meta-label">Environment</span>
          <span class="meta-value">${p.environment || 'Not recorded'}</span>
        </div>
        <div class="meta-field">
          <span class="meta-label">Timestamp</span>
          <span class="meta-value mono">${p.timestamp || 'Not recorded'}</span>
        </div>
        <div class="meta-field">
          <span class="meta-label">Limitations</span>
          <span class="meta-value">${p.limitations || 'Not recorded'}</span>
        </div>
      </div>

      <details class="evidence-body-details">
        <summary>View Complete Evidence Report</summary>
        <div class="markdown-body" style="margin-top: 1rem;">
          ${renderMarkdown(record.content)}
        </div>
      </details>
    </article>
  `;
}
