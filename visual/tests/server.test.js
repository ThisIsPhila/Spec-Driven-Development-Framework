import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { LocalProjectService } from '../server/service.js';

const FIXTURES_DIR = path.resolve('tests/fixtures');
const canonicalPath = path.join(FIXTURES_DIR, 'canonical-project');

test('server handles auth, snapshots, and security bounds', async () => {
  const service = new LocalProjectService({ port: 0 }); // port 0 for random free port
  service.registerProject(canonicalPath);
  const info = await service.start();

  try {
    const baseUrl = `http://127.0.0.1:${info.port}`;

    // 1. Missing token -> 401
    const unauthRes = await fetch(`${baseUrl}/api/projects`);
    assert.equal(unauthRes.status, 401);

    // 2. Valid token -> 200
    const authRes = await fetch(`${baseUrl}/api/projects?token=${info.token}`);
    assert.equal(authRes.status, 200);
    const projects = await authRes.json();
    assert.equal(projects.length, 1);
    assert.equal(projects[0].id, 'canonical-project');

    // 3. Snapshot endpoint
    const snapRes = await fetch(`${baseUrl}/api/project/canonical-project/snapshot?token=${info.token}`);
    assert.equal(snapRes.status, 200);
    const snapshot = await snapRes.json();
    assert.equal(snapshot.projectId, 'canonical-project');
    assert.equal(snapshot.phases.length, 1);

    // 4. Path traversal protection on artifact endpoint
    const traversalRes = await fetch(`${baseUrl}/api/project/canonical-project/artifact?token=${info.token}&path=../../package.json`);
    assert.equal(traversalRes.status, 403);

    // 5. Valid artifact read
    const validArtRes = await fetch(`${baseUrl}/api/project/canonical-project/artifact?token=${info.token}&path=.sdd/specs/active/phase-002-api-integration/requirements.md`);
    assert.equal(validArtRes.status, 200);
    const text = await validArtRes.text();
    assert.ok(text.includes('API Integration'));

    // 6. SSE Connection
    const sseRes = await fetch(`${baseUrl}/api/project/canonical-project/events?token=${info.token}`);
    assert.equal(sseRes.status, 200);
    assert.equal(sseRes.headers.get('content-type'), 'text/event-stream');

  } finally {
    await service.stop();
  }
});
