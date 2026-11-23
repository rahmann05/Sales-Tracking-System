import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const PRISMA_DIR = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(PRISMA_DIR, '..');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const envArg = args.find((a) => a.startsWith('--env='));
const requestedEnv = envArg ? envArg.slice('--env='.length) : '.env';
const envPath = path.isAbsolute(requestedEnv)
  ? requestedEnv
  : fs.existsSync(path.resolve(process.cwd(), requestedEnv))
    ? path.resolve(process.cwd(), requestedEnv)
    : path.resolve(SERVER_DIR, requestedEnv);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
} else if (envArg) {
  console.error(`File env tidak ditemukan: ${envPath}`);
  process.exit(1);
}

const urlCandidates = [
  ...new Set([process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean)),
];
if (urlCandidates.length === 0) {
  console.error('DATABASE_URL / DIRECT_URL belum diset.');
  process.exit(1);
}

const maskDbUrl = (url) => {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || '5432'}${u.pathname}`;
  } catch {
    return 'unknown-host';
  }
};

export const TEST_WORD_SQL_REGEX =
  'pengujian|\\yuji\\y|uji-bf-|\\ytest\\y|\\ytesting\\y|\\ytesing\\y|\\ydemo\\y|\\yfixture\\y|sampel\\s+callplan|alamat\\s+calon\\s+outlet\\s+simulasi';

const TEST_WORD_DETECT_RE =
  /(?:pengujian|(?<![a-zA-Z0-9_.-])(?:uji|test|testing|tesing|demo|fixture)(?![a-zA-Z0-9_.-])|uji-bf-|sampel\s+callplan|alamat\s+calon\s+outlet\s+simulasi)/i;

const EXCLUDED_TABLES = new Set(['_prisma_migrations']);
const EXCLUDED_COLUMNS = new Set([
  'id',
  'key',
  'email',
  'password',
  'photoUrl',
  'receiptPhotoUrl',
  'mapsUrl',
  'checkInPhoto',
  'checkOutPhoto',
  'type',
  'status',
  'role',
  'roleCode',
  'source',
  'action',
  'kind',
  'channel',
  'subChannel',
  'dedupeKey',
  'activityKey',
  'requestId',
  'policySnapshot',
  'entityType',
  'entityId',
  'taxType',
  'paymentType',
  'visitMode',
  'fuelType',
  'condition',
  'weekType',
  'lockStatus',
  'validationStatus',
  'registrationStatus',
]);
const EXCLUDED_JSON_KEYS = new Set([
  'email',
  'password',
  'photoUrl',
  'receiptPhotoUrl',
  'mapsUrl',
  'url',
  'source',
  'provenance',
  'action',
  'type',
  'status',
  'policySnapshot',
]);

export const cleanProductionText = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return value;
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return value;
  if (/^[A-Z0-9_]+$/.test(trimmed) && !/^UJI-BF-/i.test(trimmed)) return value;
  if (!TEST_WORD_DETECT_RE.test(value)) return value;

  if (/^Skenario\s+uji\s+Belfoods;\s*aktivitas/i.test(trimmed)) {
    return 'Catatan operasional Belfoods.';
  }

  let next = value
    .replace(/\s*·\s*sampel\s+callplan\s+Belfoods/gi, '')
    .replace(/\bsampel\s+callplan\s+Belfoods\b/gi, 'Bandung Raya')
    .replace(/\bAlamat\s+calon\s+outlet\s+simulasi\s+di\s+Bandung\s+Raya\b/gi, 'Bandung Raya')
    .replace(/^Bengkel\s+uji$/i, 'Bengkel Resmi')
    .replace(/\bUJI-BF-/gi, 'BF-')
    .replace(
      /\s*\(\s*(?:uji\s+belfoods|pengujian|uji\s+coba|uji|testing|tesing|test|demo|fixture)\s*\)/gi,
      ''
    )
    .replace(
      /^(?:Skenario\s+uji|Pengujian|Uji\s+coba|Uji|Testing|Tesing|Test|Demo|Fixture)\s*[:\-–]\s*/i,
      ''
    )
    .replace(/\bSkenario\s+uji\s+Belfoods\b/gi, 'Operasional Belfoods')
    .replace(/\bSkenario\s+uji\b/gi, '')
    .replace(/\bUji\s+Belfoods\b/gi, '')
    .replace(
      /(?<![a-zA-Z0-9_.-])(?:pengujian|uji\s+coba|uji|testing|tesing|test|demo|fixture)(?![a-zA-Z0-9_.-])/gi,
      ''
    )
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/^[:;,\-–·\s]+/, '')
    .replace(/\s*[:\-–·]+$/, '')
    .trim();

  if (!next) return value;
  if (/^[A-Z]/.test(trimmed) && /^[a-z]/.test(next)) {
    next = next[0].toUpperCase() + next.slice(1);
  }
  return next;
};

export const cleanJsonValue = (val) => {
  if (typeof val === 'string') {
    const next = cleanProductionText(val);
    return { value: next, changed: next !== val };
  }
  if (Array.isArray(val)) {
    let changed = false;
    const next = val.map((item) => {
      const res = cleanJsonValue(item);
      if (res.changed) changed = true;
      return res.value;
    });
    return { value: changed ? next : val, changed };
  }
  if (val && typeof val === 'object') {
    let changed = false;
    const next = {};
    for (const [k, v] of Object.entries(val)) {
      if (EXCLUDED_JSON_KEYS.has(k)) {
        next[k] = v;
        continue;
      }
      const res = cleanJsonValue(v);
      if (res.changed) changed = true;
      next[k] = res.value;
    }
    return { value: changed ? next : val, changed };
  }
  return { value: val, changed: false };
};

const isConnectionError = (err) => {
  const text = `${err?.code || ''} ${err?.message || ''}`;
  return /P1001|P1002|ENOTFOUND|ETIMEDOUT|ECONNREFUSED|Can't reach database server/i.test(text);
};

async function openPrismaWithFallback() {
  let lastErr;
  for (let i = 0; i < urlCandidates.length; i += 1) {
    const url = urlCandidates[i];
    const client = new PrismaClient({ datasources: { db: { url } } });
    try {
      await client.$queryRawUnsafe('SELECT 1');
      return { prisma: client, activeUrl: url };
    } catch (err) {
      await client.$disconnect().catch(() => {});
      lastErr = err;
      if (!isConnectionError(err) || i === urlCandidates.length - 1) throw err;
    }
  }
  throw lastErr;
}

async function runInChunks(items, chunkSize, worker) {
  const results = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const batch = items.slice(i, i + chunkSize);
    results.push(...(await Promise.all(batch.map(worker))));
  }
  return results;
}

async function discoverSchemaMetadata(prisma) {
  const [columns, pks, uniques] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type IN ('text', 'character varying', 'json', 'jsonb')
      ORDER BY table_name, column_name
    `),
    prisma.$queryRawUnsafe(`
      SELECT c.relname AS table_name, a.attname AS column_name
      FROM pg_index i
      JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
      WHERE n.nspname = 'public' AND i.indisprimary
    `),
    prisma.$queryRawUnsafe(`
      SELECT c.relname AS table_name, a.attname AS column_name
      FROM pg_index i
      JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
      WHERE n.nspname = 'public'
        AND i.indisunique
        AND array_length(i.indkey::int2[], 1) = 1
        AND a.attnum > 0
    `),
  ]);

  const pkByTable = new Map();
  for (const row of pks) {
    const list = pkByTable.get(row.table_name) || [];
    list.push(row.column_name);
    pkByTable.set(row.table_name, list);
  }

  const uniqueCols = new Set(uniques.map((r) => `${r.table_name}.${r.column_name}`));
  const targetCols = columns.filter(
    (c) =>
      !EXCLUDED_TABLES.has(c.table_name) &&
      !EXCLUDED_COLUMNS.has(c.column_name) &&
      (pkByTable.get(c.table_name) || []).length === 1
  );

  return { targetCols, pkByTable, uniqueCols };
}

