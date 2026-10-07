import {assertSalesAccess} from '../../../utils/team-scope.js';
/** rejectOrder - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createNotification } from "../../notifications/notifications.service.js";
import { ORDER_STATUS, NOTIFICATION_TYPES } from "../../../utils/constants.js";


export const rejectOrder = async (orderId, adminId, reason = null) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { pjpStop: { include: { outlet: true } } },
  });

  if (!order) throw new AppError('Order tidak ditemukan', 404);
  if (order.status !== ORDER_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Order sudah diproses sebelumnya (Status: ${order.status})`, 409);
  }

  const reviewer=await prisma.user.findUnique({where:{id:adminId}});
  if(!reviewer||!['ADMIN','SUPERVISOR'].includes(reviewer.role))throw new AppError('Tidak berwenang memproses order',403);
  await assertSalesAccess(reviewer,order.createdBy);
  if(!reason?.trim())throw new AppError('Alasan penolakan wajib',400);
  const changed=await prisma.order.updateMany({where:{id:orderId,status:'PENDING_APPROVAL'},data:{status:'REJECTED',approvedBy:adminId,approvedAt:new Date(),rejectionReason:reason.trim()}});
  if(!changed.count)throw new AppError('Order sudah diproses',409);
  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
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
