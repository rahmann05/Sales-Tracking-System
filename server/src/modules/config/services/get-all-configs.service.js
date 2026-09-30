/** getAllConfigs - service to fetch all SystemConfig entries. */
import { prisma } from '../../../config/prisma.js';

export const getAllConfigs = async () => {
  const configs = await prisma.systemConfig.findMany({
    orderBy: { key: 'asc' },
  });
  // Return as key-value map
  const result = {};
  for (const cfg of configs) {
    result[cfg.key] = cfg.value;
  }
  return result;
};
