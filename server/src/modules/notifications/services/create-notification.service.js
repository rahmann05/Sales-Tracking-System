/** createNotification - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';
import { emitToUser } from '../../../config/socket.js';
import { SOCKET_EVENTS } from '../../../utils/constants.js';


export const createNotification = async (userId, type, title, message, payload = null) => {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, payload },
  });

  // Emit real-time event to the target user if they're connected
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION, notification);

  return notification;
};
