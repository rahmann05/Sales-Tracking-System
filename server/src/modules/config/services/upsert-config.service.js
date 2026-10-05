/** upsertConfig - single-responsibility service (extracted from config.service.js). */
import { prisma } from '../../../config/prisma.js';
import { invalidateConfigCache } from './dynamic-config.service.js';


export const upsertConfig = async (key, value) => {
  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  
  invalidateConfigCache();

  return config.value;
};
