import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
export async function reportDriverLocation(routeId, data, userId) {
  const observedAt = new Date(data.observedAt);
  const age = Date.now() - +observedAt;
  if (!Number.isFinite(age) || age < -30000 || age > 120000) throw new AppError('GPS terlalu lama atau jam ponsel tidak sesuai', 400);
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`route:${routeId}`}))`;
    const route = await tx.deliveryRoute.findUnique({ where: { id: routeId }, include: { position: true } });
    if (!route || route.driverId !== userId) throw new AppError('Rute bukan tugas Anda', 403);
    if (!['IN_TRANSIT', 'COMPLETED', 'PARTIAL'].includes(route.status) || route.closedAt || route.cancelledAt || route.returnedAt) throw new AppError('Pelacakan hanya saat trip berjalan', 409);
    if (route.position && +observedAt <= +route.position.observedAt) return { accepted: false };
    if (route.position && Date.now() - +route.position.receivedAt < 10000) return { accepted: false };
    const point = { latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy, observedAt: observedAt.toISOString() };
    const payload = { ...point, observedAt, driverId: userId, receivedAt: new Date(), breadcrumbs: [...(route.position?.breadcrumbs || []).slice(-59), point] };
    await tx.deliveryPosition.upsert({ where: { routeId }, create: { routeId, ...payload }, update: payload });
    return { accepted: true, observedAt };
  }, { isolationLevel: 'Serializable' });
}
