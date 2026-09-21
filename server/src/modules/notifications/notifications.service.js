/**
 * notifications.service.js - BARREL (SRP refactor).
 * Each business logic lives in its own file under ./services/.
 * This file only re-exports to keep existing import paths stable.
 */
export { createNotification } from './services/create-notification.service.js';
export { createBulkNotificationByRoles } from './services/create-bulk-notification-by-roles.service.js';
export { getUserNotifications } from './services/get-user-notifications.service.js';
export { markNotificationAsRead } from './services/mark-notification-as-read.service.js';
export { markAllNotificationsAsRead } from './services/mark-all-notifications-as-read.service.js';
