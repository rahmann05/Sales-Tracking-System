import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {savePolicyDraft,previewPolicy,publishPolicy,restorePolicy,cancelScheduledPolicy} from '../src/modules/config/services/policy-profiles.service.js';
import {effectivePolicy,profileKey,invalidatePolicyCache} from '../src/modules/config/services/policy-resolver.service.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {createOrder} from '../src/modules/orders/services/create-order.service.js';
import {approveOrder} from '../src/modules/orders/services/approve-order.service.js';
import {resolveOperationalException} from '../src/modules/attention/operational-exceptions.service.js';
import {getDailyCallReport} from '../src/modules/daily-calls/services/get-daily-call-report.service.js';
import {wibDateKey} from '../../shared/visit-metrics.mjs';

assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local database only');
const prefix=`policy-${randomUUID()}`,users=[],outlets=[];let cluster,pjp,product,scope;
let checks=0,revision=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const rejects=async(fn,status)=>{await assert.rejects(fn,e=>e.statusCode===status);checks++;};
const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
const api=async(actor,path,body,status=201,method='POST')=>{
 const token=jwt.sign({id:actor.id,tokenVersion:0},config.jwtSecret,{expiresIn:'5m'});
 const res=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const result=await res.json();assert.equal(res.status,status,`${path}: ${JSON.stringify(result)}`);checks++;return result.data;
};
const as=async(actor,fn)=>withPolicy(await effectivePolicy(actor,Date.now(),{fresh:true}),fn);
const user=async role=>{const person=await prisma.user.create({data:{name:`${prefix}-${role}`,email:`${randomUUID()}@example.invalid`,password:'test-only',role}});users.push(person.id);return person;};
let admin,spv,sales,foreign;
const publish=async(values,effectiveAt)=>{
 const saved=await savePolicyDraft(scope,{revision,values,reason:'Pengujian kebijakan terisolasi'},admin);revision=saved.revision;
 const preview=await previewPolicy(scope,revision);eq(preview.conflicts,[]);
 const next=await publishPolicy(scope,{revision,fingerprint:preview.fingerprint,effectiveAt},admin);revision=next.revision;return next;
};
try{
 admin=await user('ADMIN');spv=await user('SUPERVISOR');foreign=await user('SUPERVISOR');sales=await user('SALES');scope=`TEAM:${spv.id}`;
 sales=await prisma.user.update({where:{id:sales.id},data:{supervisorId:spv.id}});
 cluster=await prisma.cluster.create({data:{name:prefix,region:'Area uji',supervisorId:spv.id,assignedSalesId:sales.id}});
 for(let i=0;i<7;i++){const o=await prisma.outlet.create({data:{name:`${prefix}-${i}`,address:'Alamat uji',latitude:-6.9,longitude:107.6,clusterId:cluster.id}});outlets.push(o.id);}
 pjp=await prisma.pjp.create({data:{userId:sales.id,date:new Date(`${wibDateKey()}T05:00:00Z`),type:'SALES',stops:{create:outlets.map((outletId,i)=>({outletId,sequence:i+1}))}},include:{stops:{orderBy:{sequence:'asc'}}}});
 product=await prisma.product.create({data:{name:prefix,sku:prefix,price:1000}});
 const initial={SALES_ATTENDANCE_MODE:'IN_OUT',SALES_IN_PHOTO:'OPTIONAL',SALES_OUT_PHOTO:'OPTIONAL',SALES_REQUIRE_GPS:false,ATTENDANCE_ENFORCE_GEOFENCE:false,ATTENDANCE_ENFORCE_SEQUENCE:false,ATTENDANCE_REQUIRE_ACTIVE_SHIFT:false,ATTENDANCE_ENFORCE_MIN_DURATION:false,SALES_REQUIRE_VISIT_RESULT:false,VISIT_RESULT_REQUIRE_NOTE:false,SALES_ALLOW_CONTINUE_WITHOUT_OUT:false,ORDER_APPROVAL_MODE:'NONE',ORDER_REQUIRE_CHECKIN:true,PACKING_AUTO_FROM_APPROVED_ORDER:false,FEATURE_NOTIFICATIONS_MODE:'OFF'};
 const first=await publish(initial);
 eq((await previewPolicy(scope,revision)).counts.users,2);
 eq((await previewPolicy(scope,revision)).counts.shifts,0);
 eq((await effectivePolicy(sales)).values.SALES_ATTENDANCE_MODE,'IN_OUT');
 await rejects(()=>savePolicyDraft(scope,{revision:0,values:{SALES_ATTENDANCE_MODE:'IN_ONLY'},reason:'Draf yang kedaluwarsa'},admin),409);
 await rejects(()=>savePolicyDraft(scope,{revision,values:{MAPS_API_KEY:'private'},reason:'Bukan scope rahasia'},admin),400);
 const [a,b,c,d,e,f]=pjp.stops;
 const entered=await api(sales,`absensi/${a.id}/in`,{});eq(entered.latitude,null);eq(entered.longitude,null);
 await api(sales,`absensi/${b.id}/in`,{},409);
 const blocked=await prisma.pjpStop.findUnique({where:{id:b.id}});eq(blocked.visitSession,null);
 // A changed policy applies to new visits, while A retains its original blocking rule.
 await publish({SALES_ALLOW_CONTINUE_WITHOUT_OUT:true});
 await api(sales,`absensi/${b.id}/in`,{},409);
 await api(sales,`absensi/${a.id}/out`,{});
 await api(sales,`absensi/${b.id}/in`,{});
 const enteredC=await api(sales,`absensi/${c.id}/in`,{});eq(enteredC.settledVisits[0].id,b.id);
 const exception=await prisma.operationalException.findUnique({where:{dedupeKey:`MISSING_OUT:${b.id}`}});eq(exception.status,'OPEN');
 eq(await prisma.attendance.count({where:{pjpStopId:b.id,type:'OUT'}}),0);
 await rejects(()=>resolveOperationalException(exception.id,{decision:'ACKNOWLEDGED',note:'Sudah diperiksa'},foreign),403);
 await resolveOperationalException(exception.id,{decision:'REQUIRES_CORRECTION',note:'Perlu penjelasan dari petugas'},spv);
 eq((await prisma.operationalException.findUnique({where:{id:exception.id}})).status,'OPEN');
 const ownFlags=await api(sales,'attention/my-exceptions',undefined,200,'GET');eq(ownFlags.map(row=>row.id),[exception.id]);
 await api(foreign,`attention/exceptions/${exception.id}/clarify`,{note:'Mencoba menjawab milik orang lain'},404,'PATCH');
 const clarification=await api(sales,`attention/exceptions/${exception.id}/clarify`,{note:'Ponsel kehabisan baterai sesudah kunjungan selesai'},200,'PATCH');
 eq(clarification.details.clarifications.length,1);eq(clarification.status,'OPEN');
 await api(sales,`attention/exceptions/${exception.id}/clarify`,{note:'Pengiriman penjelasan ganda'},409,'PATCH');
 await api(sales,'attention',undefined,403,'GET');
 await resolveOperationalException(exception.id,{decision:'ACKNOWLEDGED',note:'Penjelasan petugas telah diterima'},spv);
 eq(await prisma.attendance.count({where:{pjpStopId:b.id,type:'OUT'}}),0);
 // Fingerprints detect open-work changes after preview.
 let draft=await savePolicyDraft(scope,{revision,values:{SALES_ATTENDANCE_MODE:'IN_ONLY'},reason:'Uji pratinjau kedaluwarsa'},admin);revision=draft.revision;
 const stale=await previewPolicy(scope,revision);
 await api(sales,`absensi/${c.id}/out`,{});
 await rejects(()=>publishPolicy(scope,{revision,fingerprint:stale.fingerprint},admin),409);
 const second=await publish({SALES_ATTENDANCE_MODE:'IN_ONLY'});
 await api(sales,`absensi/${d.id}/in`,{});await api(sales,`absensi/${d.id}/out`,{notes:'Hasil kegiatan tanpa bukti OUT'});
 eq(await prisma.attendance.count({where:{pjpStopId:d.id,type:'OUT'}}),0);
 const optional=await publish({SALES_ATTENDANCE_MODE:'OPTIONAL'});
 await api(sales,`absensi/${e.id}/in`,{});eq(await prisma.attendance.count({where:{pjpStopId:e.id}}),0);
 const requestId=randomUUID(),items=[{productId:product.id,quantity:2}];
 const order=await as(sales,()=>createOrder(sales.id,e.id,items,'CASH',undefined,{requestId}));eq(order.status,'APPROVED');eq(order.approvedBy,null);eq(order.history[0].action,'POLICY_AUTO_APPROVE');
 await publish({FEATURE_ORDERS_MODE:'PAUSED',FEATURE_SALES_VISITS_MODE:'PAUSED'});
 const replay=await as(sales,()=>createOrder(sales.id,e.id,items,'CASH',undefined,{requestId}));eq(replay.id,order.id);
 await rejects(()=>as(sales,()=>createOrder(sales.id,e.id,items,'CASH')),409);
 await api(sales,`absensi/${f.id}/in`,{},409);
 await api(sales,`absensi/${e.id}/out`,{notes:'Selesai saat fitur dijeda'});
 eq(await prisma.attendance.count({where:{pjpStopId:e.id}}),0);
 await publish({FEATURE_ORDERS_MODE:'ACTIVE',FEATURE_SALES_VISITS_MODE:'ACTIVE',ORDER_APPROVAL_MODE:'SEQUENTIAL'});
 await api(sales,`absensi/${f.id}/in`,{});
 const sequential=await as(sales,()=>createOrder(sales.id,f.id,items,'CASH'));
 await rejects(()=>as(admin,()=>approveOrder(sequential.id,admin.id)),409);
 eq((await as(spv,()=>approveOrder(sequential.id,spv.id))).status,'PENDING_APPROVAL');
 eq((await as(admin,()=>approveOrder(sequential.id,admin.id))).status,'APPROVED');
 const report=await as(admin,()=>getDailyCallReport({date:wibDateKey(),userId:sales.id}));
 const optionalRow=report.rows.find(row=>row.outletName===`${prefix}-4`||row.customerName===`${prefix}-4`);
 assert.ok(report.rows.length>=6);checks++;
 assert.ok(optionalRow,'Logical visit must remain visible in the report');checks++;
 eq(optionalRow.rawTimeOut,null);eq(optionalRow.durationMinutes,null);
 // Required SPV answers and the checklist version are frozen when the visit starts.
 const questions=[{key:'display',label:'Pajangan telah diperiksa',required:true}];
 await publish({SPV_ATTENDANCE_MODE:'OPTIONAL',SPV_AUDIT_ITEMS:questions});
 const spvVisit=await api(spv,'staff-attendance',{action:'VISIT_IN',stopId:a.id,visitMode:'PRIORITY_AUDIT'});
 eq(spvVisit.checklist.startKind,'BUSINESS_START');eq(spvVisit.latitude,null);
 await publish({SPV_AUDIT_ITEMS:[{key:'different',label:'Pertanyaan untuk kunjungan berikutnya',required:true}]});
 await api(spv,'staff-attendance',{action:'AUDIT',stopId:a.id,checklist:{}},422);
 await api(spv,'staff-attendance',{action:'VISIT_OUT',stopId:a.id},422);
 const answered=await api(spv,'staff-attendance',{action:'AUDIT',stopId:a.id,checklist:{display:false}});
 eq(answered.checklist.display,false);eq(answered.policySnapshot.values.SPV_AUDIT_ITEMS,questions);
 const spvFinished=await api(spv,'staff-attendance',{action:'VISIT_OUT',stopId:a.id});
 eq(spvFinished.checkOutAt,null);eq(spvFinished.checklist.state,'FINISHED');
 // Field address lookup uses authenticated server policy, including both stop switches.
 await publish({FEATURE_MAPS_MODE:'PAUSED'});
 await api(sales,'routing/reverse-geocode',{lat:0,lng:0},409);
 await publish({FEATURE_MAPS_MODE:'ACTIVE',PLACE_LOOKUP_PROVIDER:'OFF'});
 await api(sales,'routing/reverse-geocode',{lat:0,lng:0},403);
 await api(sales,'routing/reverse-geocode',{lat:null,lng:null},400);
 await publish({PLACE_LOOKUP_PROVIDER:'AUTO'});
 // Scheduled versions remain inactive before their effective date; rollback is only a draft.
 const future=new Date(Date.now()+3600000).toISOString();const scheduled=await publish({SALES_ATTENDANCE_MODE:'IN_ONLY'},future);
 eq((await effectivePolicy(sales)).values.SALES_ATTENDANCE_MODE,'OPTIONAL');
 eq((await effectivePolicy(sales,Date.now()+7200000)).values.SALES_ATTENDANCE_MODE,'IN_ONLY');
 await rejects(()=>cancelScheduledPolicy(scope,{revision:revision-1,versionId:scheduled.versions.at(-1).id,reason:'Pembatalan dari revisi lama'},admin),409);
 const cancelled=await cancelScheduledPolicy(scope,{revision,versionId:scheduled.versions.at(-1).id,reason:'Jadwal pengujian dibatalkan'},admin);revision=cancelled.revision;
 eq((await effectivePolicy(sales,Date.now()+7200000,{fresh:true})).values.SALES_ATTENDANCE_MODE,'OPTIONAL');
 assert.ok(cancelled.versions.at(-1).cancelledAt);checks++;
 await rejects(()=>cancelScheduledPolicy(scope,{revision,versionId:optional.versions.at(-1).id,reason:'Versi aktif tidak dapat dibatalkan'},admin),409);
 const restored=await restorePolicy(scope,{revision,versionId:first.versions[0].id,reason:'Pulihkan versi awal pengujian'},admin);revision=restored.revision;
 eq(restored.draft.SALES_ATTENDANCE_MODE,'IN_OUT');eq(restored.draft.FEATURE_ORDERS_MODE,null);
 eq((await effectivePolicy(sales)).values.SALES_ATTENDANCE_MODE,'OPTIONAL');
 eq(second.versions.length,3);assert.ok(optional.versions.length>second.versions.length);checks++;
 console.log(`PASS ${checks} policy workflow assertions; no company or production profiles changed.`);
}finally{
 await new Promise(resolve=>server.close(resolve));
 if(pjp){const ids=pjp.stops.map(s=>s.id);const orders=await prisma.order.findMany({where:{pjpStopId:{in:ids}},select:{id:true}});await prisma.systemConfig.deleteMany({where:{key:{in:orders.map(o=>`_ORDER_REVIEW:${o.id}`)}}});await prisma.order.deleteMany({where:{pjpStopId:{in:ids}}});await prisma.operationalException.deleteMany({where:{userId:{in:users}}});await prisma.attendance.deleteMany({where:{pjpStopId:{in:ids}}});await prisma.pjp.delete({where:{id:pjp.id}});}
 await prisma.notification.deleteMany({where:{OR:[{userId:{in:users}},{message:{contains:prefix}}]}});await prisma.staffActivity.deleteMany({where:{userId:{in:users}}});
 if(scope)await prisma.systemConfig.deleteMany({where:{key:profileKey(scope)}});
 await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});
 if(outlets.length)await prisma.outlet.deleteMany({where:{id:{in:outlets}}});
 if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 if(product)await prisma.product.delete({where:{id:product.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});invalidateConfigCache();invalidatePolicyCache();await prisma.$disconnect();
}


