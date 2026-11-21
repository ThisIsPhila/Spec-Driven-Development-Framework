import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalDaemon } from '../packages/local-daemon/src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

test('LocalDaemon serves project snapshot and telemetry directly on loopback without ephemeral token', async () => {
  const daemon = new LocalDaemon({ port: 0, pollIntervalMs: 60000 });
  const registered = daemon.registerProject(repoRoot);
  const info = await daemon.start();
  try {
    const health = await fetch(`${info.url}api/health`);
    assert.equal(health.status, 200);
    const healthJson = await health.json();
    assert.equal(healthJson.status, 'ok');
    assert.equal(healthJson.mode, 'local');
    assert.ok(healthJson.projects.some((p) => p.id === registered.id));

    const snapRes = await fetch(`${info.url}api/project/${encodeURIComponent(registered.id)}/snapshot`);
    assert.equal(snapRes.status, 200);
    const snap = await snapRes.json();
    assert.ok(Array.isArray(snap.phases));
    assert.ok(snap.telemetry);
    assert.ok(Array.isArray(snap.telemetry.attribution));
    assert.ok(snap.telemetry.rollups);

    const portable = daemon.getPortableSnapshot(registered.id);
    assert.equal(portable.projectRoot, undefined);
  } finally {
    await daemon.stop();
  }
});

test('LocalDaemon rejects foreign Origin headers with 403', async () => {
  const daemon = new LocalDaemon({ port: 0, pollIntervalMs: 60000 });
  daemon.registerProject(repoRoot);
  const info = await daemon.start();
  try {
    const bad = await fetch(`${info.url}api/health`, {
      headers: { Origin: 'https://evil.example.com' },
    });
    assert.equal(bad.status, 403);
  } finally {
    await daemon.stop();
  }
});
