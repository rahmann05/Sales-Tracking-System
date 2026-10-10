import {assertEvidenceImages} from '../../utils/evidence-images.js';
import {capturePolicySnapshot,processValue} from '../config/services/process-policy.service.js';
import {flagVisit} from '../absensi/services/visit-session.service.js';
import {withUserTransaction} from '../../utils/user-transaction.js';
import { AppError } from '../../utils/errors.js';
import { getDynamicConfig } from '../config/config.service.js';
import {shiftDateKey,shiftLateMinutes,shiftActionRules} from '../../../../shared/shift-policy.mjs';
import {flagShiftRange} from './shift-range.service.js';
import {gpsEvidence} from '../../utils/gps-evidence.js';

async function shiftEvidence(action,dateKey,values,data){
 await assertEvidenceImages({photoUrl:data.photoUrl},{values});
 const rules=shiftActionRules(action,dateKey,values);
 const label=rules.exception==='EARLY_FINISH'?'Shift belum mencapai jadwal selesai':'Tanggal kerja ini di luar hari kerja shift';
 if(rules.handling==='BLOCK')throw new AppError(label,409);
 if(rules.handling==='REASON'&&(!data.notes||data.notes.trim().length<5))throw new AppError(`${label}. Isi alasan minimal 5 karakter.`,422);
 if(rules.photoRequired&&!data.photoUrl)throw new AppError('Foto bukti shift wajib diisi.',422);
 if(rules.gpsRequired&&(!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude)))throw new AppError('Lokasi GPS shift wajib diisi.',422);
 const gpsKeys={GPS_REQUIRE_METADATA:'SHIFT_GPS_REQUIRE_METADATA',GPS_MAX_ACCURACY_METERS:'SHIFT_GPS_MAX_ACCURACY_METERS',GPS_MAX_AGE_SECONDS:'SHIFT_GPS_MAX_AGE_SECONDS'};
 const read=(key,fallback)=>values[gpsKeys[key]]??fallback;
 const gps=await gpsEvidence(data,read);
 return {photoUrl:data.photoUrl||null,latitude:data.latitude??null,longitude:data.longitude??null,gpsEvidence:gps,notes:data.notes?.trim()||null,exception:rules.exception,handling:rules.handling};
}

async function perform(db,userId, action,data) {
  const dateKey = shiftDateKey(Date.now(),await getDynamicConfig('SHIFT_DAY_CUTOFF_TIME','00:00'));
  const where = { userId_dateKey_activityKey: { userId, dateKey, activityKey: 'SHIFT' } };
  const unfinished={checkOutAt:null};
  const existing = action==='SHIFT_OUT'?(await db.staffActivity.findMany({where:{userId,kind:'SHIFT',...unfinished},orderBy:{checkInAt:'desc'}})).find(row=>row.checklist?.state!=='FINISHED'):await db.staffActivity.findUnique({ where });
  if (action === 'SHIFT_IN') {
    const snapshot=await capturePolicySnapshot(),optional=snapshot.values.SHIFT_ATTENDANCE_MODE==='OPTIONAL';
    const evidence=await shiftEvidence(action,dateKey,snapshot.values,data);
    const open=(await db.staffActivity.findMany({where:{userId,kind:'SHIFT',...unfinished}})).filter(row=>row.checklist?.state!=='FINISHED');
    for(const previous of open){const mode=await processValue(previous,'SHIFT_ATTENDANCE_MODE','IN_OUT');if(mode==='IN_OUT'&&!await processValue(previous,'SHIFT_ALLOW_CONTINUE_UNCLOSED',false))throw new AppError('Selesaikan shift aktif sebelumnya terlebih dahulu',409);if(mode==='IN_OUT'){const person=await db.user.findUnique({where:{id:userId},select:{supervisorId:true}});await db.operationalException.upsert({where:{dedupeKey:`UNCLOSED_SHIFT:${previous.id}`},update:{},create:{dedupeKey:`UNCLOSED_SHIFT:${previous.id}`,kind:'UNCLOSED_SHIFT',entityId:previous.id,userId,supervisorId:person?.supervisorId,details:{source:'NEXT_SHIFT'}}});}await db.staffActivity.update({where:{id:previous.id},data:{checklist:{...previous.checklist,state:'FINISHED',finishedAt:new Date().toISOString(),source:'NEXT_SHIFT'}}});}
    if (existing) throw new AppError('Shift hari ini sudah tercatat', 409);
    const lateMinutes=optional?0:shiftLateMinutes(Date.now(),dateKey,snapshot.values);
    return db.staffActivity.create({ data: { userId, dateKey, activityKey: 'SHIFT', kind: 'SHIFT', policySnapshot:snapshot,checklist:{startKind:optional?'BUSINESS_START':'CHECK_IN',scheduleException:evidence.exception,exceptionHandling:evidence.handling},lateMinutes,photoUrl:evidence.photoUrl,latitude:evidence.latitude,longitude:evidence.longitude,gpsEvidence:evidence.gpsEvidence,notes:evidence.notes } });
  }
  if (!existing || existing.checkOutAt || existing.checklist?.state==='FINISHED') throw new AppError('Tidak ada shift aktif', 409);
  const values=existing.policySnapshot?.values||(await capturePolicySnapshot()).values;
  const evidence=await shiftEvidence(action,existing.dateKey,values,data);
  const finished={...existing.checklist,state:'FINISHED',finishedAt:new Date().toISOString(),source:'USER_RESULT',finishEvidence:evidence};
  const activeSales = await db.pjpStop.findFirst({ where: {pjp:{userId},status:'PENDING',OR:[{attendances:{some:{userId,type:'IN'},none:{userId,type:'OUT'}}},{visitSession:{path:['state'],equals:'ACTIVE'}}]},include:{outlet:true,attendances:true} });
  const activeVisit = (await db.staffActivity.findMany({ where: { userId, kind: 'VISIT', checkOutAt: null } })).find(row=>row.checklist?.state!=='FINISHED');
  if ((activeSales || activeVisit)&&!await processValue(existing,'SHIFT_ALLOW_OPEN_VISITS',false)) throw new AppError('Selesaikan kunjungan aktif sebelum mengakhiri shift', 409);
  if(activeSales&&await processValue(activeSales,'SALES_ATTENDANCE_MODE','IN_OUT')==='IN_OUT')await flagVisit(db,activeSales,userId,'SHIFT_END');
  if(activeVisit)await db.operationalException.upsert({where:{dedupeKey:`OPEN_SPV_VISIT:${activeVisit.id}`},update:{},create:{dedupeKey:`OPEN_SPV_VISIT:${activeVisit.id}`,kind:'OPEN_SPV_VISIT',entityId:activeVisit.id,userId,details:{source:'SHIFT_END',outletName:activeVisit.outletName}}});
  if(await processValue(existing,'SHIFT_ATTENDANCE_MODE','IN_OUT')!=='IN_OUT')return db.staffActivity.update({where:{id:existing.id},data:{checklist:finished}});
  await flagShiftRange(db,existing,'SHIFT_END');
  const updated = await db.staffActivity.updateMany({ where: { id: existing.id, checkOutAt: null }, data: { checkOutAt: new Date(),checklist:finished } });
  if (!updated.count) throw new AppError('Shift sudah diakhiri', 409);
  return db.staffActivity.findUnique({where:{id:existing.id}});
}

export const recordShift=(userId,action,data={})=>withUserTransaction(userId,db=>perform(db,userId,action,data));
