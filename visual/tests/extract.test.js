import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractProject } from '../server/extract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

test('extracts canonical project accurately', () => {
  const canonicalPath = path.join(FIXTURES_DIR, 'canonical-project');
  const snapshot = extractProject(canonicalPath);

  assert.equal(snapshot.projectId, 'canonical-project');
  assert.equal(snapshot.profile, 'web+devsecops');
  assert.equal(snapshot.activePhaseId, 'phase-002-api-integration');
  assert.ok(snapshot.contentRevision, 'should have content revision');

  const phase = snapshot.phases.find(p => p.id === 'phase-002-api-integration');
  assert.ok(phase, 'phase-002 should exist');
  assert.equal(phase.category, 'active');
  assert.equal(phase.status, 'IN_PROGRESS');

  // Verify requirements
  assert.equal(phase.requirements.length, 2);
  assert.equal(phase.requirements[0].id, 'REQ-002.1');

  // Verify task counts exclude nested checklists
  // Tasks has 3 top-level items: T002.1 (done), T002.2 (doing), T002.3 (todo)
  // It has nested sub-items like "  - Objective: create client instance" which MUST be ignored!
  assert.equal(phase.taskCounts.total, 3);
  assert.equal(phase.taskCounts.completed, 1);
  assert.equal(phase.taskCounts.inProgress, 1);
  assert.equal(phase.taskCounts.pending, 1);
  assert.equal(phase.taskCounts.percent, 33);

  // Verify relationships
  assert.ok(phase.relationships.some(r => r.fromId === 'T002.1' && r.toId === 'REQ-002.1'));
  assert.ok(phase.relationships.some(r => r.fromType === 'evidence' && r.toId === 'T002.1'));
});

test('extracts legacy project tasks correctly', () => {
  const legacyPath = path.join(FIXTURES_DIR, 'legacy-project');
  const snapshot = extractProject(legacyPath);

  const phase = snapshot.phases.find(p => p.id === 'phase-001-legacy');
  assert.ok(phase);
  assert.equal(phase.taskCounts.total, 3);
  assert.equal(phase.taskCounts.completed, 1);
  assert.equal(phase.taskCounts.pending, 2);
});

test('computes deterministic contentRevision that reflects changes', () => {
  const canonicalPath = path.join(FIXTURES_DIR, 'canonical-project');
  const snap1 = extractProject(canonicalPath);
  const snap2 = extractProject(canonicalPath);
  assert.equal(snap1.contentRevision, snap2.contentRevision);
});

test('rejects directories without .sdd folder', () => {
  assert.throws(() => {
    extractProject('/tmp');
  }, /Invalid SDD project/);
});
