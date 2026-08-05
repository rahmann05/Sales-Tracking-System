import { prisma } from '../../config/prisma.js';
import { config } from '../../config/index.js';
import { calculateDistanceMeters } from '../../utils/geolocation.js';
import { AppError } from '../../utils/errors.js';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination.js';
import { ATTENDANCE_TYPE, VISIT_STATUS, PJP_STATUS } from '../../utils/constants.js';

export const checkIn = async (pjpStopId, userId, latitude, longitude, photoUrl = null) => {
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

  // Geolocation validation
  const distance = calculateDistanceMeters(latitude, longitude, stop.outlet.latitude, stop.outlet.longitude);
  if (distance > config.attendanceRadiusMeters) {
    throw new AppError(
      `Posisi Anda (${Math.round(distance)}m) berada di luar radius toleransi outlet (${config.attendanceRadiusMeters}m)`,
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
      data: { pjpStopId, userId, type: ATTENDANCE_TYPE.IN, latitude, longitude, photoUrl },
    }),
    prisma.pjpStop.update({ where: { id: pjpStopId }, data: { status: VISIT_STATUS.VISITED } }),
    prisma.pjp.update({ where: { id: stop.pjpId }, data: { status: PJP_STATUS.IN_PROGRESS } }),
  ]);

  return attendance;
};

export const checkOut = async (pjpStopId, userId, latitude, longitude, photoUrl = null) => {
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

  // Geolocation validation
  const distance = calculateDistanceMeters(latitude, longitude, stop.outlet.latitude, stop.outlet.longitude);
  if (distance > config.attendanceRadiusMeters) {
    throw new AppError(
      `Posisi Anda (${Math.round(distance)}m) berada di luar radius toleransi outlet (${config.attendanceRadiusMeters}m)`,
      422
    );
  }

  const attendance = await prisma.attendance.create({
    data: { pjpStopId, userId, type: ATTENDANCE_TYPE.OUT, latitude, longitude, photoUrl },
  });

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

export const getAttendanceHistory = async (userId, query = {}) => {
  const { skip, take, page, limit } = parsePagination(query);

  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { userId },
      include: {
        pjpStop: {
          include: {
            outlet: { select: { id: true, name: true, address: true } },
            pjp: { select: { id: true, date: true, type: true } },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take,
    }),
    prisma.attendance.count({ where: { userId } }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
};

export const getPjpAttendanceRecap = async (pjpId) => {
  const pjp = await prisma.pjp.findUnique({
    where: { id: pjpId },
    include: {
      user: { select: { id: true, name: true, role: true } },
      stops: {
        include: {
          outlet: true,
          attendances: {
            include: { user: { select: { id: true, name: true, role: true } } },
          },
        },
        orderBy: { sequence: 'asc' },
      },
    },
  });

  if (!pjp) throw new AppError('PJP tidak ditemukan', 404);

  return pjp;
};
