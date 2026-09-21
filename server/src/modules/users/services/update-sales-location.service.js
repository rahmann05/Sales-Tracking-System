/** updateSalesLocation - single-responsibility service (extracted from users.service.js). */
import { AppError } from '../../../utils/errors.js';
import { liveLocationsCache } from './users.helpers.js';

/**
 * Update real-time GPS coordinates of a user (Sales device live ping)
 */
export const updateSalesLocation = async (userId, locationData = {}) => {
  const { latitude, longitude, accuracy = 10, speed = 0, heading = 0, battery = null } = locationData;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new AppError('Koordinat latitude dan longitude wajib berupa angka', 400);
  }

  const existing = liveLocationsCache.get(userId) || { breadcrumbs: [] };
  const now = new Date();

  // Keep last 20 breadcrumb locations for trail
  const newBreadcrumb = {
    lat: latitude,
    lng: longitude,
    time: now.toISOString(),
  };

  const updatedBreadcrumbs = [
    newBreadcrumb,
    ...(existing.breadcrumbs || []).slice(0, 19),
  ];

  const record = {
    userId,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    battery,
    updatedAt: now.toISOString(),
    isOnline: true,
    breadcrumbs: updatedBreadcrumbs,
  };

  liveLocationsCache.set(userId, record);
  return record;
};
