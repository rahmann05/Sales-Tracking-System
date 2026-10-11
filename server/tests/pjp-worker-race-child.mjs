import 'dotenv/config';
import assert from 'node:assert/strict';
import {prisma} from '../src/config/prisma.js';
import {runScheduledPublications} from '../src/modules/pjp/services/publication-schedule.service.js';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname));
const planIds=JSON.parse(process.env.UAT_PLAN_IDS);assert.equal(planIds.length,20);
if(process.env.UAT_CRASH_HOLD==='1'){
 const transaction=prisma.$transaction.bind(prisma);
 prisma.$transaction=(work,options)=>transaction(async tx=>{
  const wrapped=new Proxy(tx,{get(target,key){
   if(key==='pjp')return new Proxy(target.pjp,{get(model,action){
    if(action==='create')return async args=>{const row=await model.create(args);console.log('UNCOMMITTED_PJP_INSERTED');await new Promise(()=>{});return row;};
    const value=model[action];return typeof value==='function'?value.bind(model):value;
   }});
   const value=target[key];return typeof value==='function'?value.bind(target):value;
  }});
  return work(wrapped);
 },options);
}
const result={pid:process.pid,published:0,failed:0,deferred:0,skipped:0};
try{
 for(let n=0;n<8;n++){
  const batch=await runScheduledPublications({planIds});for(const key of ['published','failed','deferred','skipped'])result[key]+=batch[key];
  await new Promise(resolve=>setTimeout(resolve,3000));
 }
 assert.equal(result.failed,0);console.log(JSON.stringify(result));
}finally{await prisma.$disconnect();}
