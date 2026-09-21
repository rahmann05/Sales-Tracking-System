/** checkIn - single-responsibility service (extracted from absensi.service.js). */
import { prisma } from '../../../config/prisma.js';
import { config } from '../../../config/index.js';
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { AppError } from '../../../utils/errors.js';
import { ATTENDANCE_TYPE, VISIT_STATUS, PJP_STATUS } from '../../../utils/constants.js';


export const checkIn = async (pjpStopId, userId, latitude, longitude, photoUrl = null, notes = null) => {
  const stop = await prisma.pjpStop.findUnique({
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

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const isBypassUser = user?.email === 'sales@sinaranugrah.com';

  // Geolocation calculation & validation
  const distance = calculateDistanceMeters(latitude, longitude, stop.outlet.latitude, stop.outlet.longitude);
  const deviationMeters = Math.round(distance);
  const maxRadius = stop.outlet.radiusMeters || config.attendanceRadiusMeters || 50;
  const distanceWarning = distance > maxRadius ? 'WARNING' : 'OK';

  // Enforce Geofence: Block attendance if outside radius, except for testing account sales@sinaranugrah.com
  if (!isBypassUser && distance > maxRadius) {
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
      const isSkippedOrClosed = [VISIT_STATUS.SKIPPED, VISIT_STATUS.CLOSED_REPORTED].includes(prevStop.status);
      if (isSkippedOrClosed) continue;
      const prevOutAttendance = await prisma.attendance.findFirst({
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

  const [attendance] = await prisma.$transaction([
    prisma.attendance.create({
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
    }),
    prisma.pjp.update({ where: { id: stop.pjpId }, data: { status: PJP_STATUS.IN_PROGRESS } }),
  ]);

  return attendance;
};
