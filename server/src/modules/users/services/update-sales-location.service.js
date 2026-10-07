/** updateSalesLocation - single-responsibility service (extracted from users.service.js). */
import { AppError } from '../../../utils/errors.js';
import { liveLocationsCache } from './users.helpers.js';
import { getDynamicConfig } from '../../config/config.service.js';

/**
 * Update real-time GPS coordinates of a user (Sales device live ping)
 */
export const updateSalesLocation = async (userId, locationData = {}) => {
  const { latitude, longitude, accuracy = 10, speed = 0, heading = 0, battery = null } = locationData;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180) {
    throw new AppError('Koordinat latitude dan longitude wajib berupa angka', 400);
  }

  const existing = liveLocationsCache.get(userId) || { breadcrumbs: [] };
  const now = new Date();

  // Dynamic breadcrumbs limit
  const maxBreadcrumbs = await getDynamicConfig('LIVE_TRACKING_MAX_BREADCRUMBS', 20);
  const newBreadcrumb = {
    lat: latitude,
    lng: longitude,
    time: now.toISOString(),
  };

  const updatedBreadcrumbs = [
    newBreadcrumb,
    ...(existing.breadcrumbs || []).slice(0, Math.max(0, maxBreadcrumbs - 1)),
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
