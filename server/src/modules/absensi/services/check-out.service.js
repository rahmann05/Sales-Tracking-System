/** checkOut - single-responsibility service (extracted from absensi.service.js). */
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { AppError } from '../../../utils/errors.js';
import { ATTENDANCE_TYPE, VISIT_STATUS, PJP_STATUS } from '../../../utils/constants.js';
import { getDynamicConfig } from '../../config/config.service.js';


export const checkOut = async (pjpStopId, userId, latitude, longitude, photoUrl = null, payload = {}) => {
  const {
    notes,
    earlyReason,
    reason,
    orderAmount = 0,
    skuSold = 0,
    isEffectiveCall = false,
  } = payload;

  const stop = await prisma.pjpStop.findUnique({
    where: { id: pjpStopId },
    include: { outlet: true, attendances: true, pjp: true },
  });

  if (!stop) throw new AppError('Stop PJP tidak ditemukan', 404);
  if (stop.pjp.userId !== userId) {
    throw new AppError('Anda tidak berhak melakukan absensi pada PJP ini', 403);
  }

  const existingIn = stop.attendances.find((a) => a.userId === userId && a.type === ATTENDANCE_TYPE.IN);
  if (!existingIn) throw new AppError('Absen OUT gagal. Anda belum melakukan Absen IN pada outlet ini', 400);

  const existingOut = stop.attendances.find((a) => a.userId === userId && a.type === ATTENDANCE_TYPE.OUT);
  if (existingOut) throw new AppError('Anda sudah melakukan Absen OUT pada outlet ini', 409);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const bypassEmailsRaw = await getDynamicConfig('BYPASS_GEOFENCE_EMAILS', 'sales@sinaranugrah.com');
  const bypassEmails = String(bypassEmailsRaw).split(',').map((e) => e.trim().toLowerCase());
  const isBypassUser = Boolean(user?.email && bypassEmails.includes(user.email.toLowerCase()));

  // Geolocation validation
  const distance = calculateDistanceMeters(latitude, longitude, stop.outlet.latitude, stop.outlet.longitude);
  const deviationMeters = Math.round(distance);

  // Read dynamic radius from SystemConfig cache
  const globalRadius = await getDynamicConfig('ATTENDANCE_RADIUS_METERS', 50);

  const maxRadius = stop.outlet.radiusMeters || globalRadius;
  const distanceWarning = distance > maxRadius ? 'WARNING' : 'OK';

  // Enforce Geofence: Block checkout if outside radius, except for testing account sales@sinaranugrah.com
  if (!isBypassUser && distance > maxRadius) {
    throw new AppError(
      `Absen OUT ditolak. Posisi Anda (${deviationMeters}m) berada di luar radius toko (${maxRadius}m). Harap dekati lokasi fisik outlet.`,
      422
    );
  }

  // Calculate Visit Duration in Minutes
  const inTimestamp = new Date(existingIn.timestamp).getTime();
  const outTimestamp = Date.now();
  const durationMs = Math.max(0, outTimestamp - inTimestamp);
  const durationMinutes = Math.round((durationMs / 60000) * 10) / 10;

  // Minimum duration check — read from SystemConfig cache
  const MINIMUM_DURATION_MINS = await getDynamicConfig('MINIMUM_VISIT_DURATION_MINUTES', 5);

  if (durationMinutes < MINIMUM_DURATION_MINS && !earlyReason) {
    throw new AppError(
      `Durasi kunjungan baru ${Math.floor(durationMinutes)} menit. Waktu minimal kunjungan toko adalah ${MINIMUM_DURATION_MINS} menit. Harap sertakan alasan jika checkout lebih awal.`,
      422
    );
  }

  const effective = isEffectiveCall || Number(orderAmount) > 0 || Number(skuSold) > 0;

  const [attendance] = await prisma.$transaction([
    prisma.attendance.create({
      data: {
        pjpStopId,
        userId,
        type: ATTENDANCE_TYPE.OUT,
        latitude,
        longitude,
        photoUrl,
        notes: notes || 'Kunjungan Selesai',
        durationMinutes,
        deviationMeters,
        distanceWarning,
        reason: reason || earlyReason || (effective ? null : 'Tidak Ada Order'),
        earlyReason: durationMinutes < MINIMUM_DURATION_MINS ? (earlyReason || 'Checkout Lebih Awal') : null,
        orderAmount: Number(orderAmount) || 0,
        skuSold: Number(skuSold) || 0,
        isEffectiveCall: effective,
      },
    }),
    prisma.pjpStop.update({
      where: { id: pjpStopId },
      data: { status: VISIT_STATUS.VISITED },
    }),
  ]);

  // Check if all PJP stops are done
  const allStops = await prisma.pjpStop.findMany({
    where: { pjpId: stop.pjpId },
    include: { attendances: true },
  });

  const isPjpCompleted = allStops.every((s) => {
    const isDone = [VISIT_STATUS.SKIPPED, VISIT_STATUS.CLOSED_REPORTED].includes(s.status);
    if (isDone) return true;
    return s.attendances.some((a) => a.type === ATTENDANCE_TYPE.OUT);
  });

  if (isPjpCompleted) {
    await prisma.pjp.update({ where: { id: stop.pjpId }, data: { status: PJP_STATUS.COMPLETED } });
  }

  return attendance;
};
