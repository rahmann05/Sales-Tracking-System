import {reconcilePjp} from '../../route-changes/services/route-decision.service.js';
import { attendanceException } from './attendance-policy.service.js';
/** checkOut - single-responsibility service (extracted from absensi.service.js). */
import {withUserTransaction} from '../../../utils/user-transaction.js';
import { resolveSalesResult } from './resolve-sales-result.service.js';
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { AppError } from '../../../utils/errors.js';
import { ATTENDANCE_TYPE, VISIT_STATUS } from "../../../utils/constants.js";
import { getDynamicConfig } from '../../config/config.service.js';


const perform = async (db, pjpStopId, userId, latitude, longitude, photoUrl = null, payload = {}) => {
  const {
    notes,
    earlyReason,
    reason,

  } = payload;

  const stop = await db.pjpStop.findUnique({
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

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  const bypassEmailsRaw = await getDynamicConfig('BYPASS_GEOFENCE_EMAILS', '');
  const bypassEmails = String(bypassEmailsRaw).split(',').map((e) => e.trim().toLowerCase());
  const isBypassUser = Boolean(user?.email && bypassEmails.includes(user.email.toLowerCase()));

  // Geolocation validation
  const distance = calculateDistanceMeters(latitude, longitude, stop.outlet.latitude, stop.outlet.longitude);
  const deviationMeters = Math.round(distance);

  // Read dynamic radius from SystemConfig cache
  const globalRadius = await getDynamicConfig('ATTENDANCE_RADIUS_METERS', 50);

  const maxRadius = stop.outlet.radiusMeters || globalRadius;
  const distanceWarning = distance > maxRadius ? 'WARNING' : 'OK';

  // Enforce Geofence: Block checkout if outside radius, except for an explicitly configured exception
  const hasException = await attendanceException(stop.outlet.id,userId,db);
  if (!isBypassUser && !hasException && distance > maxRadius) {
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

  const result = await resolveSalesResult(payload);
  const effective = result.isEffectiveCall;

  const attendance = await db.attendance.create({
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
        ...result,
      },
    });
    await db.pjpStop.update({where:{id:pjpStopId},data:{status:VISIT_STATUS.VISITED}});

  await reconcilePjp(db,stop.pjpId);

  return attendance;
};

export const checkOut=(pjpStopId, userId, latitude, longitude, photoUrl = null, payload = {})=>withUserTransaction(userId,db=>perform(db,pjpStopId,userId,latitude,longitude,photoUrl,payload));
