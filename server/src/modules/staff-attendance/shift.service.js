import {capturePolicySnapshot,processValue} from '../config/services/process-policy.service.js';
import {flagVisit} from '../absensi/services/visit-session.service.js';
import {withUserTransaction} from '../../utils/user-transaction.js';
import { AppError } from '../../utils/errors.js';
import { getDynamicConfig } from '../config/config.service.js';
import { wibDateKey } from "../../../../shared/visit-metrics.mjs";

async function perform(db,userId, action) {
  const dateKey = wibDateKey();
  const where = { userId_dateKey_activityKey: { userId, dateKey, activityKey: 'SHIFT' } };
  const unfinished={checkOutAt:null};
  const existing = action==='SHIFT_OUT'?(await db.staffActivity.findMany({where:{userId,kind:'SHIFT',...unfinished},orderBy:{checkInAt:'desc'}})).find(row=>row.checklist?.state!=='FINISHED'):await db.staffActivity.findUnique({ where });
  if (action === 'SHIFT_IN') {
    const open=(await db.staffActivity.findMany({where:{userId,kind:'SHIFT',...unfinished}})).filter(row=>row.checklist?.state!=='FINISHED');
    for(const previous of open){const mode=await processValue(previous,'SHIFT_ATTENDANCE_MODE','IN_OUT');if(mode==='IN_OUT'&&!await processValue(previous,'SHIFT_ALLOW_CONTINUE_UNCLOSED',false))throw new AppError('Selesaikan shift aktif sebelumnya terlebih dahulu',409);if(mode==='IN_OUT'){const person=await db.user.findUnique({where:{id:userId},select:{supervisorId:true}});await db.operationalException.upsert({where:{dedupeKey:`UNCLOSED_SHIFT:${previous.id}`},update:{},create:{dedupeKey:`UNCLOSED_SHIFT:${previous.id}`,kind:'UNCLOSED_SHIFT',entityId:previous.id,userId,supervisorId:person?.supervisorId,details:{source:'NEXT_SHIFT'}}});}await db.staffActivity.update({where:{id:previous.id},data:{checklist:{state:'FINISHED',finishedAt:new Date().toISOString(),source:'NEXT_SHIFT'}}});}
    if (existing) throw new AppError('Shift hari ini sudah tercatat', 409);
    const start = await getDynamicConfig('SHIFT_START_TIME', '08:00');
    const lateMinutes = Math.max(0, Math.floor((Date.now() - new Date(`${dateKey}T${start}:00+07:00`).getTime()) / 60000)-(await getDynamicConfig('SHIFT_LATE_TOLERANCE_MINUTES',0)));
    return db.staffActivity.create({ data: { userId, dateKey, activityKey: 'SHIFT', kind: 'SHIFT', policySnapshot:await capturePolicySnapshot(),checklist:{startKind:await getDynamicConfig('SHIFT_ATTENDANCE_MODE','IN_OUT')==='OPTIONAL'?'BUSINESS_START':'CHECK_IN'},lateMinutes } });
  }
  if (!existing || existing.checkOutAt || existing.checklist?.state==='FINISHED') throw new AppError('Tidak ada shift aktif', 409);
  const activeSales = await db.pjpStop.findFirst({ where: {pjp:{userId},status:'PENDING',OR:[{attendances:{some:{userId,type:'IN'},none:{userId,type:'OUT'}}},{visitSession:{path:['state'],equals:'ACTIVE'}}]},include:{outlet:true,attendances:true} });
  const activeVisit = (await db.staffActivity.findMany({ where: { userId, kind: 'VISIT', checkOutAt: null } })).find(row=>row.checklist?.state!=='FINISHED');
  if ((activeSales || activeVisit)&&!await processValue(existing,'SHIFT_ALLOW_OPEN_VISITS',false)) throw new AppError('Selesaikan kunjungan aktif sebelum mengakhiri shift', 409);
  if(activeSales&&await processValue(activeSales,'SALES_ATTENDANCE_MODE','IN_OUT')==='IN_OUT')await flagVisit(db,activeSales,userId,'SHIFT_END');
  if(activeVisit)await db.operationalException.upsert({where:{dedupeKey:`OPEN_SPV_VISIT:${activeVisit.id}`},update:{},create:{dedupeKey:`OPEN_SPV_VISIT:${activeVisit.id}`,kind:'OPEN_SPV_VISIT',entityId:activeVisit.id,userId,details:{source:'SHIFT_END',outletName:activeVisit.outletName}}});
  if(await processValue(existing,'SHIFT_ATTENDANCE_MODE','IN_OUT')!=='IN_OUT')return db.staffActivity.update({where:{id:existing.id},data:{checklist:{state:'FINISHED',finishedAt:new Date().toISOString(),source:'USER_RESULT'}}});
  const updated = await db.staffActivity.updateMany({ where: { id: existing.id, checkOutAt: null }, data: { checkOutAt: new Date() } });
  if (!updated.count) throw new AppError('Shift sudah diakhiri', 409);
  return db.staffActivity.findUnique({where:{id:existing.id}});
}

export const recordShift=(userId,action)=>withUserTransaction(userId,db=>perform(db,userId,action));
