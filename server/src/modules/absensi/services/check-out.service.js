import {gpsEvidence} from '../../../utils/gps-evidence.js';
import {visitSettings,validateVisitResult} from './visit-session.service.js';
import {withProcessPolicy} from '../../config/services/process-policy.service.js';
import {reconcilePjp} from '../../route-changes/services/route-decision.service.js';
import {visitOutcomeSchema} from '../visit-outcome.schema.js';
import {createCollectionFollowUp} from './collection-follow-up.service.js';
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
  if(stop.validationOnly)throw new AppError('Gunakan formulir Validasi ulang outlet pada tugas PJP ini; presensi biasa tidak menggantikan bukti validasi.',409);
  if (stop.pjp.userId !== userId) {
    throw new AppError('Anda tidak berhak melakukan absensi pada PJP ini', 403);
  }

  const visit=await visitSettings(stop);
  await validateVisitResult(payload);
  const existingIn = stop.attendances.find((a) => a.userId === userId && a.type === ATTENDANCE_TYPE.IN);
  if (!existingIn && visit.requireIn) throw new AppError('Absen OUT gagal. Anda belum melakukan Absen IN pada outlet ini', 400);

  const existingOut = stop.attendances.find((a) => a.userId === userId && a.type === ATTENDANCE_TYPE.OUT);
  if (existingOut) throw new AppError('Anda sudah melakukan Absen OUT pada outlet ini', 409);
  if(!visit.requireOut){
    if(!stop.visitSession?.startedAt&&!existingIn)throw new AppError('Mulai kegiatan kunjungan sebelum mencatat hasil',409);
    if(stop.visitSession?.finishedAt)throw new AppError('Kegiatan sudah selesai',409);
    const result=await resolveSalesResult(payload);
    const visitOutcome=payload.visitOutcome?visitOutcomeSchema.parse(payload.visitOutcome):undefined;
    const session={...stop.visitSession,state:'FINISHED',finishedAt:new Date().toISOString(),attendanceMode:visit.mode,result:{...result,notes:notes||null,...(visitOutcome?{visitOutcome}:{})}};
    await db.pjpStop.update({where:{id:pjpStopId},data:{status:VISIT_STATUS.VISITED,visitSession:session,policySnapshot:visit.snapshot}});
    if(result.manualSalesStatus==='PENDING'){
      const user=await db.user.findUnique({where:{id:userId},select:{supervisorId:true}});
      await db.operationalException.upsert({where:{dedupeKey:`MANUAL_RESULT:${pjpStopId}`},update:{},create:{dedupeKey:`MANUAL_RESULT:${pjpStopId}`,kind:'MANUAL_RESULT',entityId:pjpStopId,userId,supervisorId:user.supervisorId,details:{outletName:stop.outlet.name,orderAmount:result.orderAmount,skuSold:result.skuSold}}});
    }
    await createCollectionFollowUp(db,{id:pjpStopId,userId,outletName:stop.outlet.name,visitOutcome},'PJP_RESULT');
    await reconcilePjp(db,stop.pjpId);
    return {logical:true,visitSession:session,...result,visitOutcome:visitOutcome||null,durationMinutes:null};
  }
  if (visit.photoOut && !photoUrl?.trim()) throw new AppError('Foto absen keluar wajib dilampirkan',422);
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  const bypassEmailsRaw = await getDynamicConfig('BYPASS_GEOFENCE_EMAILS', '');
  const bypassEmails = String(bypassEmailsRaw).split(',').map((e) => e.trim().toLowerCase());
  const isBypassUser = Boolean(user?.email && bypassEmails.includes(user.email.toLowerCase()));

  // Geolocation validation
  const hasGps=Number.isFinite(latitude)&&Number.isFinite(longitude);
  if(visit.snapshot.values.SALES_REQUIRE_GPS!==false&&!hasGps)throw new AppError('GPS presensi keluar wajib diisi',422);
  const distance = hasGps?calculateDistanceMeters(latitude, longitude, stop.outlet.latitude, stop.outlet.longitude):null;
  const deviationMeters = distance==null?null:Math.round(distance);

  // Read dynamic radius from SystemConfig cache
  const globalRadius = await getDynamicConfig('ATTENDANCE_RADIUS_METERS', 50);

  const useOutletRadius = await getDynamicConfig('ATTENDANCE_USE_OUTLET_RADIUS', true);
  const maxRadius = useOutletRadius ? (stop.outlet.radiusMeters || globalRadius) : globalRadius;
  const distanceWarning = distance==null?'UNAVAILABLE':distance > maxRadius ? 'WARNING' : 'OK';

  // Enforce Geofence: Block checkout if outside radius, except for an explicitly configured exception
  const hasException = await attendanceException(stop.outlet.id,userId,db);
  if(hasGps&&distance===null&&await getDynamicConfig('ATTENDANCE_ENFORCE_GEOFENCE',true)&&!isBypassUser&&!hasException)throw new AppError('Koordinat master outlet belum tersedia. Minta koreksi lokasi atau pengecualian presensi resmi.',422);
  if (await getDynamicConfig('ATTENDANCE_ENFORCE_GEOFENCE', true) && !isBypassUser && !hasException && distance > maxRadius) {
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
  const isEarlyCheckout = await getDynamicConfig('ATTENDANCE_ENFORCE_MIN_DURATION', true) && durationMs < MINIMUM_DURATION_MINS * 60000;
  const allowEarly = await getDynamicConfig('ATTENDANCE_ALLOW_EARLY_CHECKOUT', true);
  const cleanEarlyReason = typeof earlyReason === 'string' ? earlyReason.trim() : '';
  if (isEarlyCheckout && !allowEarly) throw new AppError(`Checkout harus menunggu durasi minimum ${MINIMUM_DURATION_MINS} menit.`, 422);

  if (isEarlyCheckout && !cleanEarlyReason) {
    throw new AppError(
      `Durasi kunjungan baru ${Math.floor(durationMinutes)} menit. Waktu minimal kunjungan toko adalah ${MINIMUM_DURATION_MINS} menit. Harap sertakan alasan jika checkout lebih awal.`,
      422
    );
  }

  const result = await resolveSalesResult(payload);
  const visitOutcome=payload.visitOutcome?visitOutcomeSchema.parse(payload.visitOutcome):undefined;
  const effective = result.isEffectiveCall;

  const evidence=await gpsEvidence({latitude,longitude,accuracy:payload.accuracy,observedAt:payload.observedAt});
  const attendance = await db.attendance.create({
      data: {
        pjpStopId,
        userId,
        type: ATTENDANCE_TYPE.OUT,
        latitude:latitude??null,
        longitude:longitude??null,
        photoUrl,
        gpsEvidence:evidence,notes: notes || 'Kunjungan Selesai',
        durationMinutes,
        deviationMeters,
        distanceWarning,
        reason: reason || earlyReason || (effective ? null : 'Tidak Ada Order'),
        earlyReason: isEarlyCheckout ? cleanEarlyReason : null,
        ...result,
        ...(visitOutcome?{visitOutcome}:{}),
      },
    });
    await createCollectionFollowUp(db,{...attendance,outletName:stop.outlet.name},'PJP');
    await db.pjpStop.update({where:{id:pjpStopId},data:{status:VISIT_STATUS.VISITED,visitSession:{...stop.visitSession,state:'FINISHED',finishedAt:new Date().toISOString(),attendanceMode:visit.mode}}});

  await reconcilePjp(db,stop.pjpId);

  return attendance;
};

export const checkOut=(pjpStopId, userId, latitude, longitude, photoUrl = null, payload = {})=>withUserTransaction(userId,async db=>withProcessPolicy(await db.pjpStop.findUnique({where:{id:pjpStopId}}),()=>perform(db,pjpStopId,userId,latitude,longitude,photoUrl,payload)));
