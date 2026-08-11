import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { cacheGetOrFetch, cacheInvalidate } from '../../utils/cacheHelper.js';
import { CACHE_KEYS } from '../../config/cache.js';
import { broadcastCacheInvalidation } from '../../config/socket.js';

export const getOutlets = async (query = {}) => {
  const { clusterId, search } = query;
  
  // If there's a search query or specific clusterId, don't use the global cache
  if (clusterId || search) {
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
      include: { cluster: { select: { id: true, name: true, region: true, deletedAt: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // Use global cache for fetch all
  return await cacheGetOrFetch(
    CACHE_KEYS.ALL_OUTLETS,
    async () => {
      return await prisma.outlet.findMany({
        where: { deletedAt: null },
        include: { cluster: { select: { id: true, name: true, region: true, deletedAt: true } } },
        orderBy: { name: 'asc' },
      });
    },
    300 // 5 minutes TTL
  );
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

const invalidateOutletCache = () => {
  cacheInvalidate(CACHE_KEYS.ALL_OUTLETS);
  broadcastCacheInvalidation('outlets');
};

export const createOutlet = async (data) => {
  const result = await prisma.outlet.create({ data });
  invalidateOutletCache();
  return result;
};

export const updateOutlet = async (id, data) => {
  const result = await prisma.outlet.update({ where: { id }, data });
  invalidateOutletCache();
  return result;
};

export const deleteOutlet = async (id) => {
  const result = await prisma.outlet.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  invalidateOutletCache();
  return result;
};
