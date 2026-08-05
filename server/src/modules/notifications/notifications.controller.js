import * as notificationService from './notifications.service.js';
import { successResponse } from '../../utils/response.js';

export const getUserNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getUserNotifications(req.user.id, req.query);
    return successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    await notificationService.markNotificationAsRead(req.params.id, req.user.id);
    return successResponse(res, 200, null, 'Notifikasi ditandai sudah dibaca');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsAsRead(req.user.id);
    return successResponse(res, 200, { updated: result.count }, 'Semua notifikasi ditandai sudah dibaca');
  } catch (error) {
    next(error);
  }
};
