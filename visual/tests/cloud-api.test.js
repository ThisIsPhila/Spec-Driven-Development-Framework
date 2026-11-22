import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../packages/cloud-api/api/cloud/sync.js';

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
