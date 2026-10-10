import { packingBalance } from '../../../../../shared/packing.mjs';
import {invoiceReconciliation} from '../../../../../shared/invoice-reconciliation.mjs';
/** getPackingLists - single-responsibility service (extracted from delivery.service.js). */
import { parsePagination } from '../../../utils/pagination.js';
import { prisma } from '../../../config/prisma.js';
import {shipmentReady} from '../../../../../shared/shipment-document.mjs';

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

  const all = await prisma.packingList.findMany({where,select:{status:true,documentKind:true,policySnapshot:true,totalCartons:true,items:true,invoices:{select:{totalCartons:true}}}});
  const metrics = {total,draftCount:all.filter(p=>p.status==='DRAFT').length,releasedCount:all.filter(p=>p.status==='RELEASED').length,incompleteCount:all.filter(p=>p.status==='DRAFT'&&!shipmentReady(p)).length};
  return { items: items.map(p=>({...packingBalance(p),commercial:invoiceReconciliation(p)})), total, metrics, page: parseInt(page), limit: parseInt(limit) };
};
