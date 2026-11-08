import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDeliveryView } from '../src/views/deliveryView.js';

function task(overrides = {}) {
  return {
    id: 'T007.1',
    title: 'Plain title',
    status: 'done',
    executor: 'kiro',
    risk: 'low',
    human_hours: 3,
    time_budget_min: 60,
    token_budget: null,
    wall_min: 45,
    over_budget: false,
    child: { credits: 1.5, agent_s: 600, usd: 0.4, usd_cmp: 1.2, tokens_out: 900, tokens_in_total: 5000, models: ['model-a'] },
    lead: { credits: 0.5, usd: 0.1 },
    ...overrides,
  };
}

function fixtureReport(rows = [task()]) {
  return {
    generated: '2026-11-08T10:00:00.000Z',
    rates_as_of: '2026-10-01',
    comparison_model: 'comparison-model-x',
    phases: [{
      phase: 'phase-007-delivery',
      rows,
      totals: {
        tasks: rows.length,
        done: rows.length,
        with_estimate: rows.length,
        human_hours: 3,
        human_usd: 300,
        wall_min: 45,
        measured_tasks: rows.length,
        child_credits: 1.5,
        child_agent_s: 600,
        child_usd: 0.4,
        child_usd_cmp: 1.2,
        lead_credits: 0.5,
        lead_usd: 0.1,
        over_budget: rows.filter(row => row.over_budget === true).length,
      },
    }],
  };
}

function compareTableBodyRows(html) {
  const table = html.slice(html.indexOf('delivery-compare-table'));
  const body = table.slice(table.indexOf('<tbody>'), table.indexOf('</tbody>'));
  return body.split('<tr>').length - 1;
}

test('delivery view renders the three comparison rows for a phase', () => {
  const html = renderDeliveryView(fixtureReport());
  assert.equal(compareTableBodyRows(html), 3);
  assert.ok(html.includes('Human developer'));
  assert.ok(html.includes('Used model (agents)'));
  assert.ok(html.includes('Comparison model (comparison-model-x)'));
  assert.ok(html.includes('See <code>delivery-report.md</code>'));
  assert.ok(html.includes('2026-10-01'), 'rates_as_of must be shown');
});

test('delivery view escapes data values such as task titles', () => {
  const html = renderDeliveryView(fixtureReport([task({ title: '<script>alert(1)</script>' })]));
  assert.ok(!html.includes('<script>'), 'raw script tag must not be emitted');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('over-budget badge appears only when over_budget is true', () => {
  const badge = 'delivery-over-budget';
  const overHtml = renderDeliveryView(fixtureReport([task({ over_budget: true })]));
  assert.equal(overHtml.split(badge).length - 1, 1);

  const withinHtml = renderDeliveryView(fixtureReport([task({ over_budget: false })]));
  assert.equal(withinHtml.split(badge).length - 1, 0);

  const unknownHtml = renderDeliveryView(fixtureReport([task({ over_budget: null })]));
  assert.equal(unknownHtml.split(badge).length - 1, 0);
});

test('delivery view shows the empty state for a null report', () => {
  const html = renderDeliveryView(null);
  assert.ok(html.includes('delivery-empty'));
  assert.ok(html.includes('phase.sh report --write'));
  assert.ok(!html.includes('delivery-compare-table'));
});
