import { CONFIG_PARAMS } from '../../../../../shared/config.mjs';
import { getDynamicConfig } from './dynamic-config.service.js';
/** getAllConfigs - service to fetch all SystemConfig entries. */
import { prisma } from '../../../config/prisma.js';

export const getAllConfigs = async () => {
  const configs = await prisma.systemConfig.findMany({
    where:{key:{in:[...CONFIG_PARAMS.map(param=>param.key),'LOGISTICS_METRICS']}},
    orderBy: { key: 'asc' },
  });
  // Return as key-value map
  const result = Object.fromEntries(await Promise.all(CONFIG_PARAMS.map(async p => [p.key, await getDynamicConfig(p.key, p.defaultValue)])));
  for (const cfg of configs) {
    // Registered values already include role/team overrides from the request context.
    if (cfg.key === 'LOGISTICS_METRICS') result[cfg.key] = cfg.value;
  }
  return result;
};
