import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertMigrationIntegrity, listMigrationFolders } from '../prisma/migration-helpers.mjs';
import {
  isInternalEvidenceUrl,
  persistEvidenceImage,
  resolveStoredEvidenceFile,
} from '../src/utils/evidence-storage.js';
import { evidenceImageError } from '../../shared/evidence-image-policy.mjs';
import { saveOutletPhoto } from '../src/modules/customer-registrations/services/save-outlet-photo.service.js';

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('listMigrationFolders discovers disk migrations dynamically and assertMigrationIntegrity validates them', () => {
  const migrationsDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../prisma/migrations'
  );
  const folders = listMigrationFolders(migrationsDir);
  assert.ok(folders.length >= 42);
  assert.equal(folders.includes('202611220001_composite_query_indexes'), true);
  assert.equal(folders.includes('20261123194000_perf_hot_query_indexes'), true);

  const ok = assertMigrationIntegrity(folders, folders);
  assert.equal(ok.ok, true);
  assert.equal(ok.total, folders.length);

  assert.throws(
    () => assertMigrationIntegrity(folders.slice(0, -1), folders),
    new RegExp(`Missing applied Prisma migrations: .*${folders.at(-1)}`)
  );
});

test('persistEvidenceImage and resolveStoredEvidenceFile write internal evidence and block path traversal', async (t) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sa-evidence-'));
  t.after(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  const stored = await persistEvidenceImage(TINY_PNG_DATA_URL, {
    domain: 'noo',
    rootDir: tempRoot,
    now: new Date('2026-11-22T00:00:00Z'),
  });
  assert.equal(isInternalEvidenceUrl(stored.url), true);
  assert.equal(
    evidenceImageError(stored.url, { EVIDENCE_ALLOW_REMOTE_IMAGES: false }, 'Foto outlet'),
    null
  );

  const [, , , , domain, ym, filename] = stored.url.split('/');
  const resolved = resolveStoredEvidenceFile(domain, ym, filename, tempRoot);
  assert.ok(resolved);
  assert.equal(resolved.contentType, 'image/png');
  const bytes = await fs.readFile(resolved.filePath);
  assert.equal(bytes.length, stored.bytes);

  assert.equal(resolveStoredEvidenceFile('unknown', ym, filename, tempRoot), null);
  assert.equal(resolveStoredEvidenceFile('noo', '../2026-11', filename, tempRoot), null);
  assert.equal(resolveStoredEvidenceFile('noo', ym, '../../secret.png', tempRoot), null);
});

test('saveOutletPhoto supports DISK mode and preserves existing internal evidence URLs', async (t) => {
  const prevMode = process.env.EVIDENCE_STORAGE_MODE;
  let createdPath = null;
  t.after(async () => {
    if (prevMode === undefined) delete process.env.EVIDENCE_STORAGE_MODE;
    else process.env.EVIDENCE_STORAGE_MODE = prevMode;
    if (createdPath) {
      await fs.rm(createdPath, { force: true }).catch(() => {});
    }
  });

  process.env.EVIDENCE_STORAGE_MODE = 'DISK';
  const policy = {
    values: {
      EVIDENCE_IMAGE_MAX_KB: 2000,
      EVIDENCE_IMAGE_FORMATS: 'JPEG,PNG,WEBP',
      EVIDENCE_ALLOW_REMOTE_IMAGES: false,
    },
  };
  const saved = await saveOutletPhoto(TINY_PNG_DATA_URL, 'PHOTO-NOO', policy);
  assert.equal(isInternalEvidenceUrl(saved.photoUrl), true);

  const [, , , , domain, ym, filename] = saved.photoUrl.split('/');
  const resolved = resolveStoredEvidenceFile(domain, ym, filename);
  assert.ok(resolved);
  createdPath = resolved.filePath;
  const stat = await fs.stat(createdPath);
  assert.ok(stat.isFile() && stat.size > 0);

  const untouched = await saveOutletPhoto(saved.photoUrl, 'PHOTO-NOO', policy);
  assert.equal(untouched.photoUrl, saved.photoUrl);
});
