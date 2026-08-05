import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { emitToUser } from '../../config/socket.js';
import { SOCKET_EVENTS } from '../../utils/constants.js';

export const createNotification = async (userId, type, title, message, payload = null) => {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, payload },
  });

  // Emit real-time event to the target user if they're connected
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION, notification);

  return notification;
};

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

export const markNotificationAsRead = async (id, userId) => {
  const result = await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  if (result.count === 0) {
    throw new AppError('Notifikasi tidak ditemukan', 404);
  }

  return result;
};

export const markAllNotificationsAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
