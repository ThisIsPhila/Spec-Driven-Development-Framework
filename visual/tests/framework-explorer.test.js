import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractProject } from '../server/extract.js';
import { renderPhaseExplorerView } from '../src/views/phaseExplorerView.js';
import { renderGovernanceView } from '../src/views/governanceView.js';
import { renderReportsView } from '../src/views/reportsView.js';
import { renderAutomationView } from '../src/views/automationView.js';
import { renderKnowledgeView } from '../src/views/knowledgeView.js';
import demoSnapshot from '../demo/demo-project.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_PROJECT_DIR = path.resolve(__dirname, '../..');

test('extracts comprehensive framework elements from repository', () => {
  const snapshot = extractProject(ROOT_PROJECT_DIR);

  // Framework core
  assert.ok(snapshot.framework, 'framework core should exist');
  assert.ok(snapshot.framework.constitution?.content, 'constitution content must exist');
  assert.ok(snapshot.framework.onboarding?.content, 'onboarding content must exist');

  // Memories & Rules
  assert.ok(Array.isArray(snapshot.memories), 'memories should be an array');
  assert.ok(snapshot.memories.length >= 5, 'should extract at least 5 memory files');
  assert.ok(snapshot.memories.some(m => m.id === 'active-context' || m.id === 'progress-tracker'));

  assert.ok(Array.isArray(snapshot.rules), 'rules should be an array');
  assert.ok(snapshot.rules.length >= 4, 'should extract rules');
  assert.ok(snapshot.rules.some(r => r.id === 'before-task'));

  // Reports & Audits
  assert.ok(Array.isArray(snapshot.reports), 'reports should be an array');
  assert.ok(snapshot.reports.length >= 2, 'should extract closeout and audit reports');

  // Automation & Hooks
  assert.ok(Array.isArray(snapshot.scripts), 'scripts should be an array');
  assert.ok(snapshot.scripts.some(s => s.name === 'doctor.sh'));
  assert.ok(snapshot.hooks, 'hooks object should exist');
  assert.ok(snapshot.hooks.installed, 'pre-commit hook should be installed');
  assert.equal(snapshot.hooks.telemetry.totalGatesRun, snapshot.hooks.telemetry.records.length);
  if (!snapshot.hooks.telemetry.records.length) { assert.equal(snapshot.hooks.telemetry.passRate, null); assert.equal(snapshot.hooks.telemetry.lastRunTimestamp, ''); }
  else assert.equal(snapshot.hooks.telemetry.lastRunTimestamp, snapshot.hooks.telemetry.records.at(-1).timestamp);
  assert.ok(snapshot.hooks.telemetry.gatesList?.length >= 2);

  // Docs & Templates & Graphify
  assert.ok(Array.isArray(snapshot.templates), 'templates should be an array');
  assert.ok(snapshot.templates.length >= 5, 'should extract templates');
  assert.ok(Array.isArray(snapshot.docs), 'docs should be an array');
  assert.ok(snapshot.docs.length >= 4, 'should extract docs');

  assert.ok(snapshot.graphify, 'graphify object should exist');
  assert.ok(snapshot.graphify.nodes?.length > 10, 'graphify nodes should exist');

  // Phase artifacts
  const phase5 = snapshot.phases.find(p => p.id === 'phase-005-visual-framework-workspace');
  assert.ok(phase5, 'Phase 005 should exist');
  assert.ok(Array.isArray(phase5.acceptanceCriteria), 'acceptance criteria should exist');
  assert.ok(phase5.acceptanceCriteria.length > 0, 'Phase 005 should extract acceptance criteria');
  assert.ok(Array.isArray(phase5.limitations), 'limitations should exist');
  assert.ok(Array.isArray(phase5.remediations), 'remediations should exist');
  assert.ok(Array.isArray(phase5.futureWork), 'future work should exist');
});

test('renderPhaseExplorerView renders scalable on-screen navigator and phase canvas', () => {
  const state = {
    activePhaseId: 'phase-003-stripe-webhook-handling',
    phaseTab: 'overview',
    phaseScopeFilter: 'all',
    phaseSearchQuery: '',
  };

  const html = renderPhaseExplorerView(demoSnapshot, state);
  assert.ok(html.includes('phase-nav-sidebar'), 'must contain on-screen sidebar');
  assert.ok(html.includes('phase-search-field'), 'must contain search input for 50+ phases');
  assert.ok(html.includes('data-scope-filter="all"'), 'must contain scope filters');
  assert.ok(html.includes('phase-workspace-main'), 'must contain phase canvas');
  assert.ok(html.includes('requirements.md'), 'must surface requirements tab');
  assert.ok(html.includes('Evidence & Acceptance'), 'must surface evidence & acceptance tab');
  assert.ok(html.includes('Remediations & Future'), 'must surface remediations & future tab');
});

test('renderGovernanceView surfaces constitution, memories and enforced rules', () => {
  const html = renderGovernanceView(demoSnapshot, 'constitution');
  assert.ok(html.includes('Constitution'), 'must include constitution');
  assert.ok(html.includes('PROJECT MEMORIES'), 'must include memories navigation');
  assert.ok(html.includes('DECLARED RULES'), 'must include rules navigation');
});

test('renderAutomationView surfaces scripts and Git pre-commit telemetry', () => {
  const html = renderAutomationView(demoSnapshot, 'doctor.sh');
  assert.ok(html.includes('Git Pre-Commit Quality Gate'), 'must show git hook status');
  assert.ok(html.includes('GATES DECLARED IN HOOK SOURCE'), 'must show executed gates table');
  assert.ok(html.includes('doctor.sh'), 'must list scripts');
  assert.ok(html.includes('SOURCE CODE PREVIEW'), 'must include script code preview');
});

test('renderKnowledgeView surfaces spec templates, docs and Graphify network', () => {
  const htmlTpl = renderKnowledgeView(demoSnapshot, 'templates', null);
  assert.ok(htmlTpl.includes('OFFICIAL TEMPLATES'), 'must list templates');
  assert.ok(htmlTpl.includes('Copy Template'), 'must include copy template button');

  const htmlGraph = renderKnowledgeView(demoSnapshot, 'graphify', null);
  assert.ok(htmlGraph.includes('Derived Artifact Map'), 'must show graphify network');
  assert.ok(htmlGraph.includes('Governance & Rules'), 'must show governance entity column');
});

test('actual Graphify exports show topology and external node types instead of an empty matrix', () => {
  const snapshot={graphify:{source:'graphify-export',nodes:[{id:'file-a',label:'Requirements source',type:'file'},{id:'function-b',label:'Task parser',type:'function'}],edges:[{from:'file-a',to:'function-b',label:'calls',provenance:'EXTRACTED'}]}};
  const html=renderKnowledgeView(snapshot,'graphify');
  assert.match(html,/Imported Graphify topology/);
  assert.match(html,/Requirements source/);
  assert.match(html,/Task parser/);
  assert.match(html,/<line /);
  assert.match(html,/EXTRACTED/);
});