const sampleText = (val) => {
  const s = typeof val === 'string' ? val : JSON.stringify(val);
  return s.length > 110 ? `${s.slice(0, 107)}...` : s;
};

async function collectPlan(prisma) {
  const { targetCols, pkByTable, uniqueCols } = await discoverSchemaMetadata(prisma);
  const ops = [];
  const counts = {};
  const samples = [];

  await runInChunks(targetCols, 10, async (col) => {
    const { table_name: table, column_name: field, data_type: dataType } = col;
    const pkCol = pkByTable.get(table)[0];
    const isJson = dataType === 'json' || dataType === 'jsonb';
    const cast = isJson ? `${dataType}` : 'text';

    const rows = await prisma.$queryRawUnsafe(
      `SELECT "${pkCol}" AS pk, "${field}" AS val FROM "${table}" WHERE "${field}" IS NOT NULL AND "${field}"::text ~* $1`,
      TEST_WORD_SQL_REGEX
    );
    if (rows.length === 0) return;

    let existingUnique = null;
    if (!isJson && uniqueCols.has(`${table}.${field}`)) {
      const allVals = await prisma.$queryRawUnsafe(
        `SELECT "${field}" AS val FROM "${table}" WHERE "${field}" IS NOT NULL`
      );
      existingUnique = new Set(allVals.map((r) => r.val));
    }

    for (const row of rows) {
      if (isJson) {
        const cleaned = cleanJsonValue(row.val);
        if (!cleaned.changed) continue;
        const label = `${table}.${field}(json)`;
        counts[label] = (counts[label] || 0) + 1;
        if (samples.length < 25) {
          samples.push({
            column: label,
            before: sampleText(row.val),
            after: sampleText(cleaned.value),
          });
        }
        ops.push(() =>
          prisma.$executeRawUnsafe(
            `UPDATE "${table}" SET "${field}" = $1::${cast} WHERE "${pkCol}" = $2`,
            JSON.stringify(cleaned.value),
            row.pk
          )
        );
      } else {
        const next = cleanProductionText(row.val);
        if (next === row.val) continue;
        if (existingUnique) {
          if (existingUnique.has(next)) {
            counts[`${table}.${field}.skippedConflict`] =
              (counts[`${table}.${field}.skippedConflict`] || 0) + 1;
            continue;
          }
          existingUnique.add(next);
        }
        const label = `${table}.${field}`;
        counts[label] = (counts[label] || 0) + 1;
        if (samples.length < 25) {
          samples.push({
            column: label,
            before: sampleText(row.val),
            after: sampleText(next),
          });
        }
        ops.push(() =>
          prisma.$executeRawUnsafe(
            `UPDATE "${table}" SET "${field}" = $1 WHERE "${pkCol}" = $2`,
            next,
            row.pk
          )
        );
      }
    }
  });

  return { ops, counts, samples, targetCols, pkByTable };
}

