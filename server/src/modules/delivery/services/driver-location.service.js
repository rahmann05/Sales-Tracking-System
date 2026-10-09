import {getDynamicConfig} from '../../config/config.service.js';
import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import {calculateDistanceMeters} from '../../../utils/geolocation.js';
import {locationExpired} from '../../../../../shared/location-retention.mjs';
export async function reportDriverLocation(routeId, data, userId) {
  if(await getDynamicConfig('DRIVER_TRACKING_MODE','TRIP')==='OFF')throw new AppError('Berbagi lokasi Driver dinonaktifkan Admin',403);
  if(data.accuracy>await getDynamicConfig('GPS_MAX_ACCURACY_METERS',100000))throw new AppError('Akurasi GPS belum memadai',422);
  const observedAt = new Date(data.observedAt);
  const age = Date.now() - +observedAt;
  if (!Number.isFinite(age) || age < -30000 || age > (await getDynamicConfig('GPS_MAX_AGE_SECONDS',120))*1000) throw new AppError('GPS terlalu lama atau jam ponsel tidak sesuai', 400);
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route:${routeId}`}))`;
    const route = await tx.deliveryRoute.findUnique({ where: { id: routeId }, include: { position: true } });
    if (!route || route.driverId !== userId) throw new AppError('Rute bukan tugas Anda', 403);
    if (!['IN_TRANSIT', 'COMPLETED', 'PARTIAL'].includes(route.status) || route.closedAt || route.cancelledAt || route.returnedAt) throw new AppError('Pelacakan hanya saat trip berjalan', 409);
    if (route.position && +observedAt <= +route.position.observedAt) return { accepted: false };
    if (route.position && Date.now() - +route.position.receivedAt < (await getDynamicConfig('TRACKING_SEND_INTERVAL_SECONDS',30))*1000) return { accepted: false };
    const point = { latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy, observedAt: observedAt.toISOString() };
    const retention=await getDynamicConfig('TRACKING_LOCATION_RETENTION_HOURS',0),minimum=await getDynamicConfig('TRACKING_TRAIL_MIN_DISTANCE_METERS',0),maximum=await getDynamicConfig('DRIVER_TRACKING_MAX_POINTS',60);
    const previous=locationExpired(route.position,retention)?[]:route.position?.breadcrumbs||[],last=previous.at(-1);
    const append=!last||minimum<=0||calculateDistanceMeters(data.latitude,data.longitude,last.latitude,last.longitude)>=minimum;
    const payload = { ...point, observedAt, driverId: userId, receivedAt: new Date(), breadcrumbs: (append?[...previous,point]:previous).slice(-maximum) };
    await tx.deliveryPosition.upsert({ where: { routeId }, create: { routeId, ...payload }, update: payload });
    return { accepted: true, observedAt };
  }, { isolationLevel: 'Serializable' });
}
