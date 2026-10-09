import {prisma} from '../../../config/prisma.js';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
/** updateSalesLocation - single-responsibility service (extracted from users.service.js). */
import { AppError } from '../../../utils/errors.js';
import { liveLocationsCache } from './users.helpers.js';
import { getDynamicConfig } from '../../config/config.service.js';
import {gpsEvidence} from '../../../utils/gps-evidence.js';

/**
 * Update real-time GPS coordinates of a user (Sales device live ping)
 */
export const updateSalesLocation = async (userId, locationData = {}) => {
  const mode=await getDynamicConfig('SALES_TRACKING_MODE','LOGIN');
  if(mode==='OFF')throw new AppError('Berbagi lokasi Sales dinonaktifkan Admin',403);
  if(mode==='SHIFT'){const shift=await prisma.staffActivity.findFirst({where:{userId,kind:'SHIFT',dateKey:wibDateKey(),checkOutAt:null}});if(!shift||shift.checklist?.state==='FINISHED')throw new AppError('GPS hanya dibagikan pada shift aktif',409);}
  if(mode==='VISIT'&&!await prisma.pjpStop.findFirst({where:{pjp:{userId},status:'PENDING',OR:[{attendances:{some:{type:'IN'},none:{type:'OUT'}}},{visitSession:{path:['state'],equals:'ACTIVE'}}]}}))throw new AppError('GPS hanya dibagikan pada kunjungan aktif',409);
  const { latitude, longitude, accuracy = null, speed = 0, heading = 0, battery = null } = locationData;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180) {
    throw new AppError('Koordinat latitude dan longitude wajib berupa angka', 400);
  }

  const evidence=await gpsEvidence(locationData);
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
    updatedAt: now.toISOString(),observedAt:evidence.observedAt,gpsEvidence:evidence,
    isOnline: true,
    breadcrumbs: updatedBreadcrumbs,
  };

  liveLocationsCache.set(userId, record);
  return record;
};
