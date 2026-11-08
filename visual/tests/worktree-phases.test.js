import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { extractProject, listSiblingWorktrees } from '../server/extract.js';
import { LocalProjectService } from '../server/service.js';

const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.email=t@example.invalid', '-c', 'user.name=t', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const TASKS = (a, b) => `# Tasks\n\n- [${a}] **[T1.1]** First\n  - **Objective and requirements:** x\n\n- [${b}] **[T1.2]** Second\n  - **Objective and requirements:** y\n`;

function makeRepo() {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-wt-')));
  const main = path.join(base, 'main');
  fs.mkdirSync(path.join(main, '.sdd', 'specs', 'active', 'phase-001-demo'), { recursive: true });
  fs.writeFileSync(path.join(main, '.sdd', 'specs', 'active', 'phase-001-demo', 'requirements.md'), '# Demo - Requirements\n\n**Status:** APPROVED\n');
  fs.writeFileSync(path.join(main, '.sdd', 'specs', 'active', 'phase-001-demo', 'tasks.md'), TASKS(' ', ' '));
  git(base, 'init', '-q', '-b', 'main', main);
  git(main, 'add', '.');
  git(main, 'commit', '-qm', 'init');
  return { base, main };
}

const completed = (snap) => snap.phases.find(p => p.id === 'phase-001-demo').tasks.filter(t => t.status === 'done').length;

test('an active phase is read from the worktree that has its feat/<phase> branch checked out', () => {
  const { base, main } = makeRepo();
  try {
    assert.equal(completed(extractProject(main)), 0);
    const wt = path.join(base, 'wt');
    git(main, 'worktree', 'add', '-q', '-b', 'feat/phase-001-demo', wt);
    fs.writeFileSync(path.join(wt, '.sdd', 'specs', 'active', 'phase-001-demo', 'tasks.md'), TASKS('x', '/'));
    const snap = extractProject(main);
    const phase = snap.phases.find(p => p.id === 'phase-001-demo');
    assert.equal(completed(snap), 1, 'the checked-off task in the worktree is counted');
    assert.equal(phase.tasks.filter(t => t.status === 'doing').length, 1);
    assert.equal(phase.liveSource.branch, 'feat/phase-001-demo');
    assert.equal(phase.liveSource.worktree, wt);
    assert.ok(snap.diagnostics.some(d => d.message.includes('read from the worktree')));
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('a worktree on a different branch does not replace the phase', () => {
  const { base, main } = makeRepo();
  try {
    const wt = path.join(base, 'wt');
    git(main, 'worktree', 'add', '-q', '-b', 'scratch/other', wt);
    fs.writeFileSync(path.join(wt, '.sdd', 'specs', 'active', 'phase-001-demo', 'tasks.md'), TASKS('x', 'x'));
    const snap = extractProject(main);
    assert.equal(completed(snap), 0);
    assert.equal(snap.phases.find(p => p.id === 'phase-001-demo').liveSource, undefined);
    assert.deepEqual(listSiblingWorktrees(main).map(w => w.branch), ['scratch/other']);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('a project that is not a git repository still extracts, with no worktrees', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-nogit-')));
  try {
    fs.mkdirSync(path.join(dir, '.sdd', 'specs', 'active', 'phase-001-demo'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.sdd', 'specs', 'active', 'phase-001-demo', 'tasks.md'), TASKS('x', ' '));
    assert.deepEqual(listSiblingWorktrees(dir), []);
    assert.equal(completed(extractProject(dir)), 1);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the artifact endpoint serves a live worktree file but not paths outside the repository', async () => {
  const { base, main } = makeRepo();
  const service = new LocalProjectService({ port: 0 });
  try {
    const wt = path.join(base, 'wt');
    git(main, 'worktree', 'add', '-q', '-b', 'feat/phase-001-demo', wt);
    fs.writeFileSync(path.join(wt, '.sdd', 'specs', 'active', 'phase-001-demo', 'tasks.md'), TASKS('x', 'x'));
    fs.writeFileSync(path.join(base, 'outside.md'), 'secret');
    const project = service.registerProject(main);
    const info = await service.start();
    const get = (p) => fetch(`http://127.0.0.1:${info.port}/api/project/${project.id}/artifact?path=${encodeURIComponent(p)}&token=${info.token}`);
    const live = await get(path.join(wt, '.sdd', 'specs', 'active', 'phase-001-demo', 'tasks.md'));
    assert.equal(live.status, 200);
    assert.match(await live.text(), /\[x\] \*\*\[T1\.2\]/);
    assert.equal((await get(path.join(base, 'outside.md'))).status, 403, 'a file outside every worktree is refused');
    assert.equal((await get('../outside.md')).status, 403, 'a relative escape is refused');
  } finally {
    await service.stop?.();
    fs.rmSync(base, { recursive: true, force: true });
  }
});
