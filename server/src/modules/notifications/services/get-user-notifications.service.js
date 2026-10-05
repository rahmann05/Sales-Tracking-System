/** getUserNotifications - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';
import { getDynamicConfig } from '../../config/config.service.js';

export const getUserNotifications = async (userId, query = {}) => {
  const { isRead } = query;
  const where = { userId };
  if (isRead !== undefined) where.isRead = isRead === 'true';

  const limit = await getDynamicConfig('NOTIFICATIONS_LIMIT_PER_USER', 50);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, unreadCount };
};
