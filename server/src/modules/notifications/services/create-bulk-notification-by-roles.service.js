/** createBulkNotificationByRoles - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';
import { emitToUser } from '../../../config/socket.js';
import { SOCKET_EVENTS } from '../../../utils/constants.js';


export const createBulkNotificationByRoles = async (roles, type, title, message, payload = null) => {
  const users = await prisma.user.findMany({
    where: { role: { in: roles }, deletedAt: null },
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
