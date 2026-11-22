import { prisma } from '../../../server/src/config/prisma.js';
import { invalidateConfigCache } from '../../../server/src/modules/config/config.service.js';
import { invalidatePolicyCache } from '../../../server/src/modules/config/services/policy-resolver.service.js';
import { broadcastCacheInvalidation } from '../../../server/src/config/socket.js';
import { AppError } from '../../../server/src/utils/errors.js';
import {
  DEMO_BACKUP_CONFIG_KEY,
  DEMO_RELAX_GROUPS,
  allDemoRelaxKeys,
  buildDemoRelaxValues,
} from '../../shared/demo-guardrails.mjs';

const flushPolicyCaches = () => {
  invalidateConfigCache();
  invalidatePolicyCache();
  try {
    broadcastCacheInvalidation('config');
  } catch {
    /* Socket server may be idle in unit tests. */
  }
};

export async function getDemoPolicyStatus(db = prisma) {
  const keys = allDemoRelaxKeys();
  const rows = await db.systemConfig.findMany({
    where: { key: { in: [DEMO_BACKUP_CONFIG_KEY, ...keys] } },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const hasBackup = Boolean(byKey[DEMO_BACKUP_CONFIG_KEY]);

  const activeGroups = {};
  for (const [groupId, group] of Object.entries(DEMO_RELAX_GROUPS)) {
    activeGroups[groupId] = Object.entries(group.params).every(
      ([key, expected]) => byKey[key] === expected
    );
  }

  return {
    hasBackup,
    savedAt: byKey[DEMO_BACKUP_CONFIG_KEY]?.savedAt || null,
    activeGroups,
  };
}

export async function applyDemoPolicyGroups(groupIds = [], { db = prisma, onInvalidate } = {}) {
  const validIds = [...new Set(Array.isArray(groupIds) ? groupIds : [])];
  for (const id of validIds) {
    if (!Object.hasOwn(DEMO_RELAX_GROUPS, id)) {
      throw new AppError(`Grup constraint demo tidak dikenal: ${id}`, 400);
    }
  }

  const allKeys = allDemoRelaxKeys();
  const relaxedValues = buildDemoRelaxValues(validIds);

  const runOps = async (tx) => {
    const existingRows = await tx.systemConfig.findMany({
      where: { key: { in: [DEMO_BACKUP_CONFIG_KEY, ...allKeys] } },
    });
    const map = new Map(existingRows.map((r) => [r.key, r.value]));

    let backup = map.get(DEMO_BACKUP_CONFIG_KEY);
    if (!backup) {
      backup = {
        savedAt: new Date().toISOString(),
        existedKeys: allKeys.filter((key) => map.has(key)),
        values: Object.fromEntries(allKeys.filter((k) => map.has(k)).map((k) => [k, map.get(k)])),
      };
      await tx.systemConfig.upsert({
        where: { key: DEMO_BACKUP_CONFIG_KEY },
        update: { value: backup },
        create: { key: DEMO_BACKUP_CONFIG_KEY, value: backup },
      });
    }

    const existedSet = new Set(backup.existedKeys || []);
    for (const key of allKeys) {
      if (Object.hasOwn(relaxedValues, key)) {
        await tx.systemConfig.upsert({
          where: { key },
          update: { value: relaxedValues[key] },
          create: { key, value: relaxedValues[key] },
        });
      } else if (existedSet.has(key)) {
        await tx.systemConfig.upsert({
          where: { key },
          update: { value: backup.values[key] },
          create: { key, value: backup.values[key] },
        });
      } else {
        await tx.systemConfig.deleteMany({ where: { key } });
      }
    }
  };

  if (typeof db.$transaction === 'function') {
    await db.$transaction(runOps);
  } else {
    await runOps(db);
  }

  flushPolicyCaches();
  onInvalidate?.();
  return getDemoPolicyStatus(db);
}

export async function restoreDemoPolicyBaseline({ db = prisma, onInvalidate } = {}) {
  const backupRow = await db.systemConfig.findUnique({
    where: { key: DEMO_BACKUP_CONFIG_KEY },
  });
  if (!backupRow?.value) {
    return { restored: false, restoredKeys: 0, message: 'Tidak ada backup policy demo aktif.' };
  }

  const backup = backupRow.value;
  const allKeys = allDemoRelaxKeys();
  const existedSet = new Set(backup.existedKeys || []);

  const runOps = async (tx) => {
    for (const key of allKeys) {
      if (existedSet.has(key)) {
        await tx.systemConfig.upsert({
          where: { key },
          update: { value: backup.values[key] },
          create: { key, value: backup.values[key] },
        });
      } else {
        await tx.systemConfig.deleteMany({ where: { key } });
      }
    }
    await tx.systemConfig.deleteMany({ where: { key: DEMO_BACKUP_CONFIG_KEY } });
  };

  if (typeof db.$transaction === 'function') {
    await db.$transaction(runOps);
  } else {
    await runOps(db);
  }

  flushPolicyCaches();
  onInvalidate?.();
  return { restored: true, restoredKeys: allKeys.length };
}
