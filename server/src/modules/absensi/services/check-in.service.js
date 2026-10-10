import {gpsEvidence} from '../../../utils/gps-evidence.js';
import {withProcessPolicy} from '../../config/services/process-policy.service.js';
import {visitSettings,settlePreviousVisit} from './visit-session.service.js';
import { requireActiveShift, attendanceException } from './attendance-policy.service.js';
/** checkIn - single-responsibility service (extracted from absensi.service.js). */
import {withUserTransaction} from '../../../utils/user-transaction.js';
import { wibDateKey } from '../../../../../shared/visit-metrics.mjs';
import { calculateDistanceMeters } from '../../../utils/geolocation.js';
import { AppError } from '../../../utils/errors.js';
import { ATTENDANCE_TYPE, VISIT_STATUS, PJP_STATUS } from '../../../utils/constants.js';
import { getDynamicConfig } from '../../config/config.service.js';


const perform = async (db, pjpStopId, userId, latitude, longitude, photoUrl = null, notes = null,metadata={}) => {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('planning:territories'))`;
  const stop = await db.pjpStop.findUnique({
    where: { id: pjpStopId },
    include: {
      outlet: true,
      pjp: { include: { stops: { orderBy: { sequence: 'asc' } } } },
      attendances: true,
    },
  });

  if (!stop) throw new AppError('Stop PJP tidak ditemukan', 404);
  if(stop.validationOnly)throw new AppError('Gunakan formulir Validasi ulang outlet pada tugas PJP ini; presensi biasa tidak menggantikan bukti validasi.',409);
  const visit=await visitSettings(stop);
  if(stop.visitSession?.state==='ACTIVE')throw new AppError('Kegiatan sudah dimulai',409);
  if(stop.outlet.deletedAt)throw new AppError('Outlet sudah nonaktif. Minta Supervisor menyesuaikan rencana kunjungan.',409);
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
  const hasGps=Number.isFinite(latitude)&&Number.isFinite(longitude);
  if(visit.mode!=='OPTIONAL'&&visit.snapshot.values.SALES_REQUIRE_GPS!==false&&!hasGps)throw new AppError('GPS presensi masuk wajib diisi',422);
  const distance = hasGps?calculateDistanceMeters(latitude, longitude, stop.outlet.latitude, stop.outlet.longitude):null;
  const deviationMeters = distance==null?null:Math.round(distance);

  // Read dynamic radius from SystemConfig cache
  const globalRadius = await getDynamicConfig('ATTENDANCE_RADIUS_METERS', 50);

  const useOutletRadius = await getDynamicConfig('ATTENDANCE_USE_OUTLET_RADIUS', true);
  const maxRadius = useOutletRadius ? (stop.outlet.radiusMeters || globalRadius) : globalRadius;
  const distanceWarning = distance==null?'UNAVAILABLE':distance > maxRadius ? 'WARNING' : 'OK';

  // Enforce Geofence: Block attendance if outside radius, except for an explicitly configured exception
  if(visit.mode!=='OPTIONAL'&&hasGps&&distance===null&&await getDynamicConfig('ATTENDANCE_ENFORCE_GEOFENCE',true)&&!isBypassUser&&!hasException)throw new AppError('Koordinat master outlet belum tersedia. Minta koreksi lokasi atau pengecualian presensi resmi.',422);
  if (visit.mode!=='OPTIONAL' && await getDynamicConfig('ATTENDANCE_ENFORCE_GEOFENCE', true) && !isBypassUser && !hasException && distance > maxRadius) {
    throw new AppError(
      `Presensi ditolak. Posisi Anda (${deviationMeters}m) berada di luar radius toko (${maxRadius}m). Harap dekati lokasi fisik outlet.`,
      422
    );
  }

  // Duplicate IN check
  const existingIn = stop.attendances.find((a) => a.userId === userId && a.type === ATTENDANCE_TYPE.IN);
  if (existingIn) throw new AppError('Anda sudah melakukan Absen IN pada outlet ini', 409);
  if (visit.mode!=='OPTIONAL' && visit.photoIn && !photoUrl?.trim()) throw new AppError('Foto absen masuk wajib dilampirkan', 422);

  const settledVisits=await settlePreviousVisit(db,userId,pjpStopId);
  // Sequential stop validation
  const currentSeq = stop.sequence;
  if (await getDynamicConfig('ATTENDANCE_ENFORCE_SEQUENCE', true) && currentSeq > 1) {
    const prevStops = stop.pjp.stops.filter((s) => !s.validationOnly && s.sequence < currentSeq);
    for (const prevStop of prevStops) {
      const allowPending = await getDynamicConfig('ALLOW_CONTINUE_PENDING_CLOSED', true);
      const isSkippedOrClosed = prevStop.status === VISIT_STATUS.SKIPPED || (prevStop.status === VISIT_STATUS.CLOSED_REPORTED && (allowPending || await db.routeChangeRequest.findFirst({where:{pjpStopId:prevStop.id,status:{in:['APPROVED','ACKNOWLEDGED']}}})));
      if (isSkippedOrClosed || ['FINISHED','INCOMPLETE'].includes((await db.pjpStop.findUnique({where:{id:prevStop.id},select:{visitSession:true}}))?.visitSession?.state)) continue;
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

  const evidence=await gpsEvidence({latitude,longitude,...metadata});
  const session={state:'ACTIVE',startedAt:new Date().toISOString(),attendanceMode:visit.mode};
  await db.pjpStop.update({where:{id:pjpStopId},data:{policySnapshot:visit.snapshot,visitSession:session}});
  const attendance = visit.mode==='OPTIONAL'?{logical:true,visitSession:session,policySnapshot:visit.snapshot}:await db.attendance.create({
      data: {
        pjpStopId,
        userId,
        type: ATTENDANCE_TYPE.IN,
        latitude:latitude??null,
        longitude:longitude??null,
        photoUrl,
        notes,gpsEvidence:evidence,
        deviationMeters,
        distanceWarning,
      },
    });
    await db.pjp.update({ where: { id: stop.pjpId }, data: { status: PJP_STATUS.IN_PROGRESS } });

  return {...attendance,policySnapshot:visit.snapshot,visitSession:session,settledVisits};
};

export const checkIn=(pjpStopId, userId, latitude, longitude, photoUrl = null, notes = null,metadata={})=>withUserTransaction(userId,async db=>withProcessPolicy(await db.pjpStop.findUnique({where:{id:pjpStopId}}),()=>perform(db,pjpStopId,userId,latitude,longitude,photoUrl,notes,metadata)));
