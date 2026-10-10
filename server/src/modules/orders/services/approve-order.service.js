import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {processValue} from '../../config/services/process-policy.service.js';
import {assertSalesAccess} from '../../../utils/team-scope.js';
import {assertOrderReviewDecision,orderReviewConflict} from './order-review-assignment.service.js';
import { draftFromApprovedOrder } from '../../delivery/services/packing-workflow.service.js';
/** approveOrder - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { ORDER_STATUS, NOTIFICATION_TYPES } from "../../../utils/constants.js";


export const approveOrder = async (orderId, adminId, options={}) => {
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
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order:${orderId}`}))`;
    const current=await tx.order.findUnique({where:{id:orderId}});
    if(!current||current.deletedAt||current.status!==ORDER_STATUS.PENDING_APPROVAL)throw new AppError('Order sudah diproses atau tidak aktif',409);
    const decision=await assertOrderReviewDecision(tx,current,await tx.user.findUnique({where:{id:adminId}}),options);
    if(await processValue(current,'ORDER_APPROVAL_MODE','BOTH')==='SEQUENTIAL'){
      const reviewed=(current.history||[]).some(h=>h.action==='SUPERVISOR_REVIEW');
      if(reviewer.role==='SUPERVISOR'){if(reviewed)throw new AppError('Order sudah ditinjau SPV; menunggu Admin',409);return tx.order.update({where:{id:orderId},data:{history:[...(current.history||[]),{action:'SUPERVISOR_REVIEW',actorId:adminId,at:new Date().toISOString(),...decision}]}});}
      if(!reviewed)throw new AppError('Order harus ditinjau SPV terlebih dahulu',409);
    }
    const changed = await tx.order.updateMany({ where: { id: orderId, status: ORDER_STATUS.PENDING_APPROVAL }, data: { status: ORDER_STATUS.APPROVED, approvedBy: adminId, approvedAt: new Date(),history:[...(current.history||[]),{action:'APPROVE',actorId:adminId,at:new Date().toISOString(),...decision}] } });
    if (!changed.count) throw new AppError('Order sudah diproses', 409);
    await draftFromApprovedOrder(tx, orderId, adminId);
    await policyNotification(tx,{data:{userId:order.createdBy,type:NOTIFICATION_TYPES.ORDER_APPROVED,title:'Order Disetujui',message:`Order Anda di outlet "${order.customerSnapshot?.name||order.pjpStop?.outlet?.name||'pelanggan'}" telah disetujui`,payload:{orderId:order.id}}});
    return tx.order.findUnique({
    where: { id: orderId },
    include: { 
      items: { include: { product: true } },
      pjpStop: { include: { outlet: { select: { id: true, name: true, address: true } } } },
      createdByUser: { select: { id: true, name: true, email: true } },
      approvedByUser: { select: { id: true, name: true } },
    },
  });

  }, { isolationLevel: 'Serializable' }).catch(orderReviewConflict);

  return updatedOrder;
};

export const batchApproveOrders = async (orderIds = [], adminId) => {
  if(!await processValue(null,'ORDER_ALLOW_BATCH_APPROVAL',true))throw new AppError('Persetujuan massal dinonaktifkan',403);
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
