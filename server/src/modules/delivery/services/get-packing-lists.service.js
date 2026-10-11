import { packingBalance } from '../../../../../shared/packing.mjs';
import {invoiceReconciliation} from '../../../../../shared/invoice-reconciliation.mjs';
/** getPackingLists - single-responsibility service (extracted from delivery.service.js). */
import { parsePagination } from '../../../utils/pagination.js';
import { prisma } from '../../../config/prisma.js';
import {shipmentReady} from '../../../../../shared/shipment-document.mjs';
import {withPackingDestinations} from './packing-destination.service.js';

/**
 * List packing lists with filters
 */
export const getPackingLists = async (query, role) => {
  const { search, outletId, dateFrom, dateTo } = query;
  const { page, limit, skip } = parsePagination(query);

  const where = {};
  if (role !== 'ADMIN' || query.status === 'RELEASED') where.status = 'RELEASED';
  else if (query.status === 'DRAFT') where.status = 'DRAFT';
  if (outletId) where.AND = [{ OR: [{outletId}, {loadPlanVersion:2,destinations:{array_contains:[{outletId}]}}] }];
  if (search) {
    const matchingOutlets = await prisma.outlet.findMany({where:{name:{contains:search,mode:'insensitive'}},select:{id:true}});
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { outlet: { name: { contains: search, mode: 'insensitive' } } },
      { invoices: { some: { invoiceNumber: {contains:search,mode:'insensitive'} } } },
      ...matchingOutlets.map(({id})=>({loadPlanVersion:2,destinations:{array_contains:[{outletId:id}]}})),
    ];
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const pendingOnly=query.remainingOnly==='true';
  const [rawItems, rawTotal] = await Promise.all([
    prisma.packingList.findMany({
      where,
      ...(pendingOnly?{}:{skip,take:parseInt(limit)}),
      orderBy: [{ createdAt: 'desc' },{id:'asc'}],
      include: {
        outlet: { select: { id: true, name: true, address: true, outletCode: true, latitude: true, longitude: true, googleLocation: true } },
        invoices: true,
        createdBy: { select: { id: true, name: true } },
        deliveryStops: true,
      },
    }),
    prisma.packingList.count({ where }),
  ]);

  const matching=pendingOnly?rawItems.filter(item=>packingBalance(item).remainingCartons>0):rawItems;
  const total=pendingOnly?matching.length:rawTotal,items=pendingOnly?matching.slice(skip,skip+limit):matching;
  const all = await prisma.packingList.findMany({where,select:{status:true,documentKind:true,policySnapshot:true,loadPlanVersion:true,destinations:true,totalCartons:true,items:true,invoices:{select:{totalCartons:true,destinationId:true}}}});
  const metrics = {total,draftCount:all.filter(p=>p.status==='DRAFT').length,releasedCount:all.filter(p=>p.status==='RELEASED').length,incompleteCount:all.filter(p=>p.status==='DRAFT'&&!shipmentReady(p)).length};
  return { items: await withPackingDestinations(items.map(p=>({...packingBalance(p),commercial:invoiceReconciliation(p)}))), total, metrics, page: parseInt(page), limit: parseInt(limit) };
};
