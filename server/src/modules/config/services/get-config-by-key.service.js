/** getConfigByKey - single-responsibility service (extracted from config.service.js). */
import { prisma } from '../../../config/prisma.js';


export const getConfigByKey = async (key) => {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });
  return config ? config.value : null;
};
