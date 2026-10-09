import {policyNotification} from './notification-policy.service.js';
/** createNotification - single-responsibility service (extracted from notifications.service.js). */
import { prisma } from '../../../config/prisma.js';
export const createNotification = async (userId, type, title, message, payload = null, db = prisma) => {
  const notification = await policyNotification(db,{
    data: { userId, type, title, message, payload },
  });

  return notification;
};
