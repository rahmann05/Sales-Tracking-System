import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { normalizeDecimalValues, toMoneyNumber } from '../src/utils/money.js';
import { successResponse } from '../src/utils/response.js';
import { maybePersistEvidenceImage, persistEvidenceImage } from '../src/utils/evidence-storage.js';
import { createEvidenceHandler } from '../src/routes/evidence.routes.js';
import {
  EVIDENCE_BACKFILL_TARGETS,
  migrateModelEvidence,
} from '../prisma/migrateEvidenceToDisk.mjs';

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('toMoneyNumber and normalizeDecimalValues convert Decimal-like objects for JSON responses', () => {
  const decimalLike = {
    s: 1,
    e: 4,
    d: [12500, 5000000],
    toNumber() {
      return 12500.5;
    },
  };
  assert.equal(toMoneyNumber(decimalLike), 12500.5);
  assert.equal(toMoneyNumber('45250.75'), 45250.75);
  assert.equal(toMoneyNumber(null, 0), 0);

  const now = new Date('2026-11-22T09:00:00.000Z');
  const normalized = normalizeDecimalValues({
    order: { totalValue: decimalLike, createdAt: now, items: [{ subtotal: decimalLike }] },
    label: 'Faktur A',
  });
  assert.equal(normalized.order.totalValue, 12500.5);
  assert.equal(normalized.order.items[0].subtotal, 12500.5);
  assert.equal(normalized.order.createdAt, now);
  assert.equal(normalized.label, 'Faktur A');

  let sentStatus = null;
  let sentBody = null;
  const mockRes = {
    status(code) {
      sentStatus = code;
      return this;
    },
    json(body) {
      sentBody = body;
      return body;
    },
  };
  successResponse(mockRes, 200, { totalValue: decimalLike, taxAmount: 1500 });
  assert.equal(sentStatus, 200);
  assert.equal(sentBody.success, true);
  assert.equal(typeof sentBody.data.totalValue, 'number');
  assert.equal(sentBody.data.totalValue, 12500.5);
  assert.equal(sentBody.data.taxAmount, 1500);
});

test('maybePersistEvidenceImage toggles cleanly with EVIDENCE_STORAGE_MODE', async (t) => {
  const prevMode = process.env.EVIDENCE_STORAGE_MODE;
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sa-maybe-evidence-'));
  t.after(async () => {
    if (prevMode === undefined) delete process.env.EVIDENCE_STORAGE_MODE;
    else process.env.EVIDENCE_STORAGE_MODE = prevMode;
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  delete process.env.EVIDENCE_STORAGE_MODE;
  const inlineResult = await maybePersistEvidenceImage(TINY_PNG_DATA_URL, 'attendance', {
    rootDir: tempRoot,
  });
  assert.equal(inlineResult, TINY_PNG_DATA_URL);

  process.env.EVIDENCE_STORAGE_MODE = 'DISK';
  const storedUrl = await maybePersistEvidenceImage(TINY_PNG_DATA_URL, 'delivery', {
    rootDir: tempRoot,
    now: new Date('2026-11-22T00:00:00Z'),
  });
  assert.match(storedUrl, /^\/api\/v1\/evidence\/delivery\/2026-11\/[a-f0-9-]+\.png$/);

  const unchanged = await maybePersistEvidenceImage(storedUrl, 'delivery', {
    rootDir: tempRoot,
  });
  assert.equal(unchanged, storedUrl);
});

test('createEvidenceHandler enforces path validation, 404 handling, and safe response headers', async (t) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sa-evidence-route-'));
  t.after(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  const stored = await persistEvidenceImage(TINY_PNG_DATA_URL, {
    domain: 'vehicle',
    rootDir: tempRoot,
    now: new Date('2026-11-22T00:00:00Z'),
    skipPolicyCheck: true,
  });
  const [, , , , domain, ym, filename] = stored.url.split('/');
  const handler = createEvidenceHandler(tempRoot);

  // 1. Path traversal / bad domain rejected with 400
  let capturedErr = null;
  await handler({ params: { domain: 'unknown', ym, filename: '../secret.png' } }, {}, (err) => {
    capturedErr = err;
  });
  assert.equal(capturedErr?.statusCode, 400);

  // 2. Non-existent file yields 404
  capturedErr = null;
  await handler(
    { params: { domain, ym, filename: '00000000-0000-4000-8000-000000000000.png' } },
    {},
    (err) => {
      capturedErr = err;
    }
  );
  assert.equal(capturedErr?.statusCode, 404);

  // 3. Valid file sends headers and absolute path
  const headers = {};
  let sentFilePath = null;
  await handler(
    { params: { domain, ym, filename } },
    {
      setHeader(k, v) {
        headers[k] = v;
      },
      sendFile(p) {
        sentFilePath = p;
        return p;
      },
    },
    (err) => {
      throw err;
    }
  );
  assert.equal(headers['Content-Type'], 'image/png');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Cache-Control'], 'private, max-age=86400');
  assert.equal(sentFilePath, stored.filePath);
});

test('migrateModelEvidence supports dry-run and idempotent apply across malformed rows', async (t) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sa-backfill-'));
  t.after(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  assert.equal(EVIDENCE_BACKFILL_TARGETS.length, 10);

  const dbRows = [
    { id: 'r1', photoUrl: TINY_PNG_DATA_URL },
    { id: 'r2', photoUrl: 'data:image/png;base64,NOT_VALID_DATA_TYPE' },
    { id: 'r3', photoUrl: TINY_PNG_DATA_URL },
    { id: 'r4', photoUrl: '/api/v1/evidence/attendance/2026-11/existing.png' },
  ];
  let updateCalls = 0;
  const mockDelegate = {
    async findMany({ where, take }) {
      const gt = where.id?.gt;
      return dbRows
        .filter((r) => typeof r.photoUrl === 'string' && r.photoUrl.startsWith('data:image/'))
        .filter((r) => !gt || r.id > gt)
        .slice(0, take)
        .map((r) => ({ id: r.id, photoUrl: r.photoUrl }));
    },
    async update({ where, data }) {
      updateCalls += 1;
      const target = dbRows.find((r) => r.id === where.id);
      if (target) target.photoUrl = data.photoUrl;
      return target;
    },
  };

  // Dry run first: updates nothing
  const dryStats = await migrateModelEvidence(mockDelegate, {
    field: 'photoUrl',
    domain: 'attendance',
    apply: false,
    batchSize: 2,
    rootDir: tempRoot,
  });
  assert.equal(dryStats.scanned, 3);
  assert.equal(dryStats.migrated, 3);
  assert.equal(dryStats.failed, 0);
  assert.equal(updateCalls, 0);

  // Apply run: r1 & r3 migrated to disk, malformed r2 counted as failed without throwing
  const applyStats = await migrateModelEvidence(mockDelegate, {
    field: 'photoUrl',
    domain: 'attendance',
    apply: true,
    batchSize: 2,
    rootDir: tempRoot,
  });
  assert.equal(applyStats.scanned, 3);
  assert.equal(applyStats.migrated, 2);
  assert.equal(applyStats.failed, 1);
  assert.equal(updateCalls, 2);
  assert.match(dbRows[0].photoUrl, /^\/api\/v1\/evidence\/attendance\//);
  assert.match(dbRows[2].photoUrl, /^\/api\/v1\/evidence\/attendance\//);
});
