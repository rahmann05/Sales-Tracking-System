// Isolated policy profiles and disposable fixtures; no company/role profiles or external providers.
import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {ALL_PERMISSIONS} from '../src/modules/roles/roles.constants.js';
import {profileKey,invalidatePolicyCache} from '../src/modules/config/services/policy-resolver.service.js';
import {pairwiseCases,assertPairwiseCoverage} from './helpers/pairwise.mjs';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
import {archiveHash} from '../src/modules/reports/services/report-archive.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local fixtures only');
const tag='c18-cross-'+randomUUID(),users=[],products=[],pjps=[],profiles=[],archiveKeys=[],actors={},grants=Object.fromEntries(ALL_PERMISSIONS.map(p=>[p.key,true]));
let cluster,outlet,checks=0,revision=0,boundaryCases=0,lifecycleCases=0;
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const eq=(actual,expected,note)=>{assert.deepEqual(actual,expected,note);checks++;};
const api=async(actor,path,body={},method='POST')=>{
 const response=await fetch(`http://127.0.0.1:${server.address().port}/api/v1${path}`,{method,headers:{Authorization:'Bearer '+jwt.sign({id:actor.id,tokenVersion:0},config.jwtSecret),'Content-Type':'application/json'},...(!['GET','HEAD'].includes(method)?{body:JSON.stringify(body)}:{})});
 return {status:response.status,body:await response.json()};
};
const base={...CONFIG_DEFAULTS,FEATURE_NOTIFICATIONS_MODE:'OFF',ATTENDANCE_REQUIRE_ACTIVE_SHIFT:false,SALES_REQUIRE_GPS:false,ATTENDANCE_ENFORCE_GEOFENCE:false,ATTENDANCE_ENFORCE_SEQUENCE:false,ATTENDANCE_ENFORCE_MIN_DURATION:false,SALES_REQUIRE_VISIT_RESULT:false,VISIT_RESULT_REQUIRE_NOTE:false,SALES_IN_PHOTO:'OPTIONAL',SALES_OUT_PHOTO:'OPTIONAL',SPV_REQUIRE_GPS:false,SPV_REQUIRE_PHOTO:false,SPV_ENFORCE_GEOFENCE:false,SPV_ENFORCE_VISIT_LIMIT:false,SPV_AUDIT_ITEMS:[],SALES_ALLOW_PRODUCT_CREATE:true};
const setPolicy=async(spv,values)=>{
 const key=profileKey('TEAM:'+spv.id);if(!profiles.includes(key))profiles.push(key);
 const value={versions:[{revision:++revision,effectiveAt:new Date(0).toISOString(),values:{...base,...values}}]};
 await prisma.systemConfig.upsert({where:{key},create:{key,value},update:{value}});invalidatePolicyCache();
};
const setPermissions=(actor,values={})=>prisma.user.update({where:{id:actor.id},data:{permissions:{...grants,...values}}});
const newStop=async(sales)=>{
 const pjp=await prisma.pjp.create({data:{userId:sales.id,type:'SALES',date:new Date(`${wibDateKey()}T05:00:00Z`),stops:{create:{outletId:outlet.id,sequence:1}}},include:{stops:true}});pjps.push(pjp.id);return pjp.stops[0];
};
const specs=[
 ['OFF_PJP','/absensi/off-pjp',['SALES'],'can_submit_off_pjp'],
 ['ORDERS','/orders',['SALES'],'can_create_order'],
 ['REGISTRATION','/customer-registrations',['ADMIN','SUPERVISOR','SALES'],'can_register_outlet'],
 ['OUTLET_MASTER','/outlets',['ADMIN','SUPERVISOR'],'can_manage_outlets'],
 ['CLUSTERS','/clusters',['ADMIN','SUPERVISOR'],'can_manage_clusters'],
 ['PJP','/pjp/planning',['ADMIN','SUPERVISOR'],'can_manage_rjp'],
 ['PACKING','/delivery/packing-lists',['ADMIN'],'can_manage_packing_list'],
 ['DELIVERY','/delivery/routes',['ADMIN','KEPALA_GUDANG'],'can_manage_delivery_routes'],
 ['VEHICLES','/vehicles',['ADMIN','SUPERVISOR'],'can_manage_vehicles'],
 ['REPORTS','/reports/archives',['ADMIN'],'can_create_report_archive'],
 ['REROUTE','/route-changes',['SALES'],'can_request_reroute'],
];
try{
 for(const role of ['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR']){const user=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'fixture',role,permissions:grants}});users.push(user.id);actors[role]=user;}
 const spv=actors.SUPERVISOR,sales=actors.SALES;
 const foreign=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'fixture',role:'SUPERVISOR',permissions:grants}});users.push(foreign.id);
 for(const actor of Object.values(actors))await prisma.user.update({where:{id:actor.id},data:{supervisorId:spv.id}});
 cluster=await prisma.cluster.create({data:{name:tag,region:tag,supervisorId:spv.id,assignedSalesId:sales.id}});
 outlet=await prisma.outlet.create({data:{name:tag,address:'Jl Uji No 1',latitude:-6.9,longitude:107.6,clusterId:cluster.id}});
 const dimensions={role:Object.keys(actors),mode:['ACTIVE','PAUSED','OFF'],permission:[true,false]};
 const boundary=pairwiseCases(dimensions);assertPairwiseCoverage(assert,dimensions,boundary);
 // Invalid payloads deliberately stop at schema validation: assertions here prove boundary ordering, not successful domain workflows.
 for(const [feature,path,roles,key] of specs)for(const c of boundary){
  await setPolicy(spv,{['FEATURE_'+feature+'_MODE']:c.mode});await setPermissions(actors[c.role],{[key]:c.permission});
  const result=await api(actors[c.role],path);
  const replayAware=['OFF_PJP','ORDERS','REGISTRATION','REPORTS'].includes(feature);
  const expected=!replayAware&&c.mode!=='ACTIVE'?409:!roles.includes(c.role)||!c.permission?403:400;
  eq(result.status,expected,JSON.stringify({feature,...c,response:result.body}));boundaryCases++;
 }
 // Real catalog writes independently combine company feature availability, account grants and the Sales-only product setting.
 const productDimensions={role:Object.keys(actors),mode:['ACTIVE','PAUSED','OFF'],permission:[true,false],allowSales:[true,false]};
 const productCases=pairwiseCases(productDimensions);assertPairwiseCoverage(assert,productDimensions,productCases);
 for(const c of productCases){
  await setPolicy(spv,{FEATURE_PRODUCTS_MODE:c.mode,SALES_ALLOW_PRODUCT_CREATE:c.allowSales});await setPermissions(actors[c.role],{can_create_product:c.permission});
  const sku=tag+'-'+randomUUID(),before=await prisma.product.count({where:{sku}});
  const result=await api(actors[c.role],'/products',{sku,name:tag,price:1000,unit:'Karton',baseUnit:'Pcs',unitsPerUnit:12});
  const expected=c.mode!=='ACTIVE'?409:!['ADMIN','SALES'].includes(c.role)||!c.permission||c.role==='SALES'&&!c.allowSales?403:201;
  eq(result.status,expected,JSON.stringify({...c,response:result.body}));
  const saved=await prisma.product.findUnique({where:{sku}});if(saved)products.push(saved.id);eq(Boolean(saved),expected===201);eq(before,0);boundaryCases++;
 }
 // Existing Sales work retains its snapshot and owner despite live rules, team and lock changes.
 const salesDimensions={attendance:['IN_OUT','IN_ONLY','OPTIONAL'],mode:['ACTIVE','PAUSED','OFF'],permission:[true,false],transfer:[true,false],locked:[true,false]};
 const salesCases=pairwiseCases(salesDimensions);assertPairwiseCoverage(assert,salesDimensions,salesCases);
 for(const c of salesCases){
  await prisma.user.update({where:{id:sales.id},data:{supervisorId:spv.id}});await setPermissions(sales);
  await prisma.outlet.update({where:{id:outlet.id},data:{lockStatus:'NORMAL'}});
  await setPolicy(spv,{SALES_ATTENDANCE_MODE:c.attendance});const stop=await newStop(sales);
  const start=await api(sales,`/absensi/${stop.id}/in`);eq(start.status,201,JSON.stringify(start.body));
  if(c.transfer)await prisma.user.update({where:{id:sales.id},data:{supervisorId:foreign.id}});
  const changed={SALES_ATTENDANCE_MODE:c.attendance==='IN_OUT'?'OPTIONAL':'IN_OUT',SALES_IN_PHOTO:'REQUIRED',SALES_OUT_PHOTO:'REQUIRED',FEATURE_SALES_VISITS_MODE:c.mode};
  await setPolicy(spv,changed);await setPolicy(foreign,changed);await setPermissions(sales,{can_record_sales_visit:c.permission});
  if(c.locked)await prisma.outlet.update({where:{id:outlet.id},data:{lockStatus:'LOCKED'}});
  const result=await api(sales,`/absensi/${stop.id}/out`,{notes:'Kunjungan selesai dengan aturan awal'});eq(result.status,201,JSON.stringify({c,response:result.body}));
  eq(await prisma.attendance.count({where:{pjpStopId:stop.id,type:'IN'}}),c.attendance==='OPTIONAL'?0:1);
  eq(await prisma.attendance.count({where:{pjpStopId:stop.id,type:'OUT'}}),c.attendance==='IN_OUT'?1:0);
  eq((await prisma.pjpStop.findUnique({where:{id:stop.id}})).policySnapshot.values.SALES_ATTENDANCE_MODE,c.attendance);
  lifecycleCases++;
 }
 await prisma.user.update({where:{id:sales.id},data:{supervisorId:spv.id}});
 // A paused report feature refuses genuinely new archives, but can recover an already committed request after a lost response.
 const archiveRequest={kind:'MONTH',period:'2026-10',requestId:randomUUID(),reason:'Arsip fixture uji ulang koneksi'},report={summary:{mtdActualAmount:0},salesmen:[]};
 const archiveKey='_REPORT_ARCHIVE:'+archiveRequest.requestId;archiveKeys.push(archiveKey);
 await prisma.systemConfig.create({data:{key:archiveKey,value:{...archiveRequest,id:archiveRequest.requestId,createdBy:actors.ADMIN.id,report,digest:archiveHash(report)}}});
 await setPermissions(actors.ADMIN);
 for(const mode of ['ACTIVE','PAUSED','OFF'])for(const enabled of [true,false]){
  await setPolicy(spv,{FEATURE_REPORTS_MODE:mode,REPORT_ARCHIVE_ENABLED:enabled});
  const replay=await api(actors.ADMIN,'/reports/archives',archiveRequest);eq(replay.status,201);eq(replay.body.data.id,archiveRequest.requestId);
  eq((await api(actors.ADMIN,'/reports/archives/'+archiveRequest.requestId,{},'GET')).status,200);
  if(mode!=='ACTIVE'||!enabled){
   const newId=randomUUID(),key='_REPORT_ARCHIVE:'+newId;
   eq((await api(actors.ADMIN,'/reports/archives',{...archiveRequest,requestId:newId})).status,409);
   eq(await prisma.systemConfig.count({where:{key}}),0);
  }
 }
 // SPV own active audit/finish is distinct from starting a new visit or assigning a new follow-up.
 const spvDimensions={attendance:['IN_OUT','IN_ONLY','OPTIONAL'],mode:['ACTIVE','PAUSED','OFF'],permission:[true,false],allowJoint:[true,false],transfer:[true,false],previousDay:[true,false]};
 const spvCases=pairwiseCases(spvDimensions);assertPairwiseCoverage(assert,spvDimensions,spvCases);
 for(const c of spvCases){
  await setPermissions(spv);await setPolicy(spv,{SPV_ATTENDANCE_MODE:c.attendance,SPV_ALLOW_JOINT_VISIT:true});
  await prisma.cluster.update({where:{id:cluster.id},data:{supervisorId:spv.id}});const stop=await newStop(sales);
  const start=await api(spv,'/staff-attendance',{action:'VISIT_IN',visitMode:'JOINT_VISIT',stopId:stop.id});eq(start.status,201,JSON.stringify(start.body));const id=start.body.data.id;
  if(c.previousDay)await prisma.staffActivity.update({where:{id},data:{dateKey:wibDateKey(Date.now()-86400000),checkInAt:new Date(Date.now()-86400000)}});
  if(c.transfer)await prisma.cluster.update({where:{id:cluster.id},data:{supervisorId:foreign.id}});
  await setPermissions(spv,{can_record_supervisor_visit:c.permission});await setPolicy(spv,{FEATURE_SPV_VISITS_MODE:c.mode,SPV_ALLOW_JOINT_VISIT:c.allowJoint,SPV_ATTENDANCE_MODE:c.attendance==='IN_OUT'?'OPTIONAL':'IN_OUT',SPV_AUDIT_ITEMS:[{key:'new',label:'Pertanyaan baru',required:true}]});
  const visible=await api(spv,'/staff-attendance',{},'GET');eq(visible.status,200);eq(visible.body.data.some(row=>row.id===id),true,'Own active visit stays reachable after midnight or territory transfer');
  const audit=await api(spv,'/staff-attendance',{action:'AUDIT',visitMode:'JOINT_VISIT',stopId:stop.id,checklist:{}});eq(audit.status,201,JSON.stringify({c,response:audit.body}));
  const stranger=await api(foreign,'/staff-attendance',{action:'VISIT_OUT',stopId:stop.id});eq(stranger.status,409,'Only actor-owned active work can finish');
  const result=await api(spv,'/staff-attendance',{action:'VISIT_OUT',visitMode:'JOINT_VISIT',stopId:stop.id});eq(result.status,201,JSON.stringify({c,response:result.body}));
  eq(result.body.data.checklist.state,'FINISHED');eq(Boolean(result.body.data.checkOutAt),c.attendance==='IN_OUT');eq(result.body.data.policySnapshot.values.SPV_ATTENDANCE_MODE,c.attendance);lifecycleCases++;
 }
 console.log(`C18 cross-module pairwise passed: ${boundaryCases} boundary/catalog cases, ${lifecycleCases} real Sales/SPV lifecycle cases, ${checks} assertions. Full pair coverage per declared dimension set; not every UI control or physical-device combination.`);
}finally{
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 const stops=await prisma.pjpStop.findMany({where:{pjpId:{in:pjps}},select:{id:true}});
 await prisma.operationalException.deleteMany({where:{userId:{in:users}}});await prisma.attendance.deleteMany({where:{pjpStopId:{in:stops.map(s=>s.id)}}});await prisma.staffActivity.deleteMany({where:{userId:{in:users}}});
 await prisma.notification.deleteMany({where:{userId:{in:users}}});await prisma.auditEvent.deleteMany({where:{actorId:{in:users}}});
 await prisma.pjp.deleteMany({where:{id:{in:pjps}}});if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 await prisma.product.deleteMany({where:{id:{in:products}}});await prisma.systemConfig.deleteMany({where:{key:{in:[...profiles,...archiveKeys]}}});await prisma.user.deleteMany({where:{id:{in:users}}});invalidatePolicyCache();await prisma.$disconnect();
}
