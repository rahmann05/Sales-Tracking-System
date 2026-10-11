// Interactive LOCAL UAT with disposable records. Stops/cleans on Ctrl+C.
import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import {prisma} from '../src/config/prisma.js';
import {initSocket} from '../src/config/socket.js';
import {cache} from '../src/config/cache.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
import {openOutletReview} from '../src/modules/outlets/services/outlet-reviews.service.js';
import {runValidationJobs} from '../src/modules/outlets/services/outlet-validation-job.service.js';
import {effectivePolicy} from '../src/modules/config/services/policy-resolver.service.js';
import {policySnapshot} from '../src/modules/config/services/process-policy.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'LOCAL only');
const matrix=process.argv.includes('--matrix');
assert.ok(matrix||process.argv.includes('--approved-google-20'),'Explicit additional Google budget required');
const resume=process.argv.includes('--resume');
let tag='UAT-DESKTOP-'+randomUUID().slice(0,8);
const users=[],outlets=[],clusters=[],ledger={at:new Date().toISOString(),tag,maxCalls:20,calls:[],scope:'Local disposable UAT; real Google only for two authorized outlet copies, no independent field truth'};
const ledgerPath=matrix?'../docs/SYSTEM_T07_T09_SESSION_20261011.json':'../docs/SYSTEM_UAT_GOOGLE_BUDGET_20261011.json';
const controlPath='../.backups/t07-t09-control.json';
const readControl=()=>{try{return JSON.parse(fs.readFileSync(controlPath,'utf8'));}catch{return {worker:false,provider:'EMPTY',delay:100};}};
if(matrix){ledger.scope='Local T07/T09 desktop fixtures; Google mocked, zero paid calls';ledger.maxCalls=null;}
if(fs.existsSync(ledgerPath)){const previous=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));ledger.calls=previous.calls||[];ledger.previousAttempts=[...(previous.previousAttempts||[]),{at:previous.at,tag:previous.tag,cleanup:previous.cleanup,cleanupError:previous.cleanupError}];if(resume){assert.ok(previous.tag.startsWith('UAT-DESKTOP-'));assert.notEqual(previous.cleanup,'PASS');tag=previous.tag;ledger.tag=tag;}}
const saveLedger=()=>fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 const host=new URL(url).hostname;
 if(['places.googleapis.com','maps.googleapis.com'].includes(host)){
  if(matrix){const control=readControl();ledger.calls.push({at:new Date().toISOString(),mock:true,host});saveLedger();await new Promise(resolve=>setTimeout(resolve,control.delay||0));return {ok:control.provider!=='ERROR',status:control.provider==='ERROR'?403:200,json:async()=>host==='places.googleapis.com'?{places:[]}:{status:'ZERO_RESULTS',results:[]}};}
  if(ledger.calls.length>=ledger.maxCalls)throw Error('UAT_GOOGLE_BUDGET_EXHAUSTED');
  ledger.calls.push({at:new Date().toISOString(),host,path:new URL(url).pathname});saveLedger();
 }
 return realFetch(url,options);
};
let profileKey,roleBaseline,roleChanged=false,server,socket,cleaning=false,worker;
async function cleanup(){
 if(cleaning)return;cleaning=true;
 clearInterval(worker);
 try{
  globalThis.fetch=realFetch;
  if(socket)await new Promise(resolve=>socket.close(resolve));
  else if(server)await new Promise(resolve=>server.close(resolve));
  const ids=users.map(u=>u.id);
  await prisma.notification.deleteMany({where:{userId:{in:ids}}});
  await prisma.auditEvent.deleteMany({where:{actorId:{in:ids}}});
  await prisma.outletValidationJob.deleteMany({where:{actorId:{in:ids}}});
  await prisma.outletFieldTask.deleteMany({where:{review:{outletId:{in:outlets}}}});
  await prisma.outletValidationRun.deleteMany({where:{review:{outletId:{in:outlets}}}});
  await prisma.outletReview.deleteMany({where:{outletId:{in:outlets}}});
  await prisma.outletChange.deleteMany({where:{outletId:{in:outlets}}});
  await prisma.operationalException.deleteMany({where:{userId:{in:ids}}});
  await prisma.outletUnlockRequest.deleteMany({where:{outletId:{in:outlets}}});
  await prisma.attendance.deleteMany({where:{userId:{in:ids}}});
  await prisma.pjp.deleteMany({where:{userId:{in:ids}}});
  await prisma.staffActivity.deleteMany({where:{userId:{in:ids}}});
  await prisma.customerRegistration.deleteMany({where:{salesmanId:{in:ids}}});
  await prisma.outlet.deleteMany({where:{id:{in:outlets}}});
  await prisma.user.updateMany({where:{id:{in:ids}},data:{clusterId:null,supervisorId:null}});
  await prisma.cluster.deleteMany({where:{id:{in:clusters}}});
  await prisma.user.deleteMany({where:{id:{in:ids}}});
  if(profileKey)await prisma.systemConfig.deleteMany({where:{key:profileKey}});
  if(roleChanged){if(roleBaseline)await prisma.systemConfig.update({where:{key:'ROLE_DEFINITIONS'},data:{value:roleBaseline.value,updatedAt:roleBaseline.updatedAt}});else await prisma.systemConfig.deleteMany({where:{key:'ROLE_DEFINITIONS'}});}
  invalidateConfigCache();ledger.cleanup='PASS';
 }catch(e){ledger.cleanup='FAIL';ledger.cleanupError=e.message;process.exitCode=1;}
 finally{saveLedger();cache.close();await prisma.$disconnect();console.log(JSON.stringify({cleanup:ledger.cleanup,googleCalls:ledger.calls.length,error:ledger.cleanupError}));}
}
try{
 const password='UatBrowser2026!',hash=await bcrypt.hash(password,10);
 let pjp,prior;
 if(resume){
  users.push(...await prisma.user.findMany({where:{email:{endsWith:'-'+tag.toLowerCase()+'@example.invalid'}},orderBy:{createdAt:'asc'}}));assert.equal(users.length,matrix?10:6);
  outlets.push(...(await prisma.outlet.findMany({where:{outletCode:{startsWith:tag+'-'}},orderBy:{outletCode:'asc'}})).map(o=>o.id));assert.equal(outlets.length,matrix?30:2);
  clusters.push(...(await prisma.cluster.findMany({where:{name:{startsWith:tag}}})).map(c=>c.id));assert.equal(clusters.length,matrix?2:1);
  const spv=users.find(u=>u.role==='SUPERVISOR'),sales=users.find(u=>u.role==='SALES'&&u.roleCode==='SALES');profileKey='_POLICY_PROFILE:TEAM:'+spv.id;
  pjp=await prisma.pjp.findFirstOrThrow({where:{userId:sales.id,date:new Date(wibDateKey()+'T00:00:00+07:00')},include:{stops:true}});
  prior=await prisma.pjp.findFirstOrThrow({where:{userId:sales.id,date:new Date('2026-10-09T00:00:00+07:00')}});
  roleBaseline=await prisma.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}});
  roleBaseline={...roleBaseline,value:roleBaseline.value.filter(r=>!r.code.startsWith(tag.replaceAll('-','_')+'_'))};roleChanged=true;
 }else{
 for(const role of ['ADMIN','SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'])users.push(await prisma.user.create({data:{name:tag+' '+role,email:role.toLowerCase()+'-'+tag.toLowerCase()+'@example.invalid',password:hash,role,roleCode:role}}));
 const [admin,spv,sales]=users;
 for(const u of users.filter(u=>u.id!==spv.id))await prisma.user.update({where:{id:u.id},data:{supervisorId:spv.id}});
 profileKey='_POLICY_PROFILE:TEAM:'+spv.id;
 await prisma.systemConfig.create({data:{key:profileKey,value:{versions:[{revision:1,effectiveAt:new Date(0).toISOString(),values:{OUTLET_REVIEW_MAX_CALLS:6,OUTLET_REVIEW_MAX_CANDIDATES:20,OUTLET_FIELD_REQUIRE_GPS:false,OUTLET_FIELD_REQUIRE_PHOTO:true,ATTENDANCE_REQUIRE_ACTIVE_SHIFT:false,PJP_WORKING_DAYS:'0,1,2,3,4,5,6',SALES_ATTENDANCE_MODE:'OPTIONAL'}}]}}});
 const cluster=await prisma.cluster.create({data:{name:tag,region:'Bandung · UAT',assignedSalesId:sales.id,supervisorId:spv.id}});clusters.push(cluster.id);
 await prisma.user.update({where:{id:sales.id},data:{clusterId:cluster.id}});
 for(const name of ['INDOMARET FRESH GUNUNG BATU','Pak Yadi']){
  const original=await prisma.outlet.findFirst({where:{name:{equals:name,mode:'insensitive'},deletedAt:null},select:{name:true,address:true,latitude:true,longitude:true}});
  assert.ok(original,'Authorized source outlet missing: '+name);
  const copy=await prisma.outlet.create({data:{...original,outletCode:tag+'-'+outlets.length,clusterId:cluster.id,source:'IMPORT'}});outlets.push(copy.id);
 }
 pjp=await prisma.pjp.create({data:{userId:sales.id,date:new Date(wibDateKey()+'T00:00:00+07:00'),type:'SALES',stops:{create:outlets.map((id,i)=>({outletId:id,sequence:i+1}))}},include:{stops:true}});
 prior=await prisma.pjp.create({data:{userId:sales.id,date:new Date('2026-10-09T00:00:00+07:00'),type:'SALES',stops:{create:{outletId:outlets[0],sequence:1}}}});
 roleBaseline=await prisma.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}});
 const customCode=tag.replaceAll('-','_')+'_SALES';
 const definition={code:customCode,name:'Sales UAT tanpa tindak lanjut',baseRole:'SALES',isSystem:false,defaultPermissions:{can_view_follow_up:false}};
 await prisma.systemConfig.upsert({where:{key:'ROLE_DEFINITIONS'},create:{key:'ROLE_DEFINITIONS',value:[...(roleBaseline?.value||[]),definition]},update:{value:[...(roleBaseline?.value||[]),definition]}});roleChanged=true;
 const custom=await prisma.user.create({data:{name:tag+' CUSTOM',email:'custom-'+tag.toLowerCase()+'@example.invalid',password:hash,role:'SALES',roleCode:customCode,supervisorId:spv.id,clusterId:cluster.id,permissions:{can_view_follow_up:false}}});users.push(custom);
 }
 invalidateConfigCache();
 if(matrix&&!resume){
  assert.equal(await prisma.outletValidationJob.count({where:{status:{in:['QUEUED','RUNNING','STOPPING']}}}),0,'Existing local batch must not be processed by UAT worker');
  const [admin,spv,sales]=users;
  for(const [role,permissions] of [['ADMIN',{can_manage_users:false,can_manage_roles:false}],['SUPERVISOR',{can_view_reports:false}],['KEPALA_GUDANG',{can_view_delivery_monitor:false}],['SUPIR',{can_view_delivery_map:false}]]){
   const code=tag.replaceAll('-','_')+'_'+role,definition={code,name:'UAT kustom '+role,baseRole:role,isSystem:false,defaultPermissions:permissions};
   const definitions=await prisma.systemConfig.findUnique({where:{key:'ROLE_DEFINITIONS'}});await prisma.systemConfig.update({where:{key:'ROLE_DEFINITIONS'},data:{value:[...definitions.value,definition]}});
   users.push(await prisma.user.create({data:{name:tag+' CUSTOM '+role,email:'custom-'+role.toLowerCase()+'-'+tag.toLowerCase()+'@example.invalid',password:hash,role,roleCode:code,permissions,supervisorId:spv.id}}));
  }
  const otherSpv=users.find(u=>u.roleCode===tag.replaceAll('-','_')+'_SUPERVISOR'),otherSales=users.find(u=>u.name===tag+' CUSTOM');
  const other=await prisma.cluster.create({data:{name:tag+' TIM B',region:'Bandung UAT B',supervisorId:otherSpv.id,assignedSalesId:otherSales.id}});clusters.push(other.id);
  await prisma.user.update({where:{id:otherSales.id},data:{supervisorId:otherSpv.id,clusterId:other.id}});
  await prisma.outlet.update({where:{id:outlets[1]},data:{lockStatus:'LOCKED'}});
  const policy=await effectivePolicy(sales,Date.now(),{fresh:true});
  for(let n=2;n<30;n++){
   const outlet=await prisma.outlet.create({data:{outletCode:tag+'-'+String(n).padStart(2,'0'),name:'Toko UAT '+String(n).padStart(2,'0')+' '+tag,address:'Jalan Uji No '+n+', Kelurahan Sukaraja, Kecamatan Cicendo, Kota Bandung',clusterId:n===29?other.id:clusters[0],source:'IMPORT'}});outlets.push(outlet.id);
   const review=await openOutletReview(outlet.id,{reason:'Kasus sintetis pagination dan filter, bukan pemeriksaan data asli.'},admin);
   if(n<29)await prisma.outletFieldTask.create({data:{reviewId:review.id,ownerId:sales.id,reviewerId:spv.id,instructions:'UJI pagination: periksa identitas dan alamat toko.',schedule:{mode:'TODAY_ONLY',assignedOn:wibDateKey()},policySnapshot:policySnapshot(policy),dueAt:new Date(Date.now()+86400000),history:[]}});
  }
  invalidateConfigCache();
 }
 ledger.outletIds=outlets;ledger.userIds=users.map(u=>u.id);ledger.pjpIds=[pjp.id,prior.id];saveLedger();
 if(process.argv.includes('--cleanup-only')){await cleanup();process.exit(process.exitCode||0);}
 if(matrix){fs.writeFileSync(controlPath,JSON.stringify({worker:false,provider:'EMPTY',delay:100}));let running=false;worker=setInterval(async()=>{if(running||cleaning||!readControl().worker)return;running=true;try{await runValidationJobs();}catch(e){console.error('UAT_WORKER',e.message);}finally{running=false;}},250);}
 const site=express();site.use((req,res,next)=>req.path.startsWith('/api/')||req.path.startsWith('/uploads/')?app(req,res,next):next());
 site.use(express.static(path.resolve('../client/dist'),{setHeaders:res=>res.setHeader('Cache-Control','no-store')}));
 site.get('/',(req,res)=>res.sendFile(path.resolve('../client/dist/index.html')));
 server=createServer(site);socket=initSocket(server);
 await new Promise(resolve=>server.listen(Number(process.env.UAT_PORT)||0,'127.0.0.1',resolve));
 ledger.outletIds=outlets;ledger.userIds=users.map(u=>u.id);ledger.pjpIds=[pjp.id,prior.id];saveLedger();
 console.log('UAT_READY '+JSON.stringify({url:`http://127.0.0.1:${server.address().port}/`,accounts:users.map(u=>({role:u.role,name:u.name,email:u.email})),password,outlets,pjpStopIds:pjp.stops.map(s=>s.id),pid:process.pid}));
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>cleanup().then(()=>process.exit(process.exitCode||0)));
}catch(e){console.error(e.message);await cleanup();process.exitCode=1;}
