import {policyNotification} from '../../notifications/services/notification-policy.service.js';
import {assertSalesAccess} from '../../../utils/team-scope.js';
import {assertOrderReviewDecision,orderReviewConflict} from './order-review-assignment.service.js';
/** rejectOrder - single-responsibility service (extracted from orders.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { ORDER_STATUS, NOTIFICATION_TYPES } from "../../../utils/constants.js";
import {packingOrderWhere} from '../../../../../shared/packing-orders.mjs';


export const rejectOrder = async (orderId, adminId, reason = null, options={}) => {
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
  const changed=await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`order:${orderId}`}))`;
    const current=await tx.order.findUnique({where:{id:orderId}});
    if(!current||current.deletedAt||current.status!==ORDER_STATUS.PENDING_APPROVAL)throw new AppError('Order sudah diproses atau tidak aktif',409);
    const decision=await assertOrderReviewDecision(tx,current,await tx.user.findUnique({where:{id:adminId}}),options);
    const released=await tx.packingList.count({where:{AND:[packingOrderWhere([orderId]),{OR:[{status:'RELEASED'},{deliveryStops:{some:{}}}]}]}});
    if(released)throw new AppError('Order sudah dilepas untuk pengiriman. Selesaikan atau tarik kembali packing sebelum menolak order.',409);
    const result=await tx.order.updateMany({where:{id:orderId,status:'PENDING_APPROVAL'},data:{status:'REJECTED',approvedBy:adminId,approvedAt:new Date(),rejectionReason:reason.trim(),history:[...(current.history||[]),{action:'REJECT',actorId:adminId,at:new Date().toISOString(),note:reason.trim(),...decision}]}});
    if(!result.count)throw new AppError('Order sudah diproses',409);
    await policyNotification(tx,{data:{userId:order.createdBy,type:NOTIFICATION_TYPES.ORDER_REJECTED,title:'Order Ditolak',message:`Order Anda ditolak. Alasan: ${reason.trim()}`,payload:{orderId:order.id}}});
    return result;
  },{isolationLevel:'Serializable'}).catch(orderReviewConflict);
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

  return { ...updatedOrder, rejectionReason: reason };
};
