import { requireActiveShift, attendanceException } from './attendance-policy.service.js';
/** checkIn - single-responsibility service (extracted from absensi.service.js). */
import {withUserTransaction} from '../../../utils/user-transaction.js';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { AppError } from '../../../utils/errors.js';
import { ATTENDANCE_TYPE, VISIT_STATUS, PJP_STATUS } from '../../../utils/constants.js';
import { getDynamicConfig } from '../../config/config.service.js';


const perform = async (db, pjpStopId, userId, latitude, longitude, photoUrl = null, notes = null) => {
  const stop = await db.pjpStop.findUnique({
    where: { id: pjpStopId },
    include: {
      outlet: true,
      pjp: { include: { stops: { orderBy: { sequence: 'asc' } } } },
      attendances: true,
    },
  });

  if (!stop) throw new AppError('Stop PJP tidak ditemukan', 404);
  if (stop.pjp.userId !== userId) {
    throw new AppError('Anda tidak berhak melakukan absensi pada PJP ini', 403);
  }

  if (wibDateKey(stop.pjp.date) !== wibDateKey()) throw new AppError('Absensi hanya untuk PJP hari ini', 400);
  if (['VISITED', 'SKIPPED', 'CLOSED_REPORTED'].includes(stop.status)) throw new AppError('Toko sudah selesai atau ditutup pada rute ini', 409);
  const hasException = await attendanceException(stop.outlet.id,userId,db);
  if (['LOCKED','UNLOCK_REQUESTED'].includes(stop.outlet.lockStatus) && !hasException) {
    throw new AppError('Outlet sedang terkunci. Ajukan permintaan unlock kepada supervisor sebelum dapat melakukan kunjungan.', 403);
  }
  await requireActiveShift(userId,db);
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  const bypassEmailsRaw = await getDynamicConfig('BYPASS_GEOFENCE_EMAILS', '');
  const bypassEmails = String(bypassEmailsRaw).split(',').map((e) => e.trim().toLowerCase());
  const isBypassUser = Boolean(user?.email && bypassEmails.includes(user.email.toLowerCase()));

  // Geolocation calculation & validation
  const distance = calculateDistanceMeters(latitude, longitude, stop.outlet.latitude, stop.outlet.longitude);
  const deviationMeters = Math.round(distance);

  // Read dynamic radius from SystemConfig cache
  const globalRadius = await getDynamicConfig('ATTENDANCE_RADIUS_METERS', 50);

  const maxRadius = stop.outlet.radiusMeters || globalRadius;
  const distanceWarning = distance > maxRadius ? 'WARNING' : 'OK';

  // Enforce Geofence: Block attendance if outside radius, except for an explicitly configured exception
  if (!isBypassUser && !hasException && distance > maxRadius) {
    throw new AppError(
      `Presensi ditolak. Posisi Anda (${deviationMeters}m) berada di luar radius toko (${maxRadius}m). Harap dekati lokasi fisik outlet.`,
      422
    );
  }

  // Duplicate IN check
  const existingIn = stop.attendances.find((a) => a.userId === userId && a.type === ATTENDANCE_TYPE.IN);
  if (existingIn) throw new AppError('Anda sudah melakukan Absen IN pada outlet ini', 409);

  // Sequential stop validation
  const currentSeq = stop.sequence;
  if (currentSeq > 1) {
    const prevStops = stop.pjp.stops.filter((s) => s.sequence < currentSeq);
    for (const prevStop of prevStops) {
      const allowPending = await getDynamicConfig('ALLOW_CONTINUE_PENDING_CLOSED', true);
      const isSkippedOrClosed = prevStop.status === VISIT_STATUS.SKIPPED || (prevStop.status === VISIT_STATUS.CLOSED_REPORTED && (allowPending || await db.routeChangeRequest.findFirst({where:{pjpStopId:prevStop.id,status:{in:['APPROVED','ACKNOWLEDGED']}}})));
      if (isSkippedOrClosed) continue;
      const prevOutAttendance = await db.attendance.findFirst({
        where: { pjpStopId: prevStop.id, userId, type: ATTENDANCE_TYPE.OUT },
      });
      if (!prevOutAttendance) {
        throw new AppError(
          `Absen IN gagal. Selesaikan Absen OUT pada stop urutan ${prevStop.sequence} terlebih dahulu`,
          400
        );
      }
    }
  }

  const attendance = await db.attendance.create({
      data: {
        pjpStopId,
        userId,
        type: ATTENDANCE_TYPE.IN,
        latitude,
        longitude,
        photoUrl,
        notes,
        deviationMeters,
        distanceWarning,
      },
    });
    await db.pjp.update({ where: { id: stop.pjpId }, data: { status: PJP_STATUS.IN_PROGRESS } });

  return attendance;
};

export const checkIn=(pjpStopId, userId, latitude, longitude, photoUrl = null, notes = null)=>withUserTransaction(userId,db=>perform(db,pjpStopId,userId,latitude,longitude,photoUrl,notes));
