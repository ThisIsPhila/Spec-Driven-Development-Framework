import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderLandingView } from '../src/views/landingView.js';
import { renderOverviewView } from '../src/views/overviewView.js';
import { renderSpecView } from '../src/views/specView.js';
import { renderEvidenceView } from '../src/views/evidenceView.js';
import { generateTraceabilitySvg, generateTraceabilityList } from '../src/traceability.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoJsonPath = path.resolve(__dirname, '../demo/demo-project.json');

test('synthetic demo dataset is valid and free of sensitive private paths', () => {
  assert.ok(fs.existsSync(demoJsonPath), 'demo-project.json must exist');
  const raw = fs.readFileSync(demoJsonPath, 'utf8');

  // Verify no real local developer paths or keys are present
  assert.ok(!raw.includes('/Users/'), 'must not contain real macOS user paths');
  assert.ok(!raw.includes('/home/'), 'must not contain real linux user paths');
  assert.ok(!raw.includes('secret_'), 'must not contain live secrets');

  const demoData = JSON.parse(raw);
  assert.equal(demoData.profile, 'api');
  assert.equal(demoData.activePhaseId, 'phase-003-stripe-webhook-handling');
  assert.ok(demoData.phases.length >= 3, 'should include active and archived phases');

  const activePhase = demoData.phases.find(p => p.id === demoData.activePhaseId);
  assert.ok(activePhase, 'active phase must be present');
  assert.equal(activePhase.taskCounts.total, 4);
  assert.equal(activePhase.taskCounts.completed, 2);
  assert.equal(activePhase.taskCounts.inProgress, 1);
  assert.equal(activePhase.taskCounts.pending, 1);
});

test('landing view renders hero, install command, and profiles catalog', () => {
  const html = renderLandingView();
  assert.ok(html.includes('Spec-Driven Development'), 'Hero title should be present');
  assert.ok(html.includes('git clone https://github.com/'), 'Setup command should be present');
  assert.ok(html.includes('Launch Interactive Demo'), 'Demo CTA should be present');
  assert.ok(html.includes('devsecops'), 'Profiles catalog should include devsecops');
  assert.ok(html.includes('mlops'), 'Profiles catalog should include mlops');
  assert.ok(html.includes('Intent Before Code'), 'Pillars should be present');
});

test('demo phase integrates with workspace views without errors', () => {
  const raw = fs.readFileSync(demoJsonPath, 'utf8');
  const demoData = JSON.parse(raw);
  const activePhase = demoData.phases.find(p => p.id === demoData.activePhaseId);

  // Overview View
  const overviewHtml = renderOverviewView(activePhase);
  assert.ok(overviewHtml.includes('aria-label="Phase Lifecycle Progress"'));
  assert.ok(overviewHtml.includes('50%'));
  assert.ok(overviewHtml.includes('T003.3')); // in-progress active task

  // Requirements & Tasks Views
  const reqHtml = renderSpecView(activePhase, 'requirements');
  assert.ok(reqHtml.includes('REQ-003.1'));
  const taskHtml = renderSpecView(activePhase, 'tasks', 'all');
  assert.ok(taskHtml.includes('T003.1'));
  assert.ok(taskHtml.includes('T003.2'));

  // Evidence View
  const evidenceHtml = renderEvidenceView(activePhase);
  assert.ok(evidenceHtml.includes('webhook-idempotency.md'));
  assert.ok(evidenceHtml.includes('7b29e01'));
  assert.ok(evidenceHtml.includes('PASS'));

  // Traceability Views
  const svgHtml = generateTraceabilitySvg(activePhase);
  assert.ok(svgHtml.includes('REQ-003.1'));
  assert.ok(svgHtml.includes('T003.1'));
  const listHtml = generateTraceabilityList(activePhase);
  assert.ok(listHtml.includes('role="list"'));
});

test('rendered views are completely free of emojis and contain vector SVG icons', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
  const raw = fs.readFileSync(demoJsonPath, 'utf8');
  const demoData = JSON.parse(raw);
  const activePhase = demoData.phases.find(p => p.id === demoData.activePhaseId);

  const landingHtml = renderLandingView();
  assert.equal(emojiRegex.test(landingHtml), false, 'Landing view must have 0 emojis');
  assert.ok(landingHtml.includes('agent-brand-icon'), 'Landing view must include agent brand icons');
  assert.ok(landingHtml.includes('skills-table-responsive-wrapper'), 'Landing view must include responsive table wrapper');

  const overviewHtml = renderOverviewView(activePhase);
  assert.equal(emojiRegex.test(overviewHtml), false, 'Overview view must have 0 emojis');

  const specHtml = renderSpecView(activePhase, 'tasks', 'all');
  assert.equal(emojiRegex.test(specHtml), false, 'Spec tasks view must have 0 emojis');

  const evidenceHtml = renderEvidenceView(activePhase);
  assert.equal(emojiRegex.test(evidenceHtml), false, 'Evidence view must have 0 emojis');
});

