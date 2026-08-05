import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

export const getOutlets = async (query = {}) => {
  const { clusterId, search } = query;
  const where = { deletedAt: null };

  if (clusterId) where.clusterId = clusterId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  return await prisma.outlet.findMany({
    where,
    include: { cluster: { select: { id: true, name: true, region: true } } },
    orderBy: { name: 'asc' },
  });
};

export const getOutletById = async (id) => {
  const outlet = await prisma.outlet.findUnique({
    where: { id },
    include: { cluster: true },
  });
  if (!outlet || outlet.deletedAt) {
    throw new AppError('Outlet tidak ditemukan', 404);
  }
  return outlet;
};

export const createOutlet = async (data) => {
  return await prisma.outlet.create({ data });
};

export const updateOutlet = async (id, data) => {
  return await prisma.outlet.update({ where: { id }, data });
};

export const deleteOutlet = async (id) => {
  return await prisma.outlet.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
