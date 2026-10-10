import { prisma } from '../../../config/prisma.js';
import { AppError } from '../../../utils/errors.js';
import { getDynamicConfig } from '../../config/config.service.js';
import {shiftDateKey} from '../../../../../shared/shift-policy.mjs';
import {processPolicyValues} from '../../../../../shared/process-policy.mjs';
export async function requireActiveShift(userId, db = prisma) {
  if(await getDynamicConfig('FEATURE_SHIFT_MODE','ACTIVE')!=='ACTIVE'||await getDynamicConfig('SHIFT_ATTENDANCE_MODE','IN_OUT')==='OPTIONAL')return;
  if (!await getDynamicConfig('ATTENDANCE_REQUIRE_ACTIVE_SHIFT', false)) return;
  const dateKey=shiftDateKey(Date.now(),await getDynamicConfig('SHIFT_DAY_CUTOFF_TIME','00:00'));
  const shift=await db.staffActivity.findFirst({ where: {userId,kind:'SHIFT',dateKey,checkOutAt:null},select:{id:true,checklist:true} });
  if (!shift||shift.checklist?.state==='FINISHED') throw new AppError('Mulai shift sebelum kunjungan',409);
}
export async function findAttendanceException(outletId,userId,db=prisma,purpose='GEOFENCE',stopId=null) {
  const requests=await db.outletUnlockRequest.findMany({where:{outletId,requestedBy:userId,status:'APPROVED',kind:{in:[purpose,'BOTH']},expiresAt:{gt:new Date()}},orderBy:[{expiresAt:'asc'},{id:'asc'}],select:{id:true,policySnapshot:true}});
  for(const request of requests){
    const limit=Number(processPolicyValues(request.policySnapshot).UNLOCK_MAX_VISITS_PER_APPROVAL)||0;
    if(!limit)return request;
    const where={outletId,pjp:{userId},visitSession:{path:['exceptionIds'],array_contains:[request.id]}};
    // An IN and OUT on the same stop share one use. Failed transactions never consume it.
    if(stopId&&await db.pjpStop.count({where:{...where,id:stopId}}))return request;
    if(await db.pjpStop.count({where})<limit)return request;
  }
  return null;
}
export async function attendanceException(outletId,userId,db=prisma,purpose='GEOFENCE',stopId=null) {
  return Boolean(await findAttendanceException(outletId,userId,db,purpose,stopId));
}
