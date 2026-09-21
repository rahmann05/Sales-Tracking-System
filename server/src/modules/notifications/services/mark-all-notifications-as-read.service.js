/** markAllNotificationsAsRead - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';


export const markAllNotificationsAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
