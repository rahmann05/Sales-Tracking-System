/** createNotification - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';
import { emitToUser } from '../../../config/socket.js';
import { SOCKET_EVENTS } from '../../../utils/constants.js';


export const createNotification = async (userId, type, title, message, payload = null, db = prisma) => {
  const notification = await db.notification.create({
    data: { userId, type, title, message, payload },
  });

  // Emit real-time event to the target user if they're connected
  // Transaction callers rely on the persisted inbox; never emit an uncommitted row.
  if (db === prisma) {
    try { emitToUser(userId, SOCKET_EVENTS.NOTIFICATION, notification); }
    catch { console.warn('[Notifications] Socket unavailable; notification remains in inbox.'); }
  }

  return notification;
};
