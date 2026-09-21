/** getOrderById - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { ORDER_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';


export const getOrderById = async (id, currentUser) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      approvedByUser: { select: { id: true, name: true } },
      pjpStop: { include: { outlet: true, pjp: true } },
      items: { include: { product: true } },
    },
  });

  if (!order) throw new AppError('Order tidak ditemukan', 404);

  const isOwner = order.createdBy === currentUser.id;
  const isPrivileged = [ROLES.ADMIN, ROLES.SUPERVISOR].includes(currentUser.role);
  if (!isOwner && !isPrivileged) throw new AppError('Anda tidak memiliki akses ke order ini', 403);

  return order;
};
