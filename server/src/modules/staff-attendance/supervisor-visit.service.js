import {gpsEvidence} from '../../utils/gps-evidence.js';
import {capturePolicySnapshot,processValue} from '../config/services/process-policy.service.js';
import {requireActiveShift} from '../absensi/services/attendance-policy.service.js';
import {assertSalesAccess} from '../../utils/team-scope.js';
import { randomUUID } from 'node:crypto';
import {withUserTransaction} from '../../utils/user-transaction.js';
import { AppError } from '../../utils/errors.js';
import { calculateDistanceMeters } from '../../utils/geolocation.js';
import { getDynamicConfig } from '../config/config.service.js';
import { wibDateKey } from '../../../../shared/visit-metrics.mjs';
import { notifyFollowUp } from './follow-up-notification.service.js';
import {followUpActor,assertFollowUpOwner} from './follow-up-access.service.js';
import {DEFAULT_AUDIT_ITEMS,parseAuditItems,auditAnswers} from '../../../../shared/supervision-checklist.mjs';

async function perform(db,user, data) {
  if (!['SUPERVISOR', 'ADMIN'].includes(user.role)) throw new AppError('Khusus supervisor', 403);
  const dateKey = wibDateKey();
  if(['VISIT_IN','OFF_PJP'].includes(data.action))await requireActiveShift(user.id,db);
  if(data.visitMode==='JOINT_VISIT'&&!await getDynamicConfig('SPV_ALLOW_JOINT_VISIT',true))throw new AppError('Pendampingan dinonaktifkan',403);
  if(data.visitMode==='PRIORITY_AUDIT'&&!await getDynamicConfig('SPV_ALLOW_PRIORITY_AUDIT',true))throw new AppError('Audit prioritas dinonaktifkan',403);
  const requiredGps=await getDynamicConfig('SPV_REQUIRE_GPS',true),requiredPhoto=await getDynamicConfig('SPV_REQUIRE_PHOTO',true),mode=await getDynamicConfig('SPV_ATTENDANCE_MODE','IN_OUT');
  if (data.action === 'OFF_PJP') {
    if(!await getDynamicConfig('SPV_ALLOW_OFF_PJP',true))throw new AppError('Kunjungan SPV luar PJP dinonaktifkan',403);
    if (!data.outletName?.trim() || !data.notes?.trim()) throw new AppError('Nama toko dan alasan wajib diisi', 400);
    if (mode!=='OPTIONAL'&&(requiredGps&&(!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude))||requiredPhoto&&!data.photoUrl)) {
      throw new AppError('Foto bukti kunjungan langsung dan koordinat GPS wajib disertakan', 400);
    }
    return db.staffActivity.create({
      data: {
        userId: user.id,
        dateKey,
        activityKey: `OFF:${randomUUID()}`,
        kind: 'OFF_PJP',gpsEvidence:await gpsEvidence(data),policySnapshot:await capturePolicySnapshot(),
        visitMode: data.visitMode || 'PRIORITY_AUDIT',
        outletName: data.outletName.trim(),
        notes: data.notes.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
        photoUrl: data.photoUrl,
        checklist:{state:'FINISHED',finishedAt:new Date().toISOString(),startKind:mode==='OPTIONAL'?'BUSINESS_START':'CHECK_IN',finishKind:'BUSINESS_RESULT'},
      },
    });
  }
  if (!data.stopId) throw new AppError('Pilih toko PJP', 400);
  const stop = await db.pjpStop.findUnique({ where: { id: data.stopId }, include: { pjp: true, outlet: { include: { cluster: true } } } });
  if (!stop || wibDateKey(stop.pjp.date) !== dateKey) throw new AppError('PJP hari ini tidak ditemukan', 404);
  if (user.role !== 'ADMIN' && stop.outlet.cluster?.supervisorId !== user.id) throw new AppError('Toko berada di luar tim supervisi Anda', 403);
  const where = { userId_dateKey_activityKey: { userId: user.id, dateKey, activityKey: data.stopId } };
  let existing = await db.staffActivity.findUnique({ where });
  if (data.action === 'VISIT_IN') {
    if (existing) throw new AppError('Kunjungan sudah dimulai', 409);
    if((await db.staffActivity.findMany({where:{userId:user.id,kind:'VISIT',checkOutAt:null}})).some(row=>row.checklist?.state!=='FINISHED'))throw new AppError('Selesaikan kunjungan aktif terlebih dahulu',409);
    const visitMode=data.visitMode||'JOINT_VISIT';
    if(await getDynamicConfig('SPV_ENFORCE_VISIT_LIMIT',false)){const limit=await getDynamicConfig(visitMode==='JOINT_VISIT'?'SPV_JOINT_VISIT_LIMIT':'SPV_AUDIT_LIMIT',3);const count=await db.staffActivity.count({where:{userId:user.id,dateKey,kind:'VISIT',visitMode}});if(count>=limit)throw new AppError('Batas kunjungan mode ini tercapai',409);}
    if (mode!=='OPTIONAL'&&(requiredGps&&(!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude))||requiredPhoto&&!data.photoUrl)) throw new AppError('Foto dan GPS wajib diisi', 400);
    const radius = stop.outlet.radiusMeters || await getDynamicConfig('ATTENDANCE_RADIUS_METERS', 50);
    if (mode!=='OPTIONAL'&&await getDynamicConfig('SPV_ENFORCE_GEOFENCE',true)&&calculateDistanceMeters(data.latitude, data.longitude, stop.outlet.latitude, stop.outlet.longitude) > radius) throw new AppError(`Posisi di luar radius toko (${radius}m)`, 422);
    return db.staffActivity.create({ data: { userId: user.id, dateKey, activityKey: data.stopId, kind: 'VISIT',gpsEvidence:await gpsEvidence(data), policySnapshot:await capturePolicySnapshot(),checklist:{startKind:mode==='OPTIONAL'?'BUSINESS_START':'CHECK_IN'},visitMode, outletName: stop.outlet.name, notes: data.notes, latitude: data.latitude, longitude: data.longitude, photoUrl: data.photoUrl } });
  }
  if (!existing || existing.checkOutAt || existing.checklist?.state==='FINISHED') throw new AppError('Kunjungan belum dimulai atau sudah selesai', 409);
  const questions=parseAuditItems(await processValue(existing,'SPV_AUDIT_ITEMS',DEFAULT_AUDIT_ITEMS));
  let answers;try{answers=auditAnswers(questions,data.action==='AUDIT'?data.checklist:existing.checklist,data.action==='AUDIT'?data.auditEvidence||{}:existing.checklist?._evidence||{});}catch(error){throw new AppError(error.message,422);}
  let followUp;
  if(data.action==='AUDIT' && data.followUp) {
    if(await getDynamicConfig('FEATURE_FOLLOW_UP_MODE','ACTIVE')!=='ACTIVE')throw new AppError('Tugas baru dijeda oleh Admin; tugas sebelumnya tetap dapat diselesaikan',409);
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('approval:actors'))`;
    const {actor,people}=await followUpActor(db,user,'assign');
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`follow-up:${existing.id}`}))`;
    existing=await db.staffActivity.findUnique({where});
    await assertSalesAccess(user,data.followUp.ownerId,db);
    const owner=people.find(p=>p.id===data.followUp.ownerId);
    assertFollowUpOwner(owner,actor,people,await processValue(existing,'FOLLOW_UP_REQUIRE_REVIEW',true));
    if(!data.followUp.note?.trim()||data.followUp.note.trim().length>4000)throw new AppError('Instruksi tindak lanjut wajib diisi, maksimal 4000 karakter',400);
    data.followUp.dueDate ||= wibDateKey(Date.now()+(await getDynamicConfig('FOLLOW_UP_DEFAULT_DAYS',1))*86400000);
    const due=new Date(`${data.followUp.dueDate}T12:00:00Z`);
    if(Number.isNaN(due.getTime())||due.toISOString().slice(0,10)!==data.followUp.dueDate||data.followUp.dueDate<dateKey)throw new AppError('Tenggat harus tanggal valid hari ini atau berikutnya',400);
    if(existing.followUp?.status==='DONE')throw new AppError('Tindak lanjut sudah selesai dan tidak dapat ditimpa',409);
    if(existing.followUp?.status==='SUBMITTED')throw new AppError('Periksa hasil yang sudah dikirim sebelum mengubah penugasan',409);
    if(existing.followUp&&(existing.followUp.revision||0)!==data.followUp.revision)throw new AppError('Penugasan berubah. Muat ulang sebelum menyimpan audit.',409);
    followUp={...data.followUp,revision:(existing.followUp?.revision||0)+1,note:data.followUp.note.trim(),ownerName:owner.name,status:'OPEN',createdBy:existing.followUp?.createdBy||user.id,createdAt:existing.followUp?.createdAt||new Date().toISOString(),history:[...(existing.followUp?.history||[]),{action:'ASSIGNED',actorId:user.id,at:new Date().toISOString(),before:existing.followUp?{ownerId:existing.followUp.ownerId,dueDate:existing.followUp.dueDate,note:existing.followUp.note}:null,after:{ownerId:owner.id,dueDate:data.followUp.dueDate,note:data.followUp.note.trim()}}]};
  }
  const activeMode=await processValue(existing,'SPV_ATTENDANCE_MODE','IN_OUT');
  const metadata=Object.fromEntries(Object.entries(existing.checklist||{}).filter(([key])=>key!=='_evidence'&&!questions.some(item=>item.key===key)));
  const patch = data.action === 'AUDIT'  ? { checklist: {...metadata,...answers}, notes: data.notes, ...(followUp?{followUp}:{}) } : { ...(activeMode==='IN_OUT'?{checkOutAt:new Date()}:{}),checklist:{...existing.checklist,state:'FINISHED',finishedAt:new Date().toISOString(),finishKind:activeMode==='IN_OUT'?'CHECK_OUT':'BUSINESS_RESULT'} };
  const updated = await db.staffActivity.updateMany({ where: { id: existing.id, checkOutAt: null }, data: patch });
  if (!updated.count) throw new AppError('Kunjungan sudah diselesaikan', 409);
  const result = await db.staffActivity.findUnique({ where });
  if (followUp) await notifyFollowUp(db, result, 'ASSIGNED', user.id);
  return result;
}

export const recordSupervisorVisit=(user,data)=>withUserTransaction(user.id,db=>perform(db,user,data));
