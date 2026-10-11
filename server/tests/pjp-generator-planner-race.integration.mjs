// Reproduce contention using real services/DB transactions; barriers only control timing.
import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {AsyncLocalStorage} from 'node:async_hooks';
import {prisma} from '../src/config/prisma.js';
import {savePlan} from '../src/modules/pjp/services/planning.service.js';
import {publishPlan} from '../src/modules/pjp/services/publish-plan.service.js';
import {ensureSalesPjpForDate} from '../src/modules/pjp/services/pjp.helpers.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {wibDateKey} from '../../shared/visit-metrics.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const tag='UAT-PJP-LOCK-'+randomUUID(),users=[],context=new AsyncLocalStorage();
const originalConfig=prisma.systemConfig.findMany,transaction=prisma.$transaction.bind(prisma);
prisma.systemConfig.findMany=async()=>Object.entries({PJP_WORKING_DAYS:'0,1,2,3,4,5,6',PJP_CALENDAR_SOURCE:'WEEKDAYS',PJP_FALLBACK_TO_CLUSTER:true,CODE_PJP_MODE:'MANUAL'}).map(([key,value])=>({key,value}));invalidateConfigCache();
let cluster,outlet,plan,firstKey,checks=0;
const report={at:new Date().toISOString(),environment:'LOCAL',tag,scope:'Daily PJP generator and planner publication for same sales/date; real transactions, controlled lock timing'};
const gate=()=>{let release;const promise=new Promise(resolve=>release=resolve);return {promise,release};};
const generatorLocked=gate(),publisherReady=gate();
try{
 const person=async role=>{const row=await prisma.user.create({data:{name:tag,email:randomUUID()+'@example.invalid',password:'unused',role}});users.push(row.id);return row;};
 const spv=await person('SUPERVISOR'),sales=await person('SALES');
 cluster=await prisma.cluster.create({data:{name:tag,region:'UAT',supervisorId:spv.id,assignedSalesId:sales.id}});
 await prisma.user.update({where:{id:sales.id},data:{supervisorId:spv.id,clusterId:cluster.id}});
 outlet=await prisma.outlet.create({data:{name:tag,address:'Jalan Uji No 1 Bandung',clusterId:cluster.id,latitude:-6.9,longitude:107.6}});
 const day=wibDateKey();
 plan=await savePlan(null,{requestId:randomUUID(),name:tag,supervisorId:spv.id,startsOn:day,endsOn:day,rules:[{userId:sales.id,outletId:outlet.id,anchorDate:day,intervalWeeks:1}]},spv);
 prisma.$transaction=(work,options)=>transaction(async tx=>work(new Proxy(tx,{get(target,key){
  if(key==='$executeRaw')return async(...args)=>{
   const lock=args[1],mode=context.getStore();
   if(mode==='publisher'&&lock===`team:${sales.id}`&&firstKey.startsWith('team:'))publisherReady.release();
   const value=await target.$executeRaw(...args);
   if(mode==='generator'&&!firstKey){firstKey=lock;generatorLocked.release();await publisherReady.promise;}
   if(mode==='publisher'&&lock===`team:${sales.id}`&&!firstKey.startsWith('team:'))publisherReady.release();
   return value;
  };
  const value=target[key];return typeof value==='function'?value.bind(target):value;
 }})),{...options,timeout:15000});
 const generating=context.run('generator',()=>prisma.$transaction(tx=>ensureSalesPjpForDate(tx,sales.id,new Date(),tag+'-DAILY')));
 await generatorLocked.promise;
 const publishing=context.run('publisher',()=>publishPlan(plan.id,{revision:plan.revision,note:'Uji benturan generator dan planner',acknowledgeWarnings:true,codes:{[sales.id+':'+day]:tag+'-PLAN'}},spv));
 const outcomes=await Promise.allSettled([generating,publishing]);
 report.firstGeneratorLock=firstKey;report.outcomes=outcomes.map(r=>({status:r.status,...(r.status==='rejected'?{code:r.reason.code,dbCode:r.reason.meta?.code,statusCode:r.reason.statusCode,message:r.reason.message}:{})}));
 assert.ok(outcomes.every(r=>r.status==='fulfilled'||r.reason.statusCode===409),'Only successful generation or a business conflict is allowed; no DB deadlock');checks++;
 assert.equal(await prisma.pjp.count({where:{userId:sales.id}}),1);checks++;
 assert.equal(await prisma.pjpStop.count({where:{pjp:{userId:sales.id},outletId:outlet.id}}),1);checks++;
 report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.message;process.exitCode=1;}
finally{
 prisma.$transaction=transaction;
 if(plan)await prisma.pjpPlan.deleteMany({where:{id:plan.id}});
 await prisma.pjp.deleteMany({where:{userId:{in:users}}});
 if(outlet)await prisma.outlet.delete({where:{id:outlet.id}});
 await prisma.user.updateMany({where:{id:{in:users}},data:{clusterId:null,supervisorId:null}});
 if(cluster)await prisma.cluster.delete({where:{id:cluster.id}});
 await prisma.user.deleteMany({where:{id:{in:users}}});
 prisma.systemConfig.findMany=originalConfig;invalidateConfigCache();await prisma.$disconnect();report.cleanup='PASS';report.checks=checks;
 const file='../docs/SYSTEM_PJP_GENERATOR_PLANNER_RACE_20261011.json';if(fs.existsSync(file)){const prior=JSON.parse(fs.readFileSync(file));report.previousAttempts=[...(prior.previousAttempts||[]),{at:prior.at,status:prior.status,error:prior.error,outcomes:prior.outcomes}];}fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
