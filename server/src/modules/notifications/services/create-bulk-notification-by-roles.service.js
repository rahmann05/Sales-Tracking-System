import {policyNotifications} from './notification-policy.service.js';
/** createBulkNotificationByRoles - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';
export const createBulkNotificationByRoles = async (roles, type, title, message, payload = null, db = prisma) => {
  let salesId=payload?.salesId;
  if(!salesId&&payload?.orderId)salesId=(await db.order.findUnique({where:{id:payload.orderId},select:{createdBy:true}}))?.createdBy;
  if(payload?.offPjpAttendanceId)salesId=(await db.offPjpAttendance.findUnique({where:{id:payload.offPjpAttendanceId},select:{userId:true}}))?.userId;
  if(payload?.routeChangeRequestId)salesId=(await db.routeChangeRequest.findUnique({where:{id:payload.routeChangeRequestId},select:{reportedBy:true}}))?.reportedBy;
  const supervisor = salesId ? (await db.user.findUnique({where:{id:salesId},select:{supervisorId:true}}))?.supervisorId : undefined;
  const ids = salesId ? (supervisor ? [supervisor] : []) : null;
  const users = await db.user.findMany({
    where: {role:{in:roles},deletedAt:null,...(ids?{OR:[{role:{not:'SUPERVISOR'}},{id:{in:ids}}]}:{})},
    select: { id: true },
  });

  if (users.length === 0) return;

  const notifications = users.map((u) => ({ userId: u.id, type, title, message, payload }));

  const {accepted}=await policyNotifications(db,{ data: notifications });

  return accepted;
};