export async function verifyNoResidualLabels(prisma, cachedMeta = null) {
  const { targetCols } = cachedMeta || (await discoverSchemaMetadata(prisma));
  const residuals = [];

  await runInChunks(targetCols, 10, async (col) => {
    const { table_name: table, column_name: field, data_type: dataType } = col;
    const isJson = dataType === 'json' || dataType === 'jsonb';
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "${field}" AS val FROM "${table}" WHERE "${field}" IS NOT NULL AND "${field}"::text ~* $1`,
      TEST_WORD_SQL_REGEX
    );
    if (rows.length === 0) return;

    let actionable = 0;
    let example = '';
    for (const r of rows) {
      const changed = isJson ? cleanJsonValue(r.val).changed : cleanProductionText(r.val) !== r.val;
      if (changed) {
        actionable += 1;
        if (!example) example = sampleText(r.val);
      }
    }
    if (actionable > 0) {
      residuals.push({ column: `${table}.${field}`, count: actionable, sample: example });
    }
  });

  return residuals;
}

const isCliEntry =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCliEntry) {
  const { prisma, activeUrl } = await openPrismaWithFallback();
  try {
    console.log(`Target DB : ${maskDbUrl(activeUrl)}`);
    console.log(
      `Mode      : ${apply ? 'APPLY (update teks tanpa hapus baris)' : 'DRY-RUN (read-only preview)'}`
    );
    const { ops, counts, samples, targetCols, pkByTable } = await collectPlan(prisma);
    const totalChanges = ops.length;

    if (totalChanges === 0 && Object.keys(counts).length === 0) {
      console.log('Tidak ada kata pengujian/uji/test/demo/fixture yang tersisa di database.');
    } else {
      console.log('Ringkasan temuan (semua UPDATE, 0 DELETE):', JSON.stringify(counts, null, 2));
      if (samples.length > 0) {
        console.log('Contoh perubahan (BEFORE -> AFTER):');
        for (const s of samples) {
          console.log(`  [${s.column}] "${s.before}" -> "${s.after}"`);
        }
      }
      if (apply && totalChanges > 0) {
        await runInChunks(ops, 10, (op) => op());
        console.log(
          `Selesai: ${totalChanges} field teks/JSON berhasil dibersihkan (0 data dihapus).`
        );
      } else if (!apply) {
        console.log(
          `Dry-run selesai (${totalChanges} operasi siap dibersihkan, 0 data dihapus). Jalankan ulang dengan --apply untuk menerapkan.`
        );
      }
    }

    if (apply || totalChanges === 0) {
      const residuals = await verifyNoResidualLabels(prisma, { targetCols, pkByTable });
      if (residuals.length === 0) {
        console.log('Verifikasi pasca-bersih: 0 record tersisa.');
      } else {
        console.warn('Sisa label terdeteksi:', JSON.stringify(residuals, null, 2));
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}
