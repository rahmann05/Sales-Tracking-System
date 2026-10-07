import { CONFIG_DEFAULTS } from '../../../../../shared/config.mjs';
import { validateConfigMap, validateConfigRelations } from './validate-config.service.js';
/** upsertConfig - single-responsibility service (extracted from config.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateConfigCache } from './dynamic-config.service.js';


export const upsertConfig = async (key, value) => {
  value = validateConfigMap({ [key]: value })[key];
  const saved = await prisma.systemConfig.findMany();
  validateConfigRelations({ ...CONFIG_DEFAULTS, ...Object.fromEntries(saved.map(row => [row.key, row.value])), ...{ [key]: value } });
  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  
  invalidateConfigCache();

  return config.value;
};
