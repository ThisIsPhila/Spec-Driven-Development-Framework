import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../packages/cloud-api/api/cloud/sync.js';
import importHandler, { importGitHubSdd, parseGitHubRepoInput } from '../packages/cloud-api/api/cloud/import-github.js';

function mockRes() {
  const out = { statusCode: 200, body: null };
  return {
    status(code) {
      out.statusCode = code;
      return this;
    },
    json(payload) {
      out.body = payload;
      return this;
    },
    out,
  };
}

test('cloud sync API rejects non-POST requests with 405', async () => {
  const res = mockRes();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.out.statusCode, 405);
});

test('cloud sync API fails closed with 401 when Bearer token is missing', async () => {
  const res = mockRes();
  await handler({ method: 'POST', headers: {}, body: {} }, res);
  assert.equal(res.out.statusCode, 401);
});

test('import-github API rejects non-POST requests with 405', async () => {
  const res = mockRes();
  await importHandler({ method: 'GET', headers: {} }, res);
  assert.equal(res.out.statusCode, 405);
});

test('parseGitHubRepoInput normalizes owner/repo and full URLs and rejects invalid values', () => {
  assert.deepEqual(parseGitHubRepoInput('octocat/hello-world'), { owner: 'octocat', repo: 'hello-world' });
  assert.deepEqual(parseGitHubRepoInput('https://github.com/octocat/hello-world.git'), { owner: 'octocat', repo: 'hello-world' });
  assert.equal(parseGitHubRepoInput('invalid'), null);
  assert.equal(parseGitHubRepoInput('a/b/c'), null);
});

test('importGitHubSdd rejects invalid repository format with 400', async () => {
  const result = await importGitHubSdd({ repoInput: 'not-a-repo' });
  assert.equal(result.status, 400);
});

test('importGitHubSdd fails closed with 404 when repository lacks .sdd/', async () => {
  const mockFetch = async (url) => {
    if (url.endsWith('/repos/octocat/empty-repo')) {
      return { ok: true, status: 200, json: async () => ({ default_branch: 'main' }) };
    }
    if (url.includes('/git/trees/main')) {
      return { ok: true, status: 200, json: async () => ({ tree: [{ type: 'blob', path: 'README.md', size: 120 }] }) };
    }
    return { ok: false, status: 404 };
  };
  const result = await importGitHubSdd({ repoInput: 'octocat/empty-repo', fetchImpl: mockFetch });
  assert.equal(result.status, 404);
  assert.match(result.body.error, /No \.sdd\//);
});

test('importGitHubSdd extracts .sdd/ artifacts cleanly from GitHub tree', async () => {
  const mockFetch = async (url) => {
    if (url.endsWith('/repos/octocat/sdd-demo')) {
      return { ok: true, status: 200, json: async () => ({ default_branch: 'main' }) };
    }
    if (url.includes('/git/trees/main')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          tree: [
            { type: 'blob', path: '.sdd/constitution.md', size: 100 },
            { type: 'blob', path: '.sdd/specs/active/phase-001-init/requirements.md', size: 120 },
            { type: 'blob', path: 'src/index.ts', size: 200 },
          ],
        }),
      };
    }
    if (url.endsWith('/.sdd/constitution.md')) {
      return { ok: true, status: 200, text: async () => '# Constitution' };
    }
    if (url.endsWith('/.sdd/specs/active/phase-001-init/requirements.md')) {
      return { ok: true, status: 200, text: async () => '# Phase 001\n### REQ-1.1: Core' };
    }
    return { ok: false, status: 404 };
  };

  const result = await importGitHubSdd({ repoInput: 'octocat/sdd-demo', fetchImpl: mockFetch });
  assert.equal(result.status, 200);
  assert.equal(result.body.projectName, 'sdd-demo');
  assert.equal(result.body.branch, 'main');
  assert.equal(result.body.files['.sdd/constitution.md'], '# Constitution');
  assert.equal(result.body.files['.sdd/specs/active/phase-001-init/requirements.md'], '# Phase 001\n### REQ-1.1: Core');
  assert.equal(result.body.files['src/index.ts'], undefined);
});
