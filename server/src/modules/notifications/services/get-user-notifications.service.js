/** getUserNotifications - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';


export const getUserNotifications = async (userId, query = {}) => {
  const { isRead } = query;
  const where = { userId };
  if (isRead !== undefined) where.isRead = isRead === 'true';

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, unreadCount };
};
