import { escapeHtml } from '../sanitize.js';

/**
 * Delivery view: task timing, Kiro usage and the three-way comparison.
 * Input is the parsed `.sdd/metrics/report.json` written by `phase.sh report --write`.
 * Credits and wall or agent time are measured. Tokens, dollars and human estimates are estimates.
 */

const HOURS_PER_WORKING_DAY = 6;

const num = value => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const fmtHours = value => (num(value) === null ? 'n/a' : `${value.toFixed(1)} h`);
const fmtDays = hours => (num(hours) === null ? 'n/a' : `${(hours / HOURS_PER_WORKING_DAY).toFixed(1)} working days`);
const fmtMinutes = minutes => {
  if (num(minutes) === null) return 'n/a';
  return minutes >= 120 ? `${(minutes / 60).toFixed(1)} h` : `${Math.round(minutes)} min`;
};
const fmtUsd = value => {
  if (num(value) === null) return 'n/a';
  return value < 1 ? `$${value.toFixed(3)}` : `$${value.toFixed(2)}`;
};
const fmtCredits = value => (num(value) === null ? 'n/a' : value.toFixed(2));

export function renderDeliveryView(report) {
  const phases = Array.isArray(report?.phases) ? report.phases.filter(phase => phase && typeof phase === 'object') : [];
  if (phases.length === 0) return renderEmptyState();

  return `
    <div class="domain-view-container delivery-view">
      <header class="domain-header">
        <div>
          <span class="domain-kicker font-mono">DELIVERY</span>
          <h1 class="domain-title">Task timing, usage and comparison</h1>
          <p class="domain-subtitle font-mono">Human estimate against the models that did the work, per phase.</p>
        </div>
      </header>
      <p class="delivery-caption">
        Credits, wall time and agent time are measured. Tokens and dollars are estimates, and so are the human estimates.
        Rates as of ${escapeHtml(report.rates_as_of ?? 'not recorded')}. Generated ${escapeHtml(report.generated ?? 'not recorded')}.
      </p>
      ${phases.map(phase => renderPhase(phase, report)).join('')}
    </div>
  `;
}

function renderEmptyState() {
  return `
    <div class="empty-state delivery-empty">
      <p>No delivery report yet. Expected at <code>.sdd/metrics/report.json</code>.</p>
      <p class="text-muted">Run <code>phase.sh usage</code> to attribute Kiro session usage to task windows, then <code>phase.sh report --write</code> to write the report.</p>
    </div>
  `;
}

function renderPhase(phase, report) {
  const totals = phase.totals && typeof phase.totals === 'object' ? phase.totals : {};
  const rows = Array.isArray(phase.rows) ? phase.rows.filter(row => row && typeof row === 'object') : [];
  const agentMinutes = num(totals.child_agent_s) === null ? null : totals.child_agent_s / 60;

  return `
    <section class="delivery-phase" aria-label="Delivery for ${escapeHtml(phase.phase ?? 'phase')}">
      <h2 class="delivery-phase-title font-mono">${escapeHtml(phase.phase ?? 'Unnamed phase')}</h2>
      <div class="matrix-container">
        <table class="matrix-table delivery-compare-table">
          <thead>
            <tr><th>Basis</th><th>Time</th><th>Cost</th><th>Detail</th></tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Human developer</th>
              <td>${fmtHours(totals.human_hours)} (${fmtDays(totals.human_hours)} at ${HOURS_PER_WORKING_DAY} h/day)</td>
              <td>${fmtUsd(totals.human_usd)}</td>
              <td>Sum of human estimates. Estimate.</td>
            </tr>
            <tr>
              <th scope="row">Used model (agents)</th>
              <td>Wall ${fmtMinutes(totals.wall_min)}; agent ${fmtMinutes(agentMinutes)}</td>
              <td>${fmtUsd(totals.child_usd)} agents, ${fmtUsd(totals.lead_usd)} lead. Estimate.</td>
              <td>${fmtCredits(totals.child_credits)} agent credits, ${fmtCredits(totals.lead_credits)} lead credits. Measured.</td>
            </tr>
            <tr>
              <th scope="row">Comparison model (${escapeHtml(report.comparison_model ?? 'not recorded')})</th>
              <td>See <code>delivery-report.md</code></td>
              <td>${fmtUsd(totals.child_usd_cmp)} agents. Estimate.</td>
              <td>Same tokens priced on the comparison model.</td>
            </tr>
          </tbody>
        </table>
      </div>
      ${renderTaskTable(rows)}
    </section>
  `;
}

function renderTaskTable(rows) {
  if (rows.length === 0) return '<p class="text-muted">No tasks in this phase.</p>';

  return `
    <div class="matrix-container">
      <table class="matrix-table delivery-task-table">
        <thead>
          <tr>
            <th>Task</th><th>Executor</th><th>Risk</th><th>Human est.</th><th>Time budget</th>
            <th>Wall time</th><th>Agent credits</th><th>Est. agent USD</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(renderTaskRow).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderTaskRow(row) {
  const child = row.child && typeof row.child === 'object' ? row.child : {};
  const badge = row.over_budget === true ? ' <span class="status-badge-gap delivery-over-budget">Over budget</span>' : '';
  return `
    <tr>
      <td class="mono">${escapeHtml(row.id ?? '')}<br><span class="delivery-task-title">${escapeHtml(row.title ?? '')}</span></td>
      <td>${escapeHtml(row.executor ?? 'n/a')}</td>
      <td>${escapeHtml(row.risk ?? 'n/a')}</td>
      <td>${fmtHours(row.human_hours)}</td>
      <td>${fmtMinutes(row.time_budget_min)}</td>
      <td>${fmtMinutes(row.wall_min)}${badge}</td>
      <td>${fmtCredits(child.credits)}</td>
      <td>${fmtUsd(child.usd)}</td>
    </tr>
  `;
}
