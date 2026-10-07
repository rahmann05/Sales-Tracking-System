import { CONFIG_DEFAULTS } from '../../../../../shared/config.mjs';
import { validateConfigMap, validateConfigRelations } from './validate-config.service.js';
/** bulkUpsertConfigs - service to upsert multiple config keys at once. */
import { prisma } from '../../../config/prisma.js';
import { invalidateConfigCache } from './dynamic-config.service.js';

export const bulkUpsertConfigs = async (configMap) => {
  configMap = validateConfigMap(configMap);
  const saved = await prisma.systemConfig.findMany();
  validateConfigRelations({ ...CONFIG_DEFAULTS, ...Object.fromEntries(saved.map(row => [row.key, row.value])), ...configMap });
  const results = {};
  // Use a transaction for atomic bulk update
  await prisma.$transaction(
    Object.entries(configMap).map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  // Re-fetch all to return updated state
  const allConfigs = await prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
  for (const cfg of allConfigs) {
    results[cfg.key] = cfg.value;
  }

  invalidateConfigCache();

  return results;
};
