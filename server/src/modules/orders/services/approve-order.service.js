import {assertSalesAccess} from '../../../utils/team-scope.js';
import { draftFromApprovedOrder } from '../../delivery/services/packing-workflow.service.js';
/** approveOrder - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { createNotification } from "../../notifications/notifications.service.js";
import { ORDER_STATUS, NOTIFICATION_TYPES } from "../../../utils/constants.js";


export const approveOrder = async (orderId, adminId) => {
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
  const updatedOrder = await prisma.$transaction(async tx => {
    const changed = await tx.order.updateMany({ where: { id: orderId, status: ORDER_STATUS.PENDING_APPROVAL }, data: { status: ORDER_STATUS.APPROVED, approvedBy: adminId, approvedAt: new Date() } });
    if (!changed.count) throw new AppError('Order sudah diproses', 409);
    await draftFromApprovedOrder(tx, orderId, adminId);
    return tx.order.findUnique({
    where: { id: orderId },
    include: { 
      items: { include: { product: true } },
      pjpStop: { include: { outlet: { select: { id: true, name: true, address: true } } } },
      createdByUser: { select: { id: true, name: true, email: true } },
      approvedByUser: { select: { id: true, name: true } },
    },
  });

  }, { isolationLevel: 'Serializable' });

  await createNotification(
    order.createdBy,
    NOTIFICATION_TYPES.ORDER_APPROVED,
    'Order Disetujui',
    `Order Anda di outlet "${order.pjpStop.outlet.name}" telah disetujui`,
    { orderId: order.id }
  );

  return updatedOrder;
};

export const batchApproveOrders = async (orderIds = [], adminId) => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new AppError('Daftar ID order wajib diisi', 400);
  }

  const results = [];
  for (const id of orderIds) {
    try {
      const res = await approveOrder(id, adminId);
      results.push({ id, success: true, order: res });
    } catch (err) {
      results.push({ id, success: false, error: err.message });
    }
  }

  return {
    total: orderIds.length,
    approvedCount: results.filter((r) => r.success).length,
    failedCount: results.filter((r) => !r.success).length,
    results,
  };
};
