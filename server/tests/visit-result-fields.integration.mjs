import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {checkIn} from '../src/modules/absensi/services/check-in.service.js';
import {checkOut} from '../src/modules/absensi/services/check-out.service.js';
import {createOffPjpAttendance} from '../src/modules/absensi/services/create-off-pjp-attendance.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag=`visit-result-${randomUUID()}`,users=[],outlets=[];let cluster,pjp,offId;
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},reject=async(fn)=>{await assert.rejects(fn,e=>e.statusCode===422);checks++;};
const values={...CONFIG_DEFAULTS,ATTENDANCE_REQUIRE_ACTIVE_SHIFT:false,ATTENDANCE_ENFORCE_SEQUENCE:false,ATTENDANCE_ENFORCE_GEOFENCE:false,ATTENDANCE_ENFORCE_MIN_DURATION:false,SALES_REQUIRE_GPS:false,SALES_IN_PHOTO:'OPTIONAL',SALES_OUT_PHOTO:'OPTIONAL',FEATURE_NOTIFICATIONS_MODE:'OFF',OFF_PJP_REQUIRE_GPS:false,OFF_PJP_REQUIRE_PHOTO:false,OFF_PJP_REQUIRE_REVIEW:false};
const run=(patch,fn)=>withPolicy({values:{...values,...patch},versions:[],at:new Date().toISOString()},fn);
const outcome={purpose:'ORDER',note:'Pemilik menerima penawaran',offer:'Katalog Belfoods baru',obstacle:'Tidak ada kendala',attachments:[{name:'toko.png',dataUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII='}]};
try{
 const spv=await prisma.user.create({data:{name:tag,email:`${randomUUID()}@example.invalid`,role:'SUPERVISOR',password:'unused'}});users.push(spv.id);
 const sales=await prisma.user.create({data:{name:tag,email:`${randomUUID()}@example.invalid`,role:'SALES',password:'unused',supervisorId:spv.id}});users.push(sales.id);
 cluster=await prisma.cluster.create({data:{name:tag,region:'Uji',supervisorId:spv.id,assignedSalesId:sales.id}});
 for(let i=0;i<3;i++){const o=await prisma.outlet.create({data:{name:tag,address:'Alamat uji',clusterId:cluster.id,latitude:-6.9,longitude:107.6}});outlets.push(o.id);}
 pjp=await prisma.pjp.create({data:{userId:sales.id,type:'SALES',date:new Date(`${wibDateKey()}T05:00:00Z`),stops:{create:outlets.map((outletId,i)=>({outletId,sequence:i+1}))}},include:{stops:{orderBy:{sequence:'asc'}}}});
 const [a,b,c]=pjp.stops;
 const required={SALES_ATTENDANCE_MODE:'OPTIONAL',VISIT_RESULT_OFFER_MODE:'REQUIRED',VISIT_RESULT_OBSTACLE_MODE:'REQUIRED',VISIT_RESULT_ATTACHMENT_MODE:'REQUIRED',VISIT_RESULT_REQUIRE_NOTE:true};
 await run(required,()=>checkIn(a.id,sales.id,null,null));
 await reject(()=>run({},()=>checkOut(a.id,sales.id,null,null,null,{})));
 await reject(()=>run({},()=>checkOut(a.id,sales.id,null,null,null,{visitOutcome:{purpose:'OTHER',note:'Catatan'}})));
 eq((await prisma.pjpStop.findUnique({where:{id:a.id}})).status,'PENDING');
 const completed=await run({VISIT_RESULT_OFFER_MODE:'DISABLED'},()=>checkOut(a.id,sales.id,null,null,null,{visitOutcome:outcome}));
 eq(completed.logical,true);eq(completed.visitOutcome,outcome);eq(await prisma.attendance.count({where:{pjpStopId:a.id}}),0);
 eq((await prisma.pjpStop.findUnique({where:{id:a.id}})).visitSession.result.visitOutcome,outcome);
 const disabled={SALES_ATTENDANCE_MODE:'IN_ONLY',VISIT_RESULT_OFFER_MODE:'DISABLED',VISIT_RESULT_OBSTACLE_MODE:'DISABLED',VISIT_RESULT_ATTACHMENT_MODE:'DISABLED'};
 await run(disabled,()=>checkIn(b.id,sales.id,null,null));
 await reject(()=>run({},()=>checkOut(b.id,sales.id,null,null,null,{visitOutcome:outcome})));
 await run({},()=>checkOut(b.id,sales.id,null,null,null,{visitOutcome:{purpose:'OTHER',note:'Pemilik belum ditemui'}}));
 eq(await prisma.attendance.count({where:{pjpStopId:b.id,type:'OUT'}}),0);
 eq((await prisma.pjpStop.findUnique({where:{id:b.id}})).visitSession.result.visitOutcome.note,'Pemilik belum ditemui');
 await run({SALES_ATTENDANCE_MODE:'IN_OUT'},()=>checkIn(c.id,sales.id,null,null));
 const normal=await run({},()=>checkOut(c.id,sales.id,null,null,null,{visitOutcome:outcome}));eq(normal.visitOutcome,outcome);
 const off={requestId:randomUUID(),outletName:tag,address:'Alamat uji',reason:'Kunjungan tambahan',visitOutcome:outcome};
 const saved=await run(required,()=>createOffPjpAttendance(sales.id,off));offId=saved.id;eq(saved.visitOutcome,outcome);
 const retry=await run({VISIT_RESULT_ATTACHMENT_MODE:'DISABLED'},()=>createOffPjpAttendance(sales.id,off));eq(retry.id,offId);
 console.log(`Visit result fields integration passed: ${checks} assertions, snapshots, three attendance modes, stored generic notes/attachments, off-PJP and replay.`);
}finally{
 if(offId)await prisma.offPjpAttendance.delete({where:{id:offId}});
 await prisma.systemConfig.deleteMany({where:{key:{startsWith:`_OFF_PJP_REQUEST:${users[1]}:`}}});
 if(pjp){await prisma.attendance.deleteMany({where:{pjpStopId:{in:pjp.stops.map(s=>s.id)}}});await prisma.pjp.delete({where:{id:pjp.id}});}
 await prisma.notification.deleteMany({where:{userId:{in:users}}});await prisma.notificationOutbox.deleteMany({where:{userId:{in:users}}}).catch(()=>{});
 await prisma.outlet.deleteMany({where:{id:{in:outlets}}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});await prisma.user.deleteMany({where:{id:{in:users}}});await prisma.$disconnect();
}
