import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/config/prisma.js';
import { createReportArchive, getReportArchive, listReportArchives, archiveHash } from '../src/modules/reports/services/report-archive.service.js';
import { invalidateConfigCache } from '../src/modules/config/services/dynamic-config.service.js';
import { mtdCsv } from '../../shared/report-semantics.mjs';
import { getAllConfigs } from '../src/modules/config/services/get-all-configs.service.js';
import { getDynamicConfig } from '../src/modules/config/services/dynamic-config.service.js';
const admin={id:randomUUID(),name:'Admin arsip',role:'ADMIN'};
const input=()=>({kind:'MONTH',period:'2026-10',requestId:randomUUID(),reason:'Laporan ditinjau untuk rapat bulanan'});
function replace(t,model,method,fn){const previous=model[method];model[method]=fn;t.after(()=>{model[method]=previous;invalidateConfigCache();});}
function fixtures(t){
  const saved=new Map(),events=[];let calendar=null;
  replace(t,prisma.systemConfig,'findUnique',async({where})=>saved.get(where.key)||null);
  replace(t,prisma.systemConfig,'findMany',async query=>query?.where?.key?.in&&calendar?[{key:'_REPORT_CALENDAR:2026-10',value:calendar}]:[]);
  for(const model of [prisma.user,prisma.pjp,prisma.offPjpAttendance])replace(t,model,'findMany',async()=>[]);
  replace(t,prisma.auditEvent,'findMany',async()=>events.map(row=>({id:randomUUID(),after:row.after})).reverse());
  replace(t,prisma,'$transaction',async work=>work({$executeRaw:async()=>{},systemConfig:{findUnique:async({where})=>saved.get(where.key)||null,create:async({data})=>{assert.equal(saved.has(data.key),false);saved.set(data.key,data);}},auditEvent:{create:async({data})=>events.push(data)}}));
  invalidateConfigCache();return {saved,events,setCalendar:value=>{calendar=value;}};
}
test('archives retain exact report content after calendar changes, with append-only audit and exports',async t=>{
  const f=fixtures(t),data=input();const first=await createReportArchive(data,admin);
  assert.equal(first.report.period.calendarKnown,false);assert.equal(first.scope,'COMPANY');
  f.setCalendar({month:'2026-10',weekdays:[1,2,3,4,5],exceptions:[],revision:1});
  const second=await createReportArchive({...data,requestId:randomUUID(),reason:'Arsip revisi setelah penetapan kalender'},admin);
  assert.equal(second.report.period.totalWorkingDays,22);
  assert.equal((await getReportArchive(first.id,admin)).report.period.calendarKnown,false);
  assert.equal(f.saved.size,2);assert.equal(f.events.length,2);assert.equal(f.events[0].after.report,undefined);
  assert.match(first.report.basis.archiveNote,/Arsip perusahaan/);
  // A populated row makes the basis travel in a CSV export.
  assert.match(mtdCsv({...first.report,salesmen:[{salesmanName:'Fixture'}]}),new RegExp(first.id));
  assert.equal((await listReportArchives({kind:'MONTH',period:'2026-10'},admin)).items.length,2);
});
test('archive request retries return the same content and cannot replace its actor, period or reason',async t=>{
  const f=fixtures(t),data=input();const first=await createReportArchive(data,admin),retry=await createReportArchive(data,admin);
  assert.deepEqual(retry,first);assert.equal(f.events.length,1);
  for(const [payload,actor] of [[{...data,reason:'Different archive reason'},admin],[{...data,period:'2026-11'},admin],[data,{...admin,id:randomUUID()}]])await assert.rejects(()=>createReportArchive(payload,actor),e=>e.statusCode===409);
  assert.equal(f.saved.size,1);
});
test('JSONB key reordering preserves archive integrity, altered content is rejected',async t=>{
  fixtures(t);const archive=await createReportArchive(input(),admin);
  assert.equal(archiveHash({b:1,a:[{d:4,c:3}]}),archiveHash({a:[{c:3,d:4}],b:1}));
  archive.report.summary.mtdActualAmount=123;
  await assert.rejects(()=>getReportArchive(archive.id,admin),e=>e.statusCode===409);
});
test('archive endpoints reject unauthorized roles, unknown filters and invalid periods',async()=>{
  for(const actor of [{role:'SALES'},{role:'SUPERVISOR'},{...admin,permissions:{can_view_reports:false}}]){
    await assert.rejects(()=>createReportArchive(input(),actor),e=>e.statusCode===403);
    await assert.rejects(()=>getReportArchive(randomUUID(),actor),e=>e.statusCode===403);
    await assert.rejects(()=>listReportArchives({kind:'MONTH',period:'2026-10'},actor),e=>e.statusCode===403);
  }
  for(const patch of [{period:'2026-13'},{kind:'WEEK',period:'2026-10-06'},{requestId:'invalid'},{reason:'x'},{userId:randomUUID()},{report:{summary:{}}}])await assert.rejects(()=>createReportArchive({...input(),...patch},admin),e=>e.statusCode===400);
  await assert.rejects(()=>getReportArchive('invalid',admin),e=>e.statusCode===400);
});
test('archive history uses stable cursor pagination without loading stored report bodies',async t=>{
  const ids=Array.from({length:31},()=>randomUUID());let query;
  replace(t,prisma.auditEvent,'findMany',async value=>{query=value;return ids.map((id,index)=>({id,after:{id,index}}));});
  const result=await listReportArchives({kind:'MONTH',period:'2026-10',cursor:randomUUID()},admin);
  assert.equal(result.items.length,30);assert.equal(result.nextCursor,ids[29]);assert.equal(query.skip,1);assert.equal(query.take,31);assert.deepEqual(query.select,{id:true,after:true});
});
test('configuration reads filter private archive payloads in SQL rather than loading report history',async t=>{
  let calls=0;invalidateConfigCache();
  replace(t,prisma.systemConfig,'findMany',async query=>{if(query.where.key.startsWith){assert.equal(query.where.key.startsWith,'_POLICY_PROFILE:');return [];}calls++;assert.ok(query.where.key.in.includes('PJP_WORKING_DAYS'));assert.ok(query.where.key.in.every(key=>!key.startsWith('_')));return [{key:'PJP_WORKING_DAYS',value:'1,2,3,4,5'}];});
  assert.equal(await getDynamicConfig('PJP_WORKING_DAYS',''), '1,2,3,4,5');
  const configs=await getAllConfigs();assert.equal(configs.PJP_WORKING_DAYS,'1,2,3,4,5');assert.equal(calls,2);
});
