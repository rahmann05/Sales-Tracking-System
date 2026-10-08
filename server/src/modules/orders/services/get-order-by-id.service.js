import {orderSnapshot} from '../../../../../shared/order-snapshot.mjs';
import {loadOrderReviewAssignments,salesOrderHistory} from './order-review-assignment.service.js';
import {assertSalesAccess} from '../../../utils/team-scope.js';
/** getOrderById - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { ROLES } from "../../../utils/constants.js";


export const getOrderById = async (id, currentUser) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { id: true, name: true, email: true,supervisorId:true,deletedAt:true } },
      approvedByUser: { select: { id: true, name: true } },
      pjpStop: { include: { outlet: true, pjp: true } },
      items: { include: { product: true } },
    },
  });

  if (!order) throw new AppError('Order tidak ditemukan', 404);

  const isOwner = order.createdBy === currentUser.id;
  const isPrivileged = [ROLES.ADMIN, ROLES.SUPERVISOR].includes(currentUser.role);
  if (!isOwner && !isPrivileged) throw new AppError('Anda tidak memiliki akses ke order ini', 403);

  await assertSalesAccess(currentUser,order.createdBy);
  const assignments=isPrivileged?await loadOrderReviewAssignments([order]):new Map();
  return {...orderSnapshot(order),...(currentUser.role==='SALES'?{history:salesOrderHistory(order.history||[])}:{}),...(isPrivileged?{approvalAssignment:assignments.get(id)||null}:{})};
};
