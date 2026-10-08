// Local fixtures only: no changes to global targets or operational settings.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/config/prisma.js';
import { saveSalesTarget, getSalesTarget, loadSalesTargets } from '../src/modules/reports/services/sales-target.service.js';
import { targetKey, targetResult } from '../../shared/sales-targets.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local database only');
const users=[],keys=[];let checks=0;
const check=(value,expected)=>{assert.deepEqual(value,expected);checks++;};
const rejects=async(work,status)=>{await assert.rejects(work,e=>e.statusCode===status);checks++;};
const user=async role=>{const row=await prisma.user.create({data:{role,name:`target-test-${randomUUID()}`,email:`${randomUUID()}@example.invalid`,password:'fixture'}});users.push(row.id);return row;};
try{
  const admin=await user('ADMIN'),sales=await user('SALES'),spv=await user('SUPERVISOR');
  const input={kind:'MONTH',period:'2026-09',userId:sales.id,amount:1000,supervisorId:spv.id,revision:0,reason:'Target fixture integration'};
  keys.push(targetKey(input.kind,input.period,input.userId),targetKey('MONTH','2026-10',sales.id));
  await rejects(()=>saveSalesTarget(input,spv),403);
  const first=await saveSalesTarget(input,admin);check(first.revision,1);check(first.amount,1000);
  const competing=await Promise.allSettled([
    saveSalesTarget({...input,revision:1,amount:2000,reason:'Revision attempt one'},admin),
    saveSalesTarget({...input,revision:1,amount:3000,reason:'Revision attempt two'},admin),
  ]);
  check(competing.filter(r=>r.status==='fulfilled').length,1);
  check(competing.find(r=>r.status==='rejected').reason.statusCode,409);
  const loaded=await getSalesTarget(input,admin);check(loaded.target.revision,2);check(loaded.history.length,2);
  const changed=loaded.history.find(event=>event.action==='REVISE_TARGET');check(changed.before.amount,1000);check(changed.after.amount,loaded.target.amount);check(changed.actorId,admin.id);
  const september=await loadSalesTargets([sales.id],'MONTH','2026-09');check(september.get(sales.id).amount,loaded.target.amount);
  const october=await saveSalesTarget({...input,period:'2026-10',amount:0},admin);check(october.revision,1);check(targetResult(october,10000).status,'EXEMPT');
  check(targetResult(loaded.target,500,{supervisorId:'different-spv'}).amount,null);
  check((await loadSalesTargets([sales.id],'MONTH','2026-08')).size,0);
  check((await getSalesTarget(input,admin)).target.amount,loaded.target.amount);
  await prisma.user.update({where:{id:spv.id},data:{deletedAt:new Date()}});
  const historical=await saveSalesTarget({...input,revision:2,amount:4000,reason:'Correction preserving historical SPV'},admin);check(historical.supervisorId,spv.id);
  check((await getSalesTarget(input,admin)).history.length,3);
  await rejects(()=>saveSalesTarget({...input,period:'2026-11',supervisorId:spv.id},admin),400);
  check(await prisma.systemConfig.count({where:{key:targetKey('MONTH','2026-11',sales.id)}}),0);
  console.log(`Sales target integration passed: ${checks} checks (concurrency, audit, period isolation, scope, zero target and historical owner).`);
}finally{
  await prisma.auditEvent.deleteMany({where:{entityType:'SALES_TARGET',entityId:{in:keys}}});
  await prisma.systemConfig.deleteMany({where:{key:{in:keys}}});
  await prisma.user.deleteMany({where:{id:{in:users}}});
  await prisma.$disconnect();
}
