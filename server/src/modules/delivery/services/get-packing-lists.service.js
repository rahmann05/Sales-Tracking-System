import { packingBalance } from '../../../../../shared/packing.mjs';
import { invoiceReconciliation } from '../../../../../shared/invoice-reconciliation.mjs';
/** getPackingLists - single-responsibility service (extracted from delivery.service.js). */
import { parsePagination } from '../../../utils/pagination.js';
import { prisma } from '../../../config/prisma.js';
import { shipmentReady } from '../../../../../shared/shipment-document.mjs';
import { withPackingDestinations } from './packing-destination.service.js';

/**
 * List packing lists with filters
 */
export const getPackingLists = async (query, role) => {
  const { search, outletId, dateFrom, dateTo } = query;
  const { page, limit, skip } = parsePagination(query);

  const baseWhere = {};
  if (role !== 'ADMIN') baseWhere.status = 'RELEASED';
  if (outletId)
    baseWhere.AND = [
      {
        OR: [
          { outletId },
          { loadPlanVersion: 2, destinations: { array_contains: [{ outletId }] } },
        ],
      },
    ];
  if (search) {
    const matchingOutlets = await prisma.outlet.findMany({
      where: { name: { contains: search, mode: 'insensitive' } },
      select: { id: true },
    });
    baseWhere.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { outlet: { name: { contains: search, mode: 'insensitive' } } },
      { invoices: { some: { invoiceNumber: { contains: search, mode: 'insensitive' } } } },
      ...matchingOutlets.map(({ id }) => ({
        loadPlanVersion: 2,
        destinations: { array_contains: [{ outletId: id }] },
      })),
    ];
  }
  if (dateFrom || dateTo) {
    baseWhere.createdAt = {};
    if (dateFrom) baseWhere.createdAt.gte = new Date(dateFrom);
    if (dateTo) baseWhere.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const where = { ...baseWhere };
  const incompleteOnly = role === 'ADMIN' && query.status === 'INCOMPLETE';
  if (role === 'ADMIN') {
    if (query.status === 'RELEASED') where.status = 'RELEASED';
    else if (query.status === 'DRAFT' || incompleteOnly) where.status = 'DRAFT';
  }

  const pendingOnly = query.remainingOnly === 'true';
  const needsInMemorySlice = pendingOnly || incompleteOnly;
  const [rawItems, rawTotal, allForMetrics] = await Promise.all([
    prisma.packingList.findMany({
      where,
      ...(needsInMemorySlice ? {} : { skip, take: parseInt(limit) }),
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      include: {
        outlet: {
          select: {
            id: true,
            name: true,
            address: true,
            outletCode: true,
            latitude: true,
            longitude: true,
            googleLocation: true,
          },
        },
        invoices: true,
        createdBy: { select: { id: true, name: true } },
        deliveryStops: true,
      },
    }),
    needsInMemorySlice ? Promise.resolve(0) : prisma.packingList.count({ where }),
    prisma.packingList.findMany({
      where: baseWhere,
      select: {
        status: true,
        documentKind: true,
        policySnapshot: true,
        loadPlanVersion: true,
        destinations: true,
        totalCartons: true,
        items: true,
        invoices: { select: { totalCartons: true, destinationId: true } },
      },
    }),
  ]);

  let matching = rawItems;
  if (pendingOnly) matching = matching.filter((item) => packingBalance(item).remainingCartons > 0);
  if (incompleteOnly)
    matching = matching.filter((item) => item.status === 'DRAFT' && !shipmentReady(item));

  const total = needsInMemorySlice ? matching.length : rawTotal;
  const items = needsInMemorySlice ? matching.slice(skip, skip + limit) : matching;

  const metrics = {
    total: allForMetrics.length,
    draftCount: allForMetrics.filter((p) => p.status === 'DRAFT').length,
    releasedCount: allForMetrics.filter((p) => p.status === 'RELEASED').length,
    incompleteCount: allForMetrics.filter((p) => p.status === 'DRAFT' && !shipmentReady(p)).length,
  };
  const balanced = items.map((p) => ({
    ...packingBalance(p),
    commercial: invoiceReconciliation(p),
  }));
  return {
    items: balanced.length ? await withPackingDestinations(balanced) : [],
    total,
    metrics,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};
