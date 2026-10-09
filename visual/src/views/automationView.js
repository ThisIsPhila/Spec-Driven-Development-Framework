import { escapeDisplayModel } from '../sanitize.js';
import { renderMarkdown } from '../markdown.js';
import { ICONS } from '../icons.js';

/**
 * Scripts & Hooks Automation View
 * Surfaces framework automation scripts, git pre-commit quality gates,
 * and hook execution tracking telemetry.
 */
export function renderAutomationView(snapshot, activeScriptName = null) {
  snapshot = escapeDisplayModel(snapshot);
  if (!snapshot) return `<div class="empty-state">No project loaded.</div>`;

  const scripts = snapshot.scripts || [];
  const hooks = snapshot.hooks || { installed: false, telemetry: {} };
  const telemetry = hooks.telemetry || {};
  const currentScript = scripts.find(s => s.name === activeScriptName) || scripts[0];

  return `
    <div class="domain-view-container">
      <header class="domain-header">
        <div>
          <span class="domain-kicker font-mono">AUTOMATION & QUALITY GATES</span>
          <h1 class="domain-title">Framework Scripts & Git Hook Telemetry</h1>
          <p class="domain-subtitle font-mono">
            CLI automation tooling, automated Git quality gates, and invariant enforcement tracking.
          </p>
        </div>
        <div class="domain-stats-pill font-mono">
          <span>${scripts.length} Scripts</span> • <span class="text-accent">${hooks.installed ? 'Hooks Active' : 'Hooks Not Installed'}</span>
        </div>
      </header>

      <!-- Hook Telemetry & Status Hero Card -->
      <section class="hook-telemetry-hero-card">
        <div class="telemetry-hero-top">
          <div class="telemetry-badge-group">
            <span class="live-dot ${hooks.installed ? '' : 'offline'}"></span>
            <span class="telemetry-title font-mono font-bold">Git Pre-Commit Quality Gate: ${hooks.installed ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
          <span class="telemetry-level-pill font-mono">${telemetry.enforcementLevel || 'BLOCKING (Strict)'}</span>
        </div>

        <p class="telemetry-desc text-muted-foreground font-mono">
          ${telemetry.historyStatus || "Execution history not recorded"}. Git hooks can be bypassed.
        </p>

        <!-- Telemetry Stats Row -->
        <div class="telemetry-stats-row font-mono">
          <div class="telemetry-stat-cell">
            <span class="cell-label">Recorded Gate Runs</span>
            <span class="cell-val">${telemetry.totalGatesRun ?? 0} Gates</span>
          </div>
          <div class="telemetry-stat-cell">
            <span class="cell-label">Pass Rate</span>
            <span class="cell-val text-accent">${telemetry.passRate ?? 'Not recorded'}</span>
          </div>
          <div class="telemetry-stat-cell">
            <span class="cell-label">Last Recorded Indexed Tree</span>
            <span class="cell-val mono">Commit ${(telemetry.lastCommitChecked || 'Not recorded')}</span>
          </div>
          <div class="telemetry-stat-cell">
            <span class="cell-label">Hook Location</span>
            <span class="cell-val"><code>${hooks.path || '.git/hooks/pre-commit'}</code></span>
          </div>
        </div>

        <!-- Telemetry Gates List -->
        <div class="telemetry-gates-table-wrapper">
          <div class="section-subtitle font-mono" style="margin-bottom:0.75rem;">GATES DECLARED IN HOOK SOURCE</div>
          <table class="telemetry-gates-table font-mono">
            <thead>
              <tr>
                <th>Gate Name</th>
                <th>Underlying Script</th>
                <th>Frequency</th>
                <th class="text-right">Enforcement Status</th>
              </tr>
            </thead>
            <tbody>
              ${(telemetry.gatesList || []).map(g => `
                <tr>
                  <td class="font-bold text-foreground">${g.name}</td>
                  <td><code>${g.command}</code></td>
                  <td class="text-muted-foreground">${g.frequency}</td>
                  <td class="text-right">
                    <span class="status-clean-complete">${ICONS.checkCircle} ${g.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Framework Scripts Directory -->
      <section class="scripts-directory-section" style="margin-top: 3rem;">
        <div class="section-bar-header">
          <span>Framework CLI Scripts (${scripts.length})</span>
        </div>

        <div class="domain-two-col-layout" style="margin-top: 1rem;">
          <!-- Scripts List -->
          <aside class="domain-sidebar">
            ${scripts.map(s => `
              <button class="domain-nav-item ${currentScript && currentScript.name === s.name ? 'active' : ''}" data-script-name="${s.name}">
                <span class="item-icon">${ICONS.terminal}</span>
                <div class="item-text-group">
                  <span class="item-name font-mono">${s.name}</span>
                  <span class="item-sub font-mono">${s.lines} LOC • ${s.isExecutable ? 'Executable' : 'Module'}</span>
                </div>
              </button>
            `).join('')}
          </aside>

          <!-- Script Details & Code Drawer -->
          <main class="domain-content-card">
            ${currentScript ? `
              <header class="doc-view-header">
                <div class="doc-title-row">
                  <h2 class="doc-view-title font-mono">${currentScript.name}</h2>
                  <span class="report-badge-pill font-mono">${currentScript.isExecutable ? 'EXECUTABLE SCRIPT' : 'HELPER MODULE'}</span>
                </div>
                <p class="script-desc text-muted-foreground font-mono" style="margin: 0.5rem 0;">
                  ${currentScript.description}
                </p>
                <div class="script-cmd-pill font-mono">
                  <code>$ ${currentScript.usage}</code>
                  ${currentScript.usage.startsWith('Helper') ? '' : `<button class="copy-hint font-mono text-xs" data-copy-command="${currentScript.usage}">Copy Command</button>`}
                </div>
              </header>

              <div class="script-code-container">
                <div class="section-subtitle font-mono" style="margin-bottom:0.5rem;">SOURCE CODE PREVIEW (${currentScript.lines} lines)</div>
                <pre class="script-code-pre"><code class="language-bash font-mono">${escapeHtml(currentScript.content || '')}</code></pre>
              </div>
            ` : `
              <div class="empty-state">Select a script to inspect its documentation and implementation.</div>
            `}
          </main>
        </div>
      </section>
    </div>
  `;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
