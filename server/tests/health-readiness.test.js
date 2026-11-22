import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../src/config/prisma.js';
import healthRouter from '../src/routes/health.routes.js';

const readyHandler = healthRouter.stack.find((layer) => layer.route?.path === '/ready')?.route
  ?.stack?.[0]?.handle;

const mockRes = () => {
  const headers = {};
  return {
    statusCode: 200,
    body: null,
    headers,
    set(key, value) {
      headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
};

test('GET /ready returns 200 ready when database query succeeds and 503 when unavailable', async (t) => {
  assert.equal(typeof readyHandler, 'function');
  const origQueryRaw = prisma.$queryRaw;

  t.after(() => {
    prisma.$queryRaw = origQueryRaw;
  });

  prisma.$queryRaw = async () => [{ '?column?': 1 }];
  const okRes = mockRes();
  await readyHandler({}, okRes);
  assert.equal(okRes.statusCode, 200);
  assert.equal(okRes.headers['Cache-Control'], 'no-store');
  assert.equal(okRes.body.data.status, 'ready');
  assert.equal(okRes.body.data.database, 'OK');

  prisma.$queryRaw = async () => {
    throw new Error('Connection refused');
  };
  const failRes = mockRes();
  await readyHandler({}, failRes);
  assert.equal(failRes.statusCode, 503);
  assert.equal(failRes.headers['Cache-Control'], 'no-store');
  assert.equal(failRes.body.success, false);
  assert.equal(failRes.body.data.status, 'not_ready');
  assert.equal(failRes.body.data.database, 'ERROR');
});
