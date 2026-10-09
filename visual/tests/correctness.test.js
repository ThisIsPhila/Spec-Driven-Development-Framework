import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { extractProject } from '../server/extract.js';
import { LocalProjectService } from '../server/service.js';
import { renderSpecView } from '../src/views/specView.js';
import { sanitizeUi } from '../src/sanitize.js';
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-correct-'));
  const phase = path.join(root, '.sdd/specs/active/phase-001-example');
  fs.mkdirSync(phase, { recursive: true });
  fs.writeFileSync(path.join(phase, 'requirements.md'), '# Example\n**Status:** Approved\n### REQ-001.1: Working behavior\n');
  fs.writeFileSync(path.join(phase, 'tasks.md'), '# Tasks\n- [ ] **[T001.1]** Pending\n  - **Objective:** REQ-001.1\n## Completion criteria\nOwner accepts the product.\n');
  const evidenceDir = path.join(root, '.sdd/evidence/phase-001');
  fs.mkdirSync(evidenceDir, {recursive:true});
  fs.writeFileSync(path.join(evidenceDir, 'note.md'), '# Note\nREQ-001.1 is under investigation.\n');
  return { root, phase };
}
test('missing results, references and acceptance prose cannot certify work', () => {
  const { root } = fixture();
  try {
    const snapshot = extractProject(root); const phase = snapshot.phases[0];
    assert.equal(phase.artifacts.evidence[0].parsed.result, 'UNKNOWN');
    assert.equal(phase.metrics.verificationAssurance.passCount, 0);
    assert.equal(phase.metrics.traceability.verifiedRequirements, 0);
    assert.equal(phase.metrics.traceability.matrix[0].status, 'EVIDENCE_REFERENCED');
    assert.equal(phase.acceptanceCriteria.at(-1).done, false);
    assert.equal(snapshot.hooks.telemetry.passRate, null);
    assert.equal(snapshot.hooks.telemetry.lastRunTimestamp, '');
    assert.match(renderSpecView(phase, 'tasks'), /REQ-001.1/);
    assert.match(phase.tasks[0].contract, /Objective/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('real DOM sanitization removes executable metadata while preserving controls', () => {
  const html = sanitizeUi('<button data-filter="todo">Pending</button><svg onload="alert(1)"><g data-id="T1"></g></svg><img src="https://external.invalid/x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">x</a>');
  const doc = new window.DOMParser().parseFromString(html, 'text/html');
  assert.ok(doc.querySelector('button[data-filter="todo"]'));
  assert.equal(doc.querySelector('script,img,[onload],[onerror],[href^="javascript:"]'), null);
});
test('service isolates artifacts, rejects foreign origins and refreshes changed sources', async () => {
  const { root, phase } = fixture(); const sibling = root + '-sibling';
  fs.mkdirSync(sibling); fs.writeFileSync(path.join(sibling, 'outside.md'), 'outside');
  fs.symlinkSync(path.join(sibling, 'outside.md'), path.join(root, '.sdd/evidence/phase-001/escape.md'));
  // Remove escape until after initial extraction: the extractor also rejects escapes.
  assert.throws(() => extractProject(root), /escapes/);
  fs.unlinkSync(path.join(root, '.sdd/evidence/phase-001/escape.md'));
  const service = new LocalProjectService({ port: 0 }); const project = service.registerProject(root);
  const info = await service.start(); const base = `http://127.0.0.1:${info.port}`;
  const headers = { Authorization: `Bearer ${info.token}` };
  try {
    fs.symlinkSync(path.join(sibling, 'outside.md'), path.join(root, '.sdd/evidence/phase-001/escape.md'));
    const read = file => fetch(`${base}/api/project/${project.id}/artifact?path=${encodeURIComponent(file)}`, { headers });
    assert.equal((await read(path.join(root, '.sdd/evidence/phase-001/escape.md'))).status, 403);
    assert.equal((await read(path.join(sibling, 'outside.md'))).status, 403);
    fs.writeFileSync(path.join(root, 'private.md'), 'unrelated');
    assert.equal((await read('private.md')).status, 403);
    assert.equal((await fetch(base + '/api/projects', { headers: { ...headers, Origin: 'https://foreign.invalid' } })).status, 403);
    assert.equal((await fetch(base + '/api/projects', { method: 'POST', headers })).status, 405);
    fs.unlinkSync(path.join(root, '.sdd/evidence/phase-001/escape.md'));
    const before = project.lastSnapshot.contentRevision;
    fs.appendFileSync(path.join(phase, 'tasks.md'), '\n- [x] **[T001.2]** Added\n');
    const snapshot = await (await fetch(`${base}/api/project/${project.id}/snapshot`, { headers })).json();
    assert.notEqual(snapshot.contentRevision, before);
    assert.equal(snapshot.phases[0].taskCounts.total, 2);
  } finally { await service.stop(); fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(sibling, { recursive: true, force: true }); }
});
test('same-named projects register independently and repeated roots are idempotent', () => {
  const a = fixture(), b = fixture();
  const service = new LocalProjectService();
  try {
    const firstRoot=path.join(a.root,'same-name'), secondRoot=path.join(b.root,'same-name');
    fs.mkdirSync(firstRoot); fs.mkdirSync(secondRoot);
    fs.renameSync(path.join(a.root,'.sdd'),path.join(firstRoot,'.sdd'));
    fs.renameSync(path.join(b.root,'.sdd'),path.join(secondRoot,'.sdd'));
    const first = service.registerProject(firstRoot), second = service.registerProject(secondRoot);
    assert.notEqual(first.id, second.id);
    assert.equal(service.registerProject(firstRoot), first);
  } finally { service.stop(); fs.rmSync(a.root, {recursive:true,force:true}); fs.rmSync(b.root, {recursive:true,force:true}); }
});

test('read failures retain the last valid source and expose a bounded stale diagnostic', async () => {
  const {root,phase}=fixture(); const service=new LocalProjectService();
  const project=service.registerProject(root); const before=project.lastSnapshot.contentRevision;
  const outside=fs.mkdtempSync(path.join(os.tmpdir(),'sdd-outside-')); fs.writeFileSync(path.join(outside,'requirements.md'),'outside');
  try {
    fs.unlinkSync(path.join(phase,'requirements.md')); fs.symlinkSync(path.join(outside,'requirements.md'),path.join(phase,'requirements.md'));
    service._refreshProject(project.id);
    assert.equal(project.lastSnapshot.readStatus,'stale'); assert.notEqual(project.lastSnapshot.contentRevision,before);
    assert.match(project.lastSnapshot.phases[0].artifacts.requirements.content,/Working behavior/);
    const diagnostics=project.lastSnapshot.diagnostics.length;
    for(let i=0;i<5;i++)service._refreshProject(project.id);
    assert.equal(project.lastSnapshot.diagnostics.length,diagnostics);
  } finally {await service.stop();fs.rmSync(root,{recursive:true,force:true});fs.rmSync(outside,{recursive:true,force:true});}
});
