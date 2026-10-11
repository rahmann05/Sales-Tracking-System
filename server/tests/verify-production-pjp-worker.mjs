// Operator-approved production test: isolated future PJP fixtures, actual deployed worker.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {spawn} from 'node:child_process';
const production=process.argv.includes('--approved-production');
const crashRecovery=process.argv.includes('--crash-recovery');
assert.ok(!production||!crashRecovery,'Crash testing is LOCAL only');
assert.ok(production||process.argv.includes('--local'),'Explicit environment required');
const env=dotenv.parse(fs.readFileSync(production?'.env.production':'.env'));
const url=new URL(env.DIRECT_URL||env.DATABASE_URL);
assert.ok(production?url.hostname.endsWith('.neon.tech'):['localhost','127.0.0.1','[::1]'].includes(url.hostname));if(production)url.searchParams.set('sslmode','verify-full');
const db=new PrismaClient({datasources:{db:{url:url.toString()}}});
const base=production?'https://sinar-anugrah-production.up.railway.app/api/v1':'http://127.0.0.1:5000/api/v1';
const tag='UAT-WORKER-'+randomUUID(),users=[],plans=[];
let cluster,outlet;
const report={at:new Date().toISOString(),environment:production?'PRODUCTION':'LOCAL',tag,checks:[],scope:production?'20 isolated future plans consumed by deployed scheduled-publication worker; bounded workload, no outage/failover simulation':'20 isolated future plans, three concurrent local worker processes with explicit plan-ID filter; no production failover claim'};
const check=(name,a,b)=>{assert.deepEqual(a,b,name);report.checks.push({name,status:'PASS'});};
async function api(token,path,body){console.log('POST '+path);const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data.data;}
try{
 const password=randomUUID(),hash=await bcrypt.hash(password,10);
 const spv=await db.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:hash,role:'SUPERVISOR',roleCode:'SUPERVISOR'}});users.push(spv.id);
 const sales=await db.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:hash,role:'SALES',roleCode:'SALES',supervisorId:spv.id}});users.push(sales.id);
 cluster=await db.cluster.create({data:{name:tag,region:'Isolated worker test',supervisorId:spv.id,assignedSalesId:sales.id}});
 await db.user.update({where:{id:sales.id},data:{clusterId:cluster.id}});
 outlet=await db.outlet.create({data:{name:'Toko Uji '+tag,address:'Jalan Pengujian No. 1, Sukaraja, Cicendo, Bandung, Jawa Barat',latitude:-6.9,longitude:107.6,itineraryCode:'F1',clusterId:cluster.id}});
 const session=await api(null,'/auth/login',{email:spv.email,password}),token=session.accessToken;
 // Mondays at weekly intervals avoid working-day exclusions and overlapping plans.
 const first=new Date(Date.now()+7*86400000);while(first.getUTCDay()!==1)first.setUTCDate(first.getUTCDate()+1);
 for(let i=0;i<20;i++){
  const day=new Date(first.getTime()+i*7*86400000).toISOString().slice(0,10);
  const p=await api(token,'/pjp/planning',{requestId:randomUUID(),name:tag+' '+i,supervisorId:spv.id,startsOn:day,endsOn:day,rules:[{userId:sales.id,outletId:outlet.id,anchorDate:day,intervalWeeks:1}]});plans.push(p.id);
 }
 const scheduledAt=new Date(Date.now()+15000).toISOString();
 for(const id of plans){const p=await db.pjpPlan.findUnique({where:{id}});const scheduled=await api(token,'/pjp/planning/'+id+'/schedule',{revision:p.revision,note:tag,acknowledgeWarnings:true,codes:{[sales.id+':'+p.startsOn]:tag+'-'+id},scheduledAt:new Date(Math.max(Date.parse(scheduledAt),Date.now()+5000)).toISOString()});check('schedule accepted '+id,scheduled.status,'SCHEDULED');}
 const started=Date.now();
 if(crashRecovery){
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['tests/pjp-worker-race-child.mjs'],{env:{...process.env,UAT_PLAN_IDS:JSON.stringify(plans),UAT_CRASH_HOLD:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});let output='',killed=false;
   const timer=setTimeout(()=>{child.kill();reject(Error('Crash checkpoint not reached: '+output));},45000);
   child.stdout.on('data',chunk=>{output+=chunk;if(!killed&&output.includes('UNCOMMITTED_PJP_INSERTED')){killed=true;child.kill();}});child.stderr.on('data',chunk=>output+=chunk);
   child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('exit',()=>{clearTimeout(timer);killed?resolve():reject(Error('Worker exited before crash checkpoint: '+output));});
  });
  check('uncommitted agenda rolled back after killed worker',await db.pjp.count({where:{userId:sales.id}}),0);
  report.crashPoint='Process terminated after inserting PJP inside transaction, before commit; replacement workers use durable scheduled queue';
 }
 const workers=production?[]:Array.from({length:3},()=>new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['tests/pjp-worker-race-child.mjs'],{env:{...process.env,UAT_PLAN_IDS:JSON.stringify(plans)},windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);child.on('error',reject);child.on('exit',code=>code===0?resolve(JSON.parse(output.trim().split('\n').at(-1))):reject(Error(output)));
 }));
 while(Date.now()-started<180000){
  const rows=await db.pjpPlan.findMany({where:{id:{in:plans}}});
  if(rows.every(p=>p.status==='PUBLISHED'))break;
  const failed=rows.filter(p=>p.status==='DRAFT');assert.equal(failed.length,0,JSON.stringify(failed.map(p=>p.publicationSchedule)));
  console.log(JSON.stringify({published:rows.filter(p=>p.status==='PUBLISHED').length,total:plans.length}));
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 for(const id of plans){const p=await db.pjpPlan.findUnique({where:{id}});check('worker published '+id,p.status,'PUBLISHED');check('one agenda per plan '+id,await db.pjp.count({where:{userId:sales.id,reportingContext:{path:['planning','planId'],equals:id}}}),1);}
 check('no duplicate agendas',await db.pjp.count({where:{userId:sales.id}}),plans.length);
 if(workers.length){report.concurrentWorkers=await Promise.all(workers);check('three worker processes completed',report.concurrentWorkers.length,3);}
 report.workerWaitMs=Date.now()-started;report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.message;report.networkCause=error.cause?.code;process.exitCode=1;}
finally{
 try{
  await db.pjpPlan.deleteMany({where:{id:{in:plans}}});await db.pjp.deleteMany({where:{userId:{in:users}}});
  await db.notification.deleteMany({where:{OR:[{userId:{in:users}},{message:{contains:tag}}]}});
  if(outlet)await db.outlet.delete({where:{id:outlet.id}});
  await db.user.updateMany({where:{id:{in:users}},data:{supervisorId:null,clusterId:null}});
  if(cluster)await db.cluster.delete({where:{id:cluster.id}});
  await db.user.deleteMany({where:{id:{in:users}}});report.cleanup='PASS';
 }catch(error){report.cleanup='FAIL';report.cleanupError=error.message;process.exitCode=1;}
 await db.$disconnect();const file='../docs/SYSTEM_'+(production?'PRODUCTION':crashRecovery?'LOCAL_CRASH':'LOCAL_RACE')+'_WORKER_20261011.json';if(fs.existsSync(file)){const previous=JSON.parse(fs.readFileSync(file));report.previousAttempts=[...(previous.previousAttempts||[]),{at:previous.at,status:previous.status,error:previous.error,cleanup:previous.cleanup}];}fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,cleanup:report.cleanup,error:report.error,networkCause:report.networkCause}));
}
