import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { defaultEvidenceRoot, persistEvidenceImage } from '../src/utils/evidence-storage.js';

export const EVIDENCE_BACKFILL_TARGETS = [
  { model: 'attendance', field: 'photoUrl', domain: 'attendance' },
  { model: 'offPjpAttendance', field: 'photoUrl', domain: 'off-pjp' },
  { model: 'customerRegistration', field: 'photoUrl', domain: 'noo' },
  { model: 'customerRegistration', field: 'taxDocumentUrl', domain: 'noo' },
  { model: 'routeChangeRequest', field: 'photoUrl', domain: 'attendance' },
  { model: 'staffActivity', field: 'photoUrl', domain: 'attendance' },
  { model: 'deliveryStop', field: 'photoUrl', domain: 'delivery' },
  { model: 'deliveryAttendance', field: 'photoUrl', domain: 'delivery' },
  { model: 'vehicle', field: 'photoUrl', domain: 'vehicle' },
  { model: 'vehicleServiceRecord', field: 'receiptPhotoUrl', domain: 'vehicle' },
];

/**
 * Migrates inline Base64 data:image/* fields on a single Prisma delegate into disk files.
 * Runs in dry-run mode unless `apply` is explicitly true.
 */
export async function migrateModelEvidence(
  delegate,
  {
    field,
    domain,
    apply = false,
    batchSize = 50,
    rootDir = defaultEvidenceRoot(),
    persist = persistEvidenceImage,
  } = {}
) {
  const stats = {
    field,
    domain,
    scanned: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    estimatedBytesSaved: 0,
  };
  let cursorId = null;

  while (true) {
    const where = {
      [field]: { startsWith: 'data:image/' },
      ...(cursorId ? { id: { gt: cursorId } } : {}),
    };
    const rows = await delegate.findMany({
      where,
      orderBy: { id: 'asc' },
      take: batchSize,
      select: { id: true, [field]: true },
    });
    if (!rows.length) {
      break;
    }

    for (const row of rows) {
      stats.scanned += 1;
      const rawValue = row[field];
      if (typeof rawValue !== 'string' || !rawValue.startsWith('data:image/')) {
        stats.skipped += 1;
        continue;
      }
      stats.estimatedBytesSaved += rawValue.length;
      if (!apply) {
        stats.migrated += 1;
        continue;
      }
      try {
        const stored = await persist(rawValue, {
          domain,
          rootDir,
          skipPolicyCheck: true,
        });
        await delegate.update({
          where: { id: row.id },
          data: { [field]: stored.url },
        });
        stats.migrated += 1;
      } catch {
        stats.failed += 1;
      }
    }

    cursorId = rows[rows.length - 1].id;
    if (rows.length < batchSize) {
      break;
    }
  }

  return stats;
}

function parseCliArgs(argv) {
  const apply = argv.includes('--apply');
  const batchArg = argv.find((arg) => arg.startsWith('--batch='));
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  const parsedBatch = batchArg ? Number.parseInt(batchArg.slice('--batch='.length), 10) : 50;
  return {
    apply,
    batchSize: Number.isFinite(parsedBatch) && parsedBatch > 0 ? parsedBatch : 50,
    rootDir: rootArg ? rootArg.slice('--root='.length) : defaultEvidenceRoot(),
  };
}

async function runCli() {
  const options = parseCliArgs(process.argv.slice(2));
  const prisma = new PrismaClient();
  const report = {
    mode: options.apply ? 'APPLY' : 'DRY_RUN',
    batchSize: options.batchSize,
    rootDir: options.rootDir,
    targets: [],
  };
  try {
    for (const target of EVIDENCE_BACKFILL_TARGETS) {
      const delegate = prisma[target.model];
      if (!delegate) {
        continue;
      }
      const result = await migrateModelEvidence(delegate, {
        field: target.field,
        domain: target.domain,
        apply: options.apply,
        batchSize: options.batchSize,
        rootDir: options.rootDir,
      });
      report.targets.push({ model: target.model, ...result });
    }
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  runCli().catch((err) => {
    console.error('[migrateEvidenceToDisk] Failed:', err.message);
    process.exitCode = 1;
  });
}
