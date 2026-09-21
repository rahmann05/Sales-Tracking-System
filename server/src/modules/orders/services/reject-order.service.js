/** rejectOrder - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createNotification, createBulkNotificationByRoles } from '../../notifications/notifications.service.js';
import { ORDER_STATUS, ROLES, NOTIFICATION_TYPES } from '../../../utils/constants.js';


export const rejectOrder = async (orderId, adminId, reason = null) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { pjpStop: { include: { outlet: true } } },
  });

  if (!order) throw new AppError('Order tidak ditemukan', 404);
  if (order.status !== ORDER_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Order sudah diproses sebelumnya (Status: ${order.status})`, 409);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: ORDER_STATUS.REJECTED, approvedBy: adminId, approvedAt: new Date() },
    include: { 
      items: { include: { product: true } },
      pjpStop: { include: { outlet: { select: { id: true, name: true, address: true } } } },
      createdByUser: { select: { id: true, name: true, email: true } },
      approvedByUser: { select: { id: true, name: true } },
    },
  });

  await createNotification(
    order.createdBy,
    NOTIFICATION_TYPES.ORDER_REJECTED,
    'Order Ditolak',
    `Order Anda di outlet "${order.pjpStop.outlet.name}" ditolak${reason ? `. Alasan: ${reason}` : ''}`,
    { orderId: order.id }
  );

  // rejectionReason is transient (not persisted in schema) but returned for immediate UI display
  return { ...updatedOrder, rejectionReason: reason };
};
