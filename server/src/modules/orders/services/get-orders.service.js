import {orderSnapshot} from '../../../../../shared/order-snapshot.mjs';
import {loadOrderReviewAssignments,salesOrderHistory} from './order-review-assignment.service.js';
/** getOrders - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../../utils/pagination.js';
import { ROLES } from "../../../utils/constants.js";
import { fulfillment } from '../../../../../shared/delivery-operations.mjs';


export const getOrders = async (currentUser, query = {}) => {
  const { status, salesId, date } = query;
  const { skip, take, page, limit } = parsePagination(query);

  const where = {deletedAt:null};
  if (status) where.status = status;
  if (salesId) where.createdBy = salesId;
  if (date) where.createdAt = buildDayRange(date);

  // Sales can only see their own orders
  if (currentUser.role === ROLES.SALES) {
    where.createdBy = currentUser.id;
  }

  // Supervisor can only see orders from their supervised team/clusters (B17)
  if (currentUser.role === ROLES.SUPERVISOR) {
    where.createdByUser = {supervisorId:currentUser.id,deletedAt:null};
  }

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        createdByUser: { select: { id: true, name: true, email: true,supervisorId:true,deletedAt:true } },
        approvedByUser: { select: { id: true, name: true } },
        pjpStop: { include: { outlet: { select: { id: true, name: true, address: true } } } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ]);

  const packings = await prisma.packingList.findMany({where:{sourceOrderId:{in:data.map(o=>o.id)}},include:{deliveryStops:true}});
  const assignments=['ADMIN','SUPERVISOR'].includes(currentUser.role)?await loadOrderReviewAssignments(data):new Map();
  return buildPaginatedResponse(data.map(o=>({...fulfillment(orderSnapshot(o),packings),...(currentUser.role==='SALES'?{history:salesOrderHistory(o.history||[])}:{}),...(['ADMIN','SUPERVISOR'].includes(currentUser.role)?{approvalAssignment:assignments.get(o.id)||null}:{})})), total, page, limit);
};
