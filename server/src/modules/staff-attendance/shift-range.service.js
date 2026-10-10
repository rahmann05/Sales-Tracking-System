import {wibDateKey} from '../../../../shared/visit-metrics.mjs';
import {shiftSchedule} from '../../../../shared/shift-policy.mjs';
export async function flagShiftRange(db,row,source='TIME_LIMIT',now=Date.now()){
 if(row.checkOutAt||row.checklist?.state==='FINISHED'||row.checklist?.startKind==='BUSINESS_START'||row.policySnapshot?.values?.SHIFT_ATTENDANCE_MODE&&row.policySnapshot.values.SHIFT_ATTENDANCE_MODE!=='IN_OUT')return null;
 const values=row.policySnapshot?.values||{},elapsed=now-+new Date(row.checkInAt),maxHours=Number(values.SHIFT_MAX_DURATION_HOURS||0);
 const overnight=wibDateKey(row.checkInAt)!==wibDateKey(now);
 const grace=Number(values.SHIFT_END_OVERRUN_MINUTES||0),scheduledEnd=shiftSchedule(row.dateKey,values).end;
 const pastScheduledEnd=grace>0&&now>scheduledEnd+grace*60000;
 if(!(overnight&&values.SHIFT_OVERNIGHT_POLICY==='FLAG'||maxHours>0&&elapsed>maxHours*3600000||pastScheduledEnd))return null;
 const person=await db.user.findUnique({where:{id:row.userId},select:{supervisorId:true}});
 const dedupeKey=`SHIFT_TIME_RANGE:${row.id}`;
 await db.operationalException.createMany({data:{dedupeKey,kind:'SHIFT_TIME_RANGE',entityId:row.id,userId:row.userId,supervisorId:person?.supervisorId,details:{source,overnight,elapsedMinutes:Math.floor(elapsed/60000),maxHours,pastScheduledEnd,scheduledEnd:new Date(scheduledEnd).toISOString(),endGraceMinutes:grace}},skipDuplicates:true});
 return db.operationalException.findUnique({where:{dedupeKey}});
}
