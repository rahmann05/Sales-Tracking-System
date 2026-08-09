import { prisma } from '../../config/prisma.js';

export const getConfigByKey = async (key) => {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });
  return config ? config.value : null;
};

export const upsertConfig = async (key, value) => {
  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return config.value;
};
