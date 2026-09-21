/** upsertConfig - single-responsibility service (extracted from config.service.js). */
import { prisma } from '../../../config/prisma.js';


export const upsertConfig = async (key, value) => {
  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return config.value;
};
