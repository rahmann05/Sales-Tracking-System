import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targetPeriodError, targetResult, targetCoverage, targetKey, formatTarget } from '../../shared/sales-targets.mjs';
import { saveSalesTarget, loadSalesTargets, getSalesTarget } from '../src/modules/reports/services/sales-target.service.js';
import { prisma } from '../src/config/prisma.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { getMtdReport } from '../src/modules/reports/services/get-mtd-report.service.js';
import { getAllConfigs } from '../src/modules/config/services/get-all-configs.service.js';
const salesId='123e4567-e89b-42d3-a456-426614174000', spvId='123e4567-e89b-42d3-a456-426614174001';
const admin={id:'admin',name:'Admin',role:'ADMIN'};
const input={kind:'MONTH',period:'2026-10',userId:salesId,amount:1000,supervisorId:spvId,revision:0,reason:'Target disepakati untuk Oktober'};
function replace(t,model,method,fn){const original=model[method];model[method]=fn;t.after(()=>{model[method]=original;invalidateConfigCache();});}

test('target periods reject ambiguous weeks, impossible dates and invalid months',()=>{
  assert.equal(targetPeriodError('WEEK','2026-10-05'),null);
  for(const date of ['2026-10-06','2026-02-30','2026-1-05'])assert.ok(targetPeriodError('WEEK',date));
  assert.equal(targetPeriodError('MONTH','2026-10'),null);
  assert.ok(targetPeriodError('MONTH','2026-13'));
});
test('missing, exempt, other-team and comparison-only targets never become failed achievement',()=>{
  assert.equal(targetResult(null,100).achievement,'—');
  assert.equal(targetResult(null,100).amount,null);
  assert.equal(targetResult({...input,amount:0,revision:1},100).status,'EXEMPT');
  assert.equal(targetResult({...input,revision:1},100,{supervisorId:'other'}).status,'OTHER_SCOPE');
  assert.equal(targetResult({...input,revision:1},100,{eligible:false}).status,'COMPARISON_ONLY');
  assert.equal(targetResult({...input,revision:1},500,{supervisorId:spvId}).achievement,'50%');
  assert.equal(targetResult({...input,revision:1},500,{clusterId:'subset'}).status,'FILTERED_SCOPE');
  assert.equal(formatTarget(null),'Belum ditetapkan');
  assert.match(formatTarget(0),/Tanpa target/);
});
test('coverage excludes comparison-only sales and preserves missing versus zero',()=>{
  const result=targetCoverage([targetResult(null,0),targetResult({...input,amount:0},0),targetResult(input,0,{eligible:false})]);
  assert.deepEqual(result,{eligible:2,assigned:1,missing:1,exempt:1});
});
test('target changes are atomic, version checked and audited with reasons',async t=>{
  let saved=null;const events=[];let locks=0,writes=0;
  replace(t,prisma,'$transaction',async work=>work({$executeRaw:async()=>{locks++;},
    systemConfig:{findUnique:async()=>saved,upsert:async({update})=>{writes++;saved={key:targetKey(input.kind,input.period,input.userId),value:update.value};}},
    user:{findUnique:async()=>({id:salesId,name:'Sales',role:'SALES'}),findFirst:async()=>({id:spvId})},
    auditEvent:{create:async({data})=>events.push(data)},
  }));
  const first=await saveSalesTarget(input,admin);assert.equal(first.revision,1);assert.equal(first.amount,1000);
  await assert.rejects(()=>saveSalesTarget({...input,amount:2000},admin),e=>e.statusCode===409);
  assert.equal(writes,1);assert.equal(events.length,1);
  const revised=await saveSalesTarget({...input,revision:1,amount:2000,reason:'Koreksi target setelah review'},admin);
  assert.equal(revised.revision,2);assert.equal(locks,3);
  assert.equal(events[1].before.amount,1000);assert.equal(events[1].after.amount,2000);
  assert.equal(events[1].actorId,admin.id);assert.equal(events[1].after.reason,'Koreksi target setelah review');
});
test('non-admins, explicit denied admins and invalid target payloads cannot write',async()=>{
  for(const actor of [{role:'SUPERVISOR'},{role:'SALES'},{...admin,permissions:{can_view_reports:false}}]){
    await assert.rejects(()=>saveSalesTarget(input,actor),e=>e.statusCode===403);
    await assert.rejects(()=>getSalesTarget(input,actor),e=>e.statusCode===403);
  }
  for(const patch of [{amount:-1},{amount:0.5},{amount:1e13},{reason:'x'},{revision:-1},{extra:'bypass'},{period:'2026-13'}])
    await assert.rejects(()=>saveSalesTarget({...input,...patch},admin),e=>e.statusCode===400);
});
test('target loading selects exact period keys and ignores global target defaults',async t=>{
  const key=targetKey('MONTH','2026-10',salesId);
  replace(t,prisma.systemConfig,'findMany',async query=>{
    assert.deepEqual(query.where.key.in,[key]);
    return [{key,value:{...input,revision:2}},{key:'SALES_MONTHLY_TARGET_AMOUNT',value:999999}];
  });
  const rows=await loadSalesTargets([salesId],'MONTH','2026-10');
  assert.equal(rows.get(salesId).amount,1000);assert.equal(rows.size,1);
});
test('private target records are excluded from the general configuration response',async t=>{
  const key=targetKey('MONTH','2026-10',salesId);
  replace(t,prisma.systemConfig,'findMany',async()=>[{key,value:{...input,revision:1}},{key:'TAX_RATE_PERCENT',value:11}]);invalidateConfigCache();
  const configs=await getAllConfigs();
  assert.equal(configs[key],undefined);
  assert.equal(configs.TAX_RATE_PERCENT,11);
});
test('MTD target denominator excludes last-month-only participants and exempt revenue',async t=>{
  const exempt='123e4567-e89b-42d3-a456-426614174002', previous='previous-sales';
  const keys=[targetKey('MONTH','2026-10',salesId),targetKey('MONTH','2026-10',exempt)];
  replace(t,prisma.systemConfig,'findMany',async query=>query?.where?.key?.in?[
    {key:keys[0],value:{...input,revision:1}},
    {key:keys[1],value:{...input,userId:exempt,amount:0,revision:1}},
  ]:[{key:'SALES_MONTHLY_TARGET_AMOUNT',value:999999}]);invalidateConfigCache();
  replace(t,prisma.user,'findMany',async()=>[{id:salesId,name:'Sales'},{id:exempt,name:'Exempt'}]);
  replace(t,prisma.offPjpAttendance,'findMany',async()=>[]);
  const record=(userId,amount,date)=>({userId,user:{id:userId,name:userId},date:new Date(date),stops:[{status:'VISITED',outlet:{},orders:[{status:'APPROVED',totalValue:amount,items:[]}]}]});
  replace(t,prisma.pjp,'findMany',async query=>query.where.date.gte.getTime()===new Date('2026-09-30T17:00:00Z').getTime()
    ?[record(salesId,500,'2026-10-06'),record(exempt,10000,'2026-10-06')]:[record(previous,100,'2026-09-06')]);
  const report=await getMtdReport({month:10,year:2026});
  assert.equal(report.summary.mtdActualAmount,10500);
  assert.equal(report.summary.monthlyTargetAmount,1000);
  assert.equal(report.summary.overallAchievementRate,'50%');
  assert.deepEqual(report.summary.targetCoverage,{eligible:2,assigned:2,missing:0,exempt:1});
  assert.equal(report.salesmen.find(row=>row.salesmanId===previous).target.status,'COMPARISON_ONLY');
  const scoped=await getMtdReport({month:10,year:2026,supervisorId:'other-spv'});
  assert.equal(scoped.summary.monthlyTargetAmount,null);
  assert.equal(scoped.summary.overallAchievementRate,'—');
});
