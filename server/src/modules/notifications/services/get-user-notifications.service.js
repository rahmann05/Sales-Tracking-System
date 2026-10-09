/** getUserNotifications - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';
import { getDynamicConfig } from '../../config/config.service.js';

export const getUserNotifications = async (userId, query = {}) => {
  const { isRead } = query;
  const where = { userId };
  if (isRead !== undefined) where.isRead = isRead === 'true';

  const configuredLimit = Number(await getDynamicConfig('NOTIFICATIONS_LIMIT_PER_USER', 50));
  const limit = Math.max(1, Math.min(500, Number.isInteger(configuredLimit) ? configuredLimit : 50));
  const page = Math.max(1, Math.min(10000, Number.parseInt(query.page, 10) || 1));

  const [notifications, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit, skip: (page - 1) * limit,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, unreadCount, total, page, hasMore: page * limit < total };
};
