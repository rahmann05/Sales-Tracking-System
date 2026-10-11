// Explicit operator test. Prerequisites are isolated fixtures; all business transitions use HTTP.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
import {preparationStages} from '../../shared/warehouse-policy.mjs';
import {parseAuditItems,DEFAULT_AUDIT_ITEMS} from '../../shared/supervision-checklist.mjs';

const production=process.argv.includes('--approved-production');
const casePath=process.argv.find(arg=>arg.startsWith('--case='))?.slice(7);
assert.ok(!production||!casePath,'Policy variations are LOCAL only');
const variation=casePath?JSON.parse(fs.readFileSync(casePath)):null;
assert.ok(production||process.argv.includes('--local'),'Explicit environment required');
const env=dotenv.parse(fs.readFileSync(production?'.env.production':'.env'));
const url=new URL(env.DIRECT_URL||env.DATABASE_URL);
assert.ok(production?url.hostname.endsWith('.neon.tech'):['localhost','127.0.0.1','[::1]'].includes(url.hostname));
if(production)url.searchParams.set('sslmode','verify-full');
const db=new PrismaClient({datasources:{db:{url:url.toString()}}});
const base=production?'https://sinar-anugrah-production.up.railway.app/api/v1':'http://127.0.0.1:5000/api/v1';
const prefix='UAT-MATRIX-'+randomUUID(),users=[],routes=[];
let cluster,outlet,product,vehicle,pjp,order,packing,profileKey;
const report={at:new Date().toISOString(),environment:production?'PRODUCTION':'LOCAL',prefix,checks:[],scope:'HTTP order/approval/packing/partial delivery/return/redelivery; synthetic GPS/image fixtures, not device or field truth'};
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=';
const check=(name,actual,expected)=>{assert.deepEqual(actual,expected,name);report.checks.push({name,status:'PASS'});};
async function request(actor,path,method='GET',body,expected=200){
 const response=await fetch(base+path,{method,headers:{'content-type':'application/json',...(actor?.token?{authorization:'Bearer '+actor.token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const data=await response.json();
 assert.equal(response.status,expected,`${method} ${path}: ${data.message||JSON.stringify(data.errors||{})}`);
 report.checks.push({name:method+' '+path,status:'PASS',http:response.status});return data.data;
}
async function user(role,password,hash){
 const row=await db.user.create({data:{name:prefix+' '+role,email:randomUUID()+'@example.invalid',password:hash,role,roleCode:role}});users.push(row.id);
 const session=await request(null,'/auth/login','POST',{email:row.email,password});return {...row,token:session.accessToken};
}
try{
 const password=randomUUID(),hash=await bcrypt.hash(password,10);
 const admin=await user('ADMIN',password,hash),spv=await user('SUPERVISOR',password,hash),sales=await user('SALES',password,hash),warehouse=await user('KEPALA_GUDANG',password,hash),driver=await user('SUPIR',password,hash);
 if(variation){
  profileKey='_POLICY_PROFILE:TEAM:'+spv.id;
  for(const actor of [admin,sales,warehouse,driver])await db.user.update({where:{id:actor.id},data:{supervisorId:spv.id}});
  await db.systemConfig.create({data:{key:profileKey,value:{versions:[{revision:1,effectiveAt:new Date(0).toISOString(),values:variation.values}]}}});
  report.variation=variation;
 }
 cluster=await db.cluster.create({data:{name:prefix,region:'UAT isolated fixture',supervisorId:spv.id,assignedSalesId:sales.id}});
 await db.user.update({where:{id:sales.id},data:{clusterId:cluster.id,supervisorId:spv.id}});
 outlet=await db.outlet.create({data:{name:'Toko Uji '+prefix,address:'Jalan Pengujian No. 1, Kelurahan Sukaraja, Kecamatan Cicendo, Kota Bandung, Jawa Barat (fixture sintetis)',clusterId:cluster.id,latitude:-6.9,longitude:107.6}});
 product=await db.product.create({data:{name:prefix,sku:prefix,price:1000}});
 vehicle=await db.vehicle.create({data:{code:prefix,name:prefix,maxCartons:20,maxWeightKg:100,fuelKmPerLiter:5,fuelType:'DIESEL',fuelPricePerLiter:10000}});
 pjp=await db.pjp.create({data:{userId:sales.id,date:new Date(wibDateKey()+'T00:00:00+07:00'),type:'SALES',status:'IN_PROGRESS',stops:{create:{outletId:outlet.id,sequence:1,status:'PENDING'}}},include:{stops:true}});
 const stop=pjp.stops[0];
 await db.attendance.create({data:{pjpStopId:stop.id,userId:sales.id,type:'IN',latitude:-6.9,longitude:107.6,photoUrl:photo}});
 const body={requestId:randomUUID(),pjpStopId:stop.id,paymentType:'CASH',items:[{productId:product.id,quantity:100}]};
 order=await request(sales,'/orders','POST',body,201);
 check('order retry preserves ID',(await request(sales,'/orders','POST',body,201)).id,order.id);
 await request(sales,'/orders/'+order.id+'/approve','PATCH',{},403);
 if(order.status==='PENDING_APPROVAL'){
  const mode=order.policySnapshot?.values?.ORDER_APPROVAL_MODE;
  if(mode!=='ADMIN')order=await request(spv,'/orders/'+order.id+'/approve','PATCH',{});
  if(order.status==='PENDING_APPROVAL')order=await request(admin,'/orders/'+order.id+'/approve','PATCH',{});
 }
 check('order approved',order.status,'APPROVED');
 order=await db.order.findUnique({where:{id:order.id},include:{items:true}});
 packing=await db.packingList.findFirst({where:{sourceOrderId:order.id},include:{invoices:true}});
 const packingBody={sourceOrderId:order.id,outletId:outlet.id,totalCartons:10,totalWeight:20,notes:prefix,items:[{sourceOrderItemId:order.items[0].id,lineId:order.items[0].id,name:product.name,sku:product.sku,quantity:100,unit:'unit'}],invoices:[{invoiceNumber:prefix,totalCartons:10,totalAmount:order.totalValue}]};
 packing=await request(admin,packing?'/delivery/packing-lists/'+packing.id:'/delivery/packing-lists',packing?'PUT':'POST',packing?{...packingBody,revision:packing.revision}:packingBody,packing?200:201);
 if(packing.status==='DRAFT')packing=await request(admin,'/delivery/packing-lists/'+packing.id+'/status','PATCH',{action:'RELEASE'});
 check('packing released',packing.status,'RELEASED');
 packing=await db.packingList.findUnique({where:{id:packing.id},include:{invoices:true}});
 async function trip(startKm,endKm,partial){
  const r=await request(warehouse,'/delivery/routes','POST',{date:wibDateKey(),vehicleId:vehicle.id,driverId:driver.id,totalDistanceKm:endKm-startKm,stops:[{packingListId:packing.id,outletId:outlet.id,sequence:1}]},201);routes.push(r.id);
  const quantities=Object.fromEntries(r.stops.flatMap(s=>s.allocatedItems.map(i=>[s.id+':'+i.lineId,i.quantity])));
  const act=(actor,action,extra={})=>request(actor,'/delivery/routes/'+r.id+'/actions','POST',{action,note:prefix,...extra});
  for(const stage of preparationStages(r.policySnapshot?.values))await act(stage==='CHECK'&&r.policySnapshot?.values?.WAREHOUSE_SEPARATE_CHECKER?admin:warehouse,stage,{cartons:r.totalCartons,quantities});
  const answers=Object.fromEntries((r.policySnapshot?.values?.TRIP_DEPARTURE_CHECKLIST||[]).map(i=>[i.key,true]));
  await act(driver,'START',{odometer:startKm,departureAnswers:answers});
  const ds=r.stops[0],evidence=r.policySnapshot?.driverEvidence?.values||r.policySnapshot?.values||{};
  const receipt={...(evidence.DELIVERY_RECIPIENT_MODE!=='DISABLED'?{recipientName:'Penerima sintetis UAT'}:{}),...(evidence.DELIVERY_SIGNATURE_MODE==='REQUIRED'?{signatureDataUrl:photo}:{})};
  async function attendance(type,result){const payload={requestId:randomUUID(),type,latitude:-6.9,longitude:107.6,accuracy:5,observedAt:new Date().toISOString(),photoUrl:photo,...(result?{result}:{})};const a=await request(driver,'/delivery/stops/'+ds.id+'/attendance','POST',payload,201);check('driver retry '+type,(await request(driver,'/delivery/stops/'+ds.id+'/attendance','POST',payload,201)).id,a.id);}
  await attendance('IN');
  await attendance('OUT',partial?{...receipt,status:'PARTIAL_REJECT',rejectReason:'Kemasan sintetis rusak UAT',rejectedCartons:2,rejectedItems:[{lineId:packing.items[0].lineId,quantity:20}],rejectedInvoices:[{invoiceId:packing.invoices[0].id,cartons:2}]}:{...receipt,status:'DELIVERED'});
  await act(driver,'RETURN',{odometer:endKm});
  if(partial){
   check('partial delivery keeps invoice open',(await db.invoice.findUnique({where:{id:packing.invoices[0].id}})).isDelivered,false);
   const inspection={note:prefix,receivedCartons:2,reusableCartons:2,items:[{lineId:packing.items[0].lineId,received:20,reusable:20}],reusableInvoices:[{invoiceId:packing.invoices[0].id,cartons:2}]};
   await request(warehouse,'/delivery/stops/'+ds.id+'/return','POST',inspection);
   await request(warehouse,'/delivery/stops/'+ds.id+'/return','POST',inspection,409);
  }
  for(const issue of await db.deliveryIssue.findMany({where:{routeId:r.id,status:'OPEN'}}))await request(warehouse,'/delivery/issues/'+issue.id+'/resolve','PATCH',{resolution:prefix+' diperiksa'});
  await act(warehouse,'CLOSE',{documentsReturned:true});
  await request(warehouse,'/delivery/routes/'+r.id+'/actions','POST',{action:'CLOSE',note:prefix,documentsReturned:true},409);
  check('vehicle odometer posted once',(await db.vehicle.findUnique({where:{id:vehicle.id}})).totalKm,endKm);
 }
 await trip(0,20,true);
 const partial=await request(sales,'/orders/'+order.id);check('partial accepted quantity',partial.fulfillmentLines[0].accepted,80);check('partial remaining quantity',partial.fulfillmentLines[0].remaining,20);
 await trip(20,30,false);
 for(const actor of [sales,spv,admin]){const result=await request(actor,'/orders/'+order.id);check(actor.role+' accepted quantity',result.fulfillmentLines[0].accepted,100);check(actor.role+' remaining quantity',result.fulfillmentLines[0].remaining,0);}
 check('invoice fulfilled after redelivery',(await db.invoice.findUnique({where:{id:packing.invoices[0].id}})).isDelivered,true);
 // Actual supervision HTTP transitions; an active shift is a synthetic prerequisite.
 await db.staffActivity.create({data:{userId:spv.id,dateKey:wibDateKey(),activityKey:'SHIFT',kind:'SHIFT'}});
 await request(spv,'/staff-attendance','POST',{action:'VISIT_IN',stopId:stop.id,visitMode:'PRIORITY_AUDIT',latitude:-6.9,longitude:107.6,accuracy:5,observedAt:new Date().toISOString(),photoUrl:photo},201);
 const policy=await request(spv,'/config/runtime');
 const questions=parseAuditItems(policy.SPV_AUDIT_ITEMS||DEFAULT_AUDIT_ITEMS);
 const checklist=Object.fromEntries(questions.map(q=>[q.key,q.type==='TEXT'?'Jawaban sintetis UAT':q.type==='NUMBER'?q.max??Math.max(q.min||0,q.failureBelow||0):q.type==='SELECT'?q.options.find(v=>!q.failedValues?.includes(v))||q.options[0]:true]));
 const audit=await request(spv,'/staff-attendance','POST',{action:'AUDIT',stopId:stop.id,checklist,followUp:{ownerId:sales.id,dueDate:wibDateKey(),note:prefix+' tindak lanjut sintetis'}},201);
 let submission=await request(sales,'/staff-attendance/follow-ups/'+audit.id,'PATCH',{note:prefix+' hasil sintetis',evidence:'Referensi sintetis untuk uji alur; bukan kegiatan lapangan'});
 if(submission.followUp.status==='SUBMITTED'){
  const reviewer=submission.followUp.reviewerMode==='ADMIN'?admin:spv;
  submission=await request(reviewer,'/staff-attendance/follow-ups/'+audit.id+'/review','POST',{decision:'RETURN',note:prefix+' lengkapi hasil',submissionId:submission.followUp.submission.id});check('follow-up returned',submission.followUp.status,'OPEN');
  submission=await request(sales,'/staff-attendance/follow-ups/'+audit.id,'PATCH',{note:prefix+' hasil diperbaiki',evidence:'Referensi sintetis UAT diperbaiki'});
  submission=await request(reviewer,'/staff-attendance/follow-ups/'+audit.id+'/review','POST',{decision:'ACCEPT',note:prefix+' hasil diterima',submissionId:submission.followUp.submission.id});
 }
 check('follow-up complete',submission.followUp.status,'DONE');
 await request(spv,'/staff-attendance','POST',{action:'VISIT_OUT',stopId:stop.id},201);
 // Optional outlet review: no Google calls and no bypass of current workflow rules.
 await request(spv,'/outlets/'+outlet.id+'/reviews','POST',{reason:prefix+' pemeriksaan tanpa flag'},422);
 let review=await request(admin,'/outlets/'+outlet.id+'/reviews','POST',{reason:prefix+' pemeriksaan opsional Admin'});
 let task=await request(admin,'/outlets/'+outlet.id+'/reviews/'+review.id+'/field-task','POST',{revision:review.revision,ownerId:sales.id,reviewerId:spv.id,instructions:prefix+' verifikasi data sintetis'});
 check('validation agenda linked',Boolean(task.pjpStopId),true);
 const evidence={requestId:randomUUID(),outcome:'FOUND',name:outlet.name,address:outlet.address,note:prefix+' bukti sintetis pengujian',latitude:outlet.latitude,longitude:outlet.longitude,accuracyMeters:5,capturedAt:new Date().toISOString(),photo};
 let submitted=await request(sales,'/outlets/field-tasks/'+task.id,'PATCH',{action:'SUBMIT',revision:task.revision,evidence});
 check('field submission retry',(await request(sales,'/outlets/field-tasks/'+task.id,'PATCH',{action:'SUBMIT',revision:task.revision,evidence})).id,submitted.id);
 task=await request(spv,'/outlets/field-tasks/'+task.id,'PATCH',{action:'RETURN',revision:submitted.revision,reason:prefix+' perbaiki bukti sintetis'});check('field evidence returned',task.status,'OPEN');
 submitted=await request(sales,'/outlets/field-tasks/'+task.id,'PATCH',{action:'SUBMIT',revision:task.revision,evidence:{...evidence,requestId:randomUUID(),capturedAt:new Date().toISOString()}});
 task=await request(spv,'/outlets/field-tasks/'+task.id,'PATCH',{action:'ACCEPT',revision:submitted.revision,reason:prefix+' bukti sintetis diterima'});check('field evidence accepted',task.status,'DONE');
 review=await db.outletReview.findUnique({where:{id:review.id}});
 review=await request(admin,'/outlets/'+outlet.id+'/reviews/'+review.id+'/digital','PATCH',{action:'FIELD_KEEP',revision:review.revision,reason:prefix+' hasil sintetis selesai'});check('optional review completed',review.status,'COMPLETED');
 check('outlet field source',(await db.outlet.findUnique({where:{id:outlet.id}})).validationDetails.decisionSource,'FIELD');
 report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.message;process.exitCode=1;}
finally{
 try{
  if(profileKey)await db.systemConfig.deleteMany({where:{key:profileKey}});
  const fixtureOrders=await db.order.findMany({where:{createdBy:{in:users}},select:{id:true}}),orderIds=fixtureOrders.map(o=>o.id);
  const packs=await db.packingList.findMany({where:{outletId:outlet?.id||'absent'} ,select:{id:true}}),packIds=packs.map(p=>p.id);
  const fixtureRoutes=await db.deliveryRoute.findMany({where:{driverId:{in:users}},select:{id:true}}),routeIds=fixtureRoutes.map(r=>r.id);
  await db.notification.deleteMany({where:{OR:[{userId:{in:users}},{message:{contains:prefix}},...orderIds.map(id=>({payload:{path:['orderId'],equals:id}})),...routeIds.map(id=>({payload:{path:['routeId'],equals:id}}))]}});
  await db.deliveryIssue.deleteMany({where:{routeId:{in:routeIds}}});
  await db.deliveryAttendance.deleteMany({where:{driverId:{in:users}}});
  await db.deliveryStop.deleteMany({where:{deliveryRouteId:{in:routeIds}}});await db.deliveryRoute.deleteMany({where:{id:{in:routeIds}}});
  await db.invoice.deleteMany({where:{packingListId:{in:packIds}}});await db.packingList.deleteMany({where:{id:{in:packIds}}});
  await db.orderItem.deleteMany({where:{orderId:{in:orderIds}}});await db.order.deleteMany({where:{id:{in:orderIds}}});
  await db.attendance.deleteMany({where:{userId:{in:users}}});await db.pjp.deleteMany({where:{userId:{in:users}}});
  await db.staffActivity.deleteMany({where:{userId:{in:users}}});
  if(outlet){await db.outletFieldTask.deleteMany({where:{review:{outletId:outlet.id}}});await db.outletReview.deleteMany({where:{outletId:outlet.id}});}
  if(outlet)await db.outlet.delete({where:{id:outlet.id}});
  await db.user.updateMany({where:{id:{in:users}},data:{clusterId:null,supervisorId:null}});
  if(cluster)await db.cluster.delete({where:{id:cluster.id}});
  await db.user.deleteMany({where:{id:{in:users}}});if(product)await db.product.delete({where:{id:product.id}});if(vehicle)await db.vehicle.delete({where:{id:vehicle.id}});
  report.cleanup='PASS';
 }catch(error){report.cleanup='FAIL';report.cleanupError=error.message;process.exitCode=1;}
 await db.$disconnect();
 const file=variation?.reportPath||'../docs/SYSTEM_TRANSACTION_'+(production?'PRODUCTION':'LOCAL')+'_20261011.json';
 if(fs.existsSync(file)){const previous=JSON.parse(fs.readFileSync(file));report.previousAttempts=[...(previous.previousAttempts||[]),{at:previous.at,status:previous.status,checks:previous.checks.length,cleanup:previous.cleanup,error:previous.error}];}
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,checks:report.checks.length,cleanup:report.cleanup,error:report.error,cleanupError:report.cleanupError}));
}
