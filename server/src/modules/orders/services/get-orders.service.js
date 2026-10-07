/** getOrders - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { parsePagination, buildPaginatedResponse, buildDayRange } from '../../../utils/pagination.js';
import { ROLES } from "../../../utils/constants.js";


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
        createdByUser: { select: { id: true, name: true, email: true } },
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

  return buildPaginatedResponse(data, total, page, limit);
};
