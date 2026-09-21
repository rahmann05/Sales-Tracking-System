/** getPackingLists - single-responsibility service (extracted from delivery.service.js). */
import { prisma } from '../../../config/prisma.js';

/**
 * List packing lists with filters
 */
export const getPackingLists = async (query) => {
  const { page = 1, limit = 20, search, outletId, dateFrom, dateTo } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (outletId) where.outletId = outletId;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { outlet: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const [items, total] = await Promise.all([
    prisma.packingList.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        outlet: { select: { id: true, name: true, address: true, outletCode: true } },
        invoices: true,
        createdBy: { select: { id: true, name: true } },
        deliveryStops: { select: { id: true, status: true } },
      },
    }),
    prisma.packingList.count({ where }),
  ]);

  return { items, total, page: parseInt(page), limit: parseInt(limit) };
};
