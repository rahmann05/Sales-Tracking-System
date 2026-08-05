import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

export const getClusters = async () => {
  return await prisma.cluster.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { outlets: true, users: true } } },
    orderBy: { name: 'asc' },
  });
};

export const getClusterById = async (id) => {
  const cluster = await prisma.cluster.findUnique({
    where: { id },
    include: { outlets: { where: { deletedAt: null } } },
  });
  if (!cluster || cluster.deletedAt) {
    throw new AppError('Cluster tidak ditemukan', 404);
  }
  return cluster;
};

export const createCluster = async (data) => {
  return await prisma.cluster.create({ data });
};

export const updateCluster = async (id, data) => {
  return await prisma.cluster.update({ where: { id }, data });
};

export const deleteCluster = async (id) => {
  return await prisma.cluster.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
