import { escapeDisplayModel } from '../sanitize.js';
import { renderMarkdown } from '../markdown.js';
import { ICONS } from '../icons.js';

/**
 * Scripts & Hooks Automation View
 * Surfaces framework automation scripts, git pre-commit quality gates,
 * and hook execution tracking telemetry — including a visual sparkline timeline
 * and per-gate pass/fail breakdown chart.
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
          <span class="domain-kicker font-mono">AUTOMATION &amp; QUALITY GATES</span>
          <h1 class="domain-title">Framework Scripts &amp; Git Hook Telemetry</h1>
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
          ${telemetry.historyStatus || 'Execution history not recorded'}. Git hooks can be bypassed.
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
            <span class="cell-val mono">Commit ${telemetry.lastCommitChecked || 'Not recorded'}</span>
          </div>
          <div class="telemetry-stat-cell">
            <span class="cell-label">Hook Location</span>
            <span class="cell-val"><code>${hooks.path || '.git/hooks/pre-commit'}</code></span>
          </div>
        </div>

        ${renderHookRunTimeline(telemetry)}
        ${renderGateBreakdown(telemetry)}

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

/**
 * Renders a sparkline-style timeline of hook run sessions.
 * Each column = one commit session. Rows = gates. Dots are colour-coded PASS/FAIL/SKIPPED.
 */
function renderHookRunTimeline(telemetry) {
  const records = telemetry.records || [];
  if (!records.length) return '';

  // Group records by runId (one runId = one commit session)
  const sessions = new Map();
  for (const r of records) {
    if (!sessions.has(r.runId)) {
      sessions.set(r.runId, { runId: r.runId, timestamp: r.timestamp, tree: r.tree, gates: [] });
    }
    sessions.get(r.runId).gates.push({ command: r.command, result: r.result });
  }

  const sessionList = Array.from(sessions.values());
  const visible = sessionList.slice(-32); // oldest → newest left to right
  const allGates = [...new Set(records.map(r => r.command))].sort();

  const colWidth = 16;
  const dotR = 4;
  const gapY = 16;
  const headerH = 8;
  const svgH = headerH + allGates.length * gapY + 18;
  const svgW = visible.length * colWidth + 64;

  const gateY = allGates.map((_, i) => headerH + i * gapY + dotR + 2);

  const connectors = allGates.map((_, i) =>
    `<line x1="54" y1="${gateY[i]}" x2="${svgW - 4}" y2="${gateY[i]}" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="2,4"/>`
  ).join('');

  const gateLabels = allGates.map((gate, i) =>
    `<text x="2" y="${gateY[i] + 4}" class="tel-gate-label">${gate}</text>`
  ).join('');

  const cols = visible.map((sess, colIdx) => {
    const x = 54 + colIdx * colWidth;
    return allGates.map((gate, gi) => {
      const rec = sess.gates.find(g => g.command === gate);
      const result = rec?.result || 'UNRECORDED';
      const fill = result === 'PASS' ? '#10b981' : result === 'FAIL' ? '#ef4444' : result === 'SKIPPED' ? '#f59e0b' : '#444';
      const ts = sess.timestamp ? new Date(sess.timestamp).toLocaleString() : 'unknown time';
      return `<circle cx="${x}" cy="${gateY[gi]}" r="${dotR}" fill="${fill}" opacity="0.92"><title>${gate}: ${result} — ${ts}\nTree: ${(sess.tree || '').slice(0, 12)}</title></circle>`;
    }).join('');
  }).join('');

  const n = visible.length;
  const oldest = n ? `<text x="54" y="${svgH - 2}" class="tel-gate-label" text-anchor="middle">oldest</text>` : '';
  const latest = n ? `<text x="${54 + (n - 1) * colWidth}" y="${svgH - 2}" class="tel-gate-label" text-anchor="middle">latest</text>` : '';

  return `
    <div class="telemetry-timeline-section">
      <div class="section-subtitle font-mono" style="margin-bottom:0.5rem;">
        HOOK RUN HISTORY — ${n} SESSIONS (${records.length} GATE EXECUTIONS TOTAL)
      </div>
      <div class="telemetry-timeline-legend font-mono">
        <span class="tel-legend-dot" style="background:#10b981;"></span>Pass
        <span class="tel-legend-dot" style="background:#ef4444;margin-left:0.75rem;"></span>Fail
        <span class="tel-legend-dot" style="background:#f59e0b;margin-left:0.75rem;"></span>Skipped
        <span class="tel-legend-dot" style="background:#444;margin-left:0.75rem;"></span>Not recorded
      </div>
      <div class="telemetry-timeline-scroll">
        <svg width="${svgW}" height="${svgH}" class="tel-sparkline-svg" aria-label="Hook run history timeline" role="img">
          ${connectors}
          ${gateLabels}
          ${cols}
          ${oldest}
          ${latest}
        </svg>
      </div>
      <p class="tel-timeline-note font-mono">Each column is one commit session. Hover a dot to inspect result. Indexed trees only — not verified commit attestations.</p>
    </div>
  `;
}

/**
 * Renders per-gate stacked pass/fail/skip bars.
 */
function renderGateBreakdown(telemetry) {
  const records = telemetry.records || [];
  if (!records.length) return '';

  const gateMap = new Map();
  for (const r of records) {
    if (!gateMap.has(r.command)) gateMap.set(r.command, { pass: 0, fail: 0, skip: 0, total: 0 });
    const e = gateMap.get(r.command);
    e.total++;
    if (r.result === 'PASS') e.pass++;
    else if (r.result === 'FAIL') e.fail++;
    else e.skip++;
  }

  const rows = Array.from(gateMap.entries()).map(([name, c]) => {
    const pW = c.total ? Math.round((c.pass / c.total) * 100) : 0;
    const fW = c.total ? Math.round((c.fail / c.total) * 100) : 0;
    const sW = Math.max(0, 100 - pW - fW);
    return `
      <div class="gate-breakdown-row">
        <span class="gate-breakdown-name font-mono">${name}</span>
        <div class="gate-breakdown-bar" title="${c.pass} pass / ${c.fail} fail / ${c.skip} skip of ${c.total} runs">
          <div class="gdb-pass" style="width:${pW}%"></div>
          <div class="gdb-fail" style="width:${fW}%"></div>
          <div class="gdb-skip" style="width:${sW}%"></div>
        </div>
        <span class="gate-breakdown-count font-mono">${c.pass}/${c.total}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="telemetry-gate-breakdown-section">
      <div class="section-subtitle font-mono" style="margin-bottom:0.5rem;">PER-GATE PASS RATE</div>
      <div class="gate-breakdown-list">${rows}</div>
    </div>
  `;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
