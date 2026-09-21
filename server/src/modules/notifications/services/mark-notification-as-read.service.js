/** markNotificationAsRead - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';


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
