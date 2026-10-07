/** createBulkNotificationByRoles - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';
import { emitToUser } from '../../../config/socket.js';
import { SOCKET_EVENTS } from '../../../utils/constants.js';


export const createBulkNotificationByRoles = async (roles, type, title, message, payload = null) => {
  let salesId=payload?.salesId;
  if(payload?.orderId)salesId=(await prisma.order.findUnique({where:{id:payload.orderId},select:{createdBy:true}}))?.createdBy;
  if(payload?.offPjpAttendanceId)salesId=(await prisma.offPjpAttendance.findUnique({where:{id:payload.offPjpAttendanceId},select:{userId:true}}))?.userId;
  if(payload?.routeChangeRequestId)salesId=(await prisma.routeChangeRequest.findUnique({where:{id:payload.routeChangeRequestId},select:{reportedBy:true}}))?.reportedBy;
  const supervisor = salesId ? (await prisma.user.findUnique({where:{id:salesId},select:{supervisorId:true}}))?.supervisorId : undefined;
  const ids = salesId ? (supervisor ? [supervisor] : []) : null;
  const users = await prisma.user.findMany({
    where: {role:{in:roles},deletedAt:null,...(ids?{OR:[{role:{not:'SUPERVISOR'}},{id:{in:ids}}]}:{})},
    select: { id: true },
  });

  if (users.length === 0) return;

  const notifications = users.map((u) => ({ userId: u.id, type, title, message, payload }));

  await prisma.notification.createMany({ data: notifications });

  // Emit real-time to each online user
  for (const user of users) {
    emitToUser(user.id, SOCKET_EVENTS.NOTIFICATION, { type, title, message, payload });
  }
};
