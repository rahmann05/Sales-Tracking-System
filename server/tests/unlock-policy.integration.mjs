import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {requestOutletUnlock} from '../src/modules/outlets/services/request-outlet-unlock.service.js';
import {handleUnlockRequest} from '../src/modules/outlets/services/handle-unlock-request.service.js';
import {attendanceException} from '../src/modules/absensi/services/attendance-policy.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {checkIn} from '../src/modules/absensi/services/check-in.service.js';
import {checkOut} from '../src/modules/absensi/services/check-out.service.js';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
import {getUnlockRequests} from '../src/modules/outlets/services/get-unlock-requests.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='unlock-'+randomUUID(),users=[],outlets=[];let cluster,pjp,checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},reject=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
const run=(values,fn)=>withPolicy({values:{...CONFIG_DEFAULTS,...values},versions:[],at:new Date().toISOString()},fn);
try{
 const make=async role=>{const u=await prisma.user.create({data:{role,name:tag,email:randomUUID()+'@example.invalid',password:'unused'}});users.push(u.id);return u;};
 const admin=await make('ADMIN'),spv=await make('SUPERVISOR'),sales=await make('SALES');
 await prisma.user.update({where:{id:sales.id},data:{supervisorId:spv.id}});
 cluster=await prisma.cluster.create({data:{name:tag,region:'Test',assignedSalesId:sales.id,supervisorId:spv.id}});
 for(let i=0;i<4;i++)outlets.push(await prisma.outlet.create({data:{name:tag+i,address:'Test',clusterId:cluster.id}}));
 await reject(()=>run({UNLOCK_ALLOW_GEOFENCE:false},()=>requestOutletUnlock(outlets[0].id,sales.id,'GPS bergeser','GEOFENCE')),422);
 const request=await run({UNLOCK_REVIEWER_ROLE:'ADMIN',UNLOCK_VALIDITY_MINUTES:30},()=>requestOutletUnlock(outlets[0].id,sales.id,'GPS bergeser','GEOFENCE'));
 eq(request.kind,'GEOFENCE');eq(request.policySnapshot.values.UNLOCK_VALIDITY_MINUTES,30);
 await reject(()=>handleUnlockRequest(request.id,spv.id,true),403);
 const approved=await run({UNLOCK_VALIDITY_MINUTES:5},()=>handleUnlockRequest(request.id,admin.id,true));
 eq(Math.round((+approved.expiresAt-Date.now())/60000),30);
 eq(await attendanceException(outlets[0].id,sales.id,prisma,'GEOFENCE'),true);
 eq(await attendanceException(outlets[0].id,sales.id,prisma,'OUTLET_LOCK'),false);
 eq(await attendanceException(outlets[0].id,admin.id,prisma,'GEOFENCE'),false);
 await reject(()=>handleUnlockRequest(request.id,admin.id,true),409);
 const lock=await run({},()=>requestOutletUnlock(outlets[1].id,sales.id,'Outlet perlu dikunjungi','OUTLET_LOCK'));
 await handleUnlockRequest(lock.id,admin.id,true);
 eq(await attendanceException(outlets[1].id,sales.id,prisma,'GEOFENCE'),false);
 eq(await attendanceException(outlets[1].id,sales.id,prisma,'OUTLET_LOCK'),true);
 await prisma.outletUnlockRequest.update({where:{id:lock.id},data:{expiresAt:new Date(Date.now()-1000)}});
 eq(await attendanceException(outlets[1].id,sales.id,prisma,'OUTLET_LOCK'),false);
 const concurrent=await Promise.allSettled(outlets.slice(2).map(o=>run({UNLOCK_MAX_REQUESTS_PER_WINDOW:3},()=>requestOutletUnlock(o.id,sales.id,'Uji batas bersama','GEOFENCE'))));
 eq(concurrent.filter(r=>r.status==='fulfilled').length,1);eq(concurrent.find(r=>r.status==='rejected').reason.statusCode,429);
 eq(await prisma.outletUnlockRequest.count({where:{requestedBy:sales.id}}),3);
 // Real attendance transactions serialize usage, IN/OUT reuse one visit, failed writes consume nothing.
 await prisma.outletUnlockRequest.update({where:{id:request.id},data:{policySnapshot:{...request.policySnapshot,values:{...request.policySnapshot.values,UNLOCK_MAX_VISITS_PER_APPROVAL:1}}}});
 await prisma.outlet.update({where:{id:outlets[0].id},data:{latitude:-6.9,longitude:107.6}});
 pjp=await prisma.pjp.create({data:{userId:sales.id,date:new Date(`${wibDateKey()}T05:00:00Z`),type:'SALES',stops:{create:[1,2,3].map(sequence=>({outletId:outlets[0].id,sequence}))}},include:{stops:{orderBy:{sequence:'asc'}}}});
 const visitPolicy={SALES_ATTENDANCE_MODE:'IN_OUT',SALES_IN_PHOTO:'OPTIONAL',SALES_OUT_PHOTO:'OPTIONAL',SALES_REQUIRE_GPS:true,ATTENDANCE_ENFORCE_GEOFENCE:true,ATTENDANCE_ENFORCE_SEQUENCE:false,ATTENDANCE_REQUIRE_ACTIVE_SHIFT:false,ATTENDANCE_ENFORCE_MIN_DURATION:false,SALES_REQUIRE_VISIT_RESULT:false,SALES_ALLOW_CONTINUE_WITHOUT_OUT:true,GPS_REQUIRE_METADATA:false};
 await reject(()=>run({...visitPolicy,SALES_IN_PHOTO:'REQUIRED'},()=>checkIn(pjp.stops[0].id,sales.id,-7,108)),422);
 eq((await prisma.pjpStop.findUnique({where:{id:pjp.stops[0].id}})).visitSession,null);
 const attempts=await Promise.allSettled(pjp.stops.slice(0,2).map(stop=>run(visitPolicy,()=>checkIn(stop.id,sales.id,-7,108))));
 eq(attempts.filter(r=>r.status==='fulfilled').length,1);
 eq(attempts.find(r=>r.status==='rejected').reason.statusCode,422);
 const used=await prisma.pjpStop.findFirst({where:{pjpId:pjp.id,visitSession:{path:['exceptionIds'],array_contains:[request.id]}}});
 eq(used.visitSession.exceptionIds,[request.id]);
 // Persist the references on this active instance; later live changes cannot substitute them.
 const stored=await prisma.pjpStop.findUnique({where:{id:used.id}});
 await prisma.pjpStop.update({where:{id:used.id},data:{policySnapshot:{...stored.policySnapshot,values:{...stored.policySnapshot.values,ATTENDANCE_ENFORCE_MIN_DURATION:true,MINIMUM_VISIT_DURATION_MINUTES:5,ATTENDANCE_ALLOW_EARLY_CHECKOUT:true,ATTENDANCE_EARLY_ALLOW_CUSTOM_REASON:false,ATTENDANCE_EARLY_REASON_OPTIONS:'Pemilik sibuk'}}}});
 await reject(()=>run(visitPolicy,()=>checkOut(used.id,sales.id,-7,108,null,{earlyReason:'Alasan bebas'})),422);
 eq(await prisma.attendance.count({where:{pjpStopId:used.id,type:'OUT'}}),0);
 await run({...visitPolicy,ATTENDANCE_EARLY_REASON_OPTIONS:'Daftar baru'},()=>checkOut(used.id,sales.id,-7,108,null,{earlyReason:'Pemilik sibuk'}));
 eq(await prisma.attendance.count({where:{pjpStopId:used.id}}),2);
 eq(await attendanceException(outlets[0].id,sales.id,prisma,'GEOFENCE'),false);
 const displayed=(await getUnlockRequests({},sales)).find(row=>row.id===request.id);
 eq([displayed.maxVisits,displayed.usedVisits,displayed.remainingVisits],[1,1,0]);
 // In-radius visit remains allowed and does not consume another exception use.
 await run(visitPolicy,()=>checkIn(pjp.stops[2].id,sales.id,-6.9,107.6));
 eq((await prisma.pjpStop.findUnique({where:{id:pjp.stops[2].id}})).visitSession.exceptionIds,[]);
 console.log(`Unlock policy passed: ${checks} assertions; kinds, scope, expiry snapshot, reviewer, concurrency and rolling limit.`);
}finally{
 if(pjp){await prisma.attendance.deleteMany({where:{pjpStop:{pjpId:pjp.id}}});await prisma.operationalException.deleteMany({where:{userId:{in:users}}});await prisma.pjpStop.deleteMany({where:{pjpId:pjp.id}});await prisma.pjp.delete({where:{id:pjp.id}});}
 await prisma.notification.deleteMany({where:{userId:{in:users}}});await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});await prisma.outletUnlockRequest.deleteMany({where:{requestedBy:{in:users}}});await prisma.outlet.deleteMany({where:{id:{in:outlets.map(o=>o.id)}}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});await prisma.user.deleteMany({where:{id:{in:users}}});await prisma.$disconnect();
}
