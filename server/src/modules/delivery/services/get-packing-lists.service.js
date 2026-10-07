import { packingBalance } from '../../../../../shared/packing.mjs';
/** getPackingLists - single-responsibility service (extracted from delivery.service.js). */
import { parsePagination } from '../../../utils/pagination.js';
import { prisma } from '../../../config/prisma.js';

/**
 * List packing lists with filters
 */
export const getPackingLists = async (query, role) => {
  const { search, outletId, dateFrom, dateTo } = query;
  const { page, limit, skip } = parsePagination(query);

  const where = {};
  if (role !== 'ADMIN' || query.status === 'RELEASED') where.status = 'RELEASED';
  else if (query.status === 'DRAFT') where.status = 'DRAFT';
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
        deliveryStops: true,
      },
    }),
    prisma.packingList.count({ where }),
  ]);

  return { items: items.map(packingBalance), total, page: parseInt(page), limit: parseInt(limit) };
};
