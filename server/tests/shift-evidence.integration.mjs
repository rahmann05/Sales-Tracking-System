import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {recordShift} from '../src/modules/staff-attendance/shift.service.js';
import {flagShiftRange} from '../src/modules/staff-attendance/shift-range.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const ids=[];let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const reject=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=';
try{
 const person=async()=>{const u=await prisma.user.create({data:{name:'Shift evidence test',email:randomUUID()+'@example.invalid',password:'unused',role:'SALES'}});ids.push(u.id);return u;};
 const today=wibDateKey(),weekday=new Date(`${today}T12:00:00Z`).getUTCDay(),other=String((weekday+1)%7);
 const run=(u,action,patch={},data={})=>withPolicy({values:{...CONFIG_DEFAULTS,...patch}},()=>recordShift(u.id,action,data));
 const u=await person();
 await reject(()=>run(u,'SHIFT_IN',{}, {photoUrl:'data:image/jpeg;base64,aGVsbG8='}),422);
 await reject(()=>run(u,'SHIFT_IN',{EVIDENCE_IMAGE_FORMATS:'JPEG'}, {photoUrl:photo}),422);
 await reject(()=>run(u,'SHIFT_IN',{EVIDENCE_ALLOW_REMOTE_IMAGES:false}, {photoUrl:'https://example.invalid/photo.jpg'}),422);
 eq(await prisma.staffActivity.count({where:{userId:u.id}}),0);
 await reject(()=>run(u,'SHIFT_IN',{SHIFT_WORKING_DAYS:other,SHIFT_NON_WORKDAY_POLICY:'BLOCK'}),409);
 await reject(()=>run(u,'SHIFT_IN',{SHIFT_WORKING_DAYS:other,SHIFT_NON_WORKDAY_POLICY:'REASON'}),422);
 eq(await prisma.staffActivity.count({where:{userId:u.id}}),0);
 await reject(()=>run(u,'SHIFT_IN',{SHIFT_IN_PHOTO:'REQUIRED'}),422);
 await reject(()=>run(u,'SHIFT_IN',{SHIFT_REQUIRE_GPS:true}),422);
 const evidence={photoUrl:photo,latitude:-6.9,longitude:107.6,accuracy:10,observedAt:new Date().toISOString(),notes:'Lembur di luar hari kerja'};
 const values={SHIFT_WORKING_DAYS:other,SHIFT_NON_WORKDAY_POLICY:'REASON',SHIFT_IN_PHOTO:'REQUIRED',SHIFT_OUT_PHOTO:'REQUIRED',SHIFT_REQUIRE_GPS:true,SHIFT_GPS_REQUIRE_METADATA:true,SHIFT_GPS_MAX_ACCURACY_METERS:20};
 await reject(()=>run(u,'SHIFT_IN',values,{...evidence,accuracy:50}),422);
 await reject(()=>run(u,'SHIFT_IN',values,{...evidence,observedAt:new Date(Date.now()-300000).toISOString()}),422);
 const entered=await run(u,'SHIFT_IN',values,evidence);
 eq(entered.photoUrl,photo);eq(entered.checklist.scheduleException,'NON_WORKDAY');eq(entered.gpsEvidence.accuracy,10);
 // A live relaxation must not change the evidence rules frozen at entry.
 await reject(()=>run(u,'SHIFT_OUT',{SHIFT_REQUIRE_GPS:false,SHIFT_OUT_PHOTO:'OPTIONAL'}),422);
 const exited=await run(u,'SHIFT_OUT',{EVIDENCE_IMAGE_FORMATS:'JPEG'},evidence);
 eq(Boolean(exited.checkOutAt),true);eq(exited.checklist.finishEvidence.photoUrl,photo);eq(exited.photoUrl,photo);eq(exited.checklist.startKind,'CHECK_IN');
 await reject(()=>run(u,'SHIFT_OUT',{},evidence),409);
 for(const mode of ['IN_ONLY','OPTIONAL']){
  const actor=await person();const patch={SHIFT_ATTENDANCE_MODE:mode,SHIFT_IN_PHOTO:mode==='OPTIONAL'?'REQUIRED':'OPTIONAL',SHIFT_OUT_PHOTO:'REQUIRED',SHIFT_REQUIRE_GPS:mode==='OPTIONAL'};
  const row=await run(actor,'SHIFT_IN',patch);const done=await run(actor,'SHIFT_OUT');
  eq(done.checkOutAt,null);eq(done.checklist.state,'FINISHED');eq(done.checklist.startKind,row.checklist.startKind);
 }
 const actor=await person(),tomorrow=wibDateKey(Date.now()+86400000);
 const row=await prisma.staffActivity.create({data:{userId:actor.id,dateKey:tomorrow,activityKey:'SHIFT',kind:'SHIFT',checkInAt:new Date(),policySnapshot:{values:{...CONFIG_DEFAULTS,SHIFT_EARLY_FINISH_POLICY:'REASON'}}}});
 await reject(()=>run(actor,'SHIFT_OUT'),422);
 const closed=await run(actor,'SHIFT_OUT',{}, {notes:'Keperluan mendesak keluarga'});eq(closed.checklist.finishEvidence.exception,'EARLY_FINISH');
 const late=await prisma.staffActivity.create({data:{userId:actor.id,dateKey:'2026-10-01',activityKey:'SHIFT',kind:'SHIFT',checkInAt:new Date('2026-10-01T01:00:00Z'),policySnapshot:{values:{...CONFIG_DEFAULTS,SHIFT_END_OVERRUN_MINUTES:10}}}});
 const flag=await flagShiftRange(prisma,late,'TEST',Date.parse('2026-10-01T10:11:00Z'));eq(flag.details.pastScheduledEnd,true);
 await flagShiftRange(prisma,late,'TEST',Date.parse('2026-10-01T10:12:00Z'));eq(await prisma.operationalException.count({where:{entityId:late.id}}),1);
 eq((await prisma.staffActivity.findUnique({where:{id:late.id}})).checkOutAt,null);
 eq(row.checkOutAt,null);
 console.log(`Shift schedule/evidence passed: ${checks} assertions; independent calendar, exceptions, GPS quality, snapshot, IN_ONLY/OPTIONAL, no fabricated OUT.`);
}finally{
 await prisma.operationalException.deleteMany({where:{userId:{in:ids}}});await prisma.staffActivity.deleteMany({where:{userId:{in:ids}}});await prisma.user.deleteMany({where:{id:{in:ids}}});await prisma.$disconnect();
}
