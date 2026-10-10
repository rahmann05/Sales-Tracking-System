import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
import {withPolicy} from '../src/modules/config/services/policy-context.service.js';
import {recordSupervisorVisit} from '../src/modules/staff-attendance/supervisor-visit.service.js';
import {archiveHash,createReportArchive} from '../src/modules/reports/services/report-archive.service.js';
import staffRoutes from '../src/modules/staff-attendance/staff-attendance.routes.js';
import {wibDateKey} from '../../shared/visit-metrics.mjs';

test('SPV completes own previous-day work without new territory access or current start rules',async t=>{
 const original=prisma.$transaction;t.after(()=>{prisma.$transaction=original;});
 const actor={id:'spv',role:'SUPERVISOR',permissions:{can_record_supervisor_visit:false}};
 for(const mode of ['IN_OUT','IN_ONLY','OPTIONAL']){
  let record={id:'active',userId:'spv',kind:'VISIT',dateKey:'2026-10-01',activityKey:'stop',checkOutAt:null,checklist:{},policySnapshot:{values:{...CONFIG_DEFAULTS,SPV_ATTENDANCE_MODE:mode,SPV_AUDIT_ITEMS:[]}}};
  const db={$executeRaw:async()=>{},staffActivity:{
   findFirst:async query=>{assert.deepEqual(query.where,{userId:'spv',kind:'VISIT',activityKey:'stop',checkOutAt:null});return record.checklist.state==='FINISHED'?null:record;},
   findUnique:async query=>{assert.deepEqual(query.where,{id:'active'});return record;},
   updateMany:async query=>{record={...record,...query.data};return {count:1};},
  },pjpStop:{findUnique:async()=>{throw new Error('Completion must not load current territory or PJP');}}};
  prisma.$transaction=async fn=>fn(db);
  const live={values:{...CONFIG_DEFAULTS,FEATURE_SPV_VISITS_MODE:'OFF',SPV_ALLOW_JOINT_VISIT:false,SPV_ATTENDANCE_MODE:'IN_OUT',SPV_AUDIT_ITEMS:[{key:'new',label:'New required question',required:true}]}};
  const run=data=>withPolicy(live,()=>recordSupervisorVisit(actor,{stopId:'stop',visitMode:'JOINT_VISIT',...data}));
  await run({action:'AUDIT',checklist:{}});
  const finished=await run({action:'VISIT_OUT'});assert.equal(finished.checklist.state,'FINISHED');assert.equal(Boolean(finished.checkOutAt),mode==='IN_OUT');
  await assert.rejects(()=>run({action:'VISIT_OUT'}),e=>e.statusCode===409);
 }
});

test('report stop switches reject new archives but preserve exact committed retry without generating another report',async t=>{
 const original=prisma.systemConfig.findUnique;t.after(()=>{prisma.systemConfig.findUnique=original;});
 const actor={id:'admin',role:'ADMIN'},request={kind:'MONTH',period:'2026-10',requestId:randomUUID(),reason:'Recover committed archive'},report={summary:{total:0}};
 const saved={...request,id:request.requestId,createdBy:actor.id,report,digest:archiveHash(report)};
 for(const mode of ['ACTIVE','PAUSED','OFF'])for(const enabled of [true,false]){
  const policy={values:{...CONFIG_DEFAULTS,FEATURE_REPORTS_MODE:mode,REPORT_ARCHIVE_ENABLED:enabled}};
  prisma.systemConfig.findUnique=async()=>({value:saved});
  assert.equal((await withPolicy(policy,()=>createReportArchive(request,actor))).id,request.requestId);
  await assert.rejects(()=>withPolicy(policy,()=>createReportArchive({...request,reason:'Different payload'},actor)),e=>e.statusCode===409);
  if(mode!=='ACTIVE'||!enabled){
   prisma.systemConfig.findUnique=async()=>null;
   await assert.rejects(()=>withPolicy(policy,()=>createReportArchive({...request,requestId:randomUUID()},actor)),e=>e.statusCode===409);
  }
 }
});

test('own attendance API retains old active visits and hides old finished logical activities',async t=>{
 const original=prisma.staffActivity.findMany;t.after(()=>{prisma.staffActivity.findMany=original;});
 const previous=wibDateKey(Date.now()-86400000),today=wibDateKey(),rows=[
  {id:'open-old',kind:'VISIT',dateKey:previous,checkOutAt:null,checklist:{}},
  {id:'finished-old',kind:'VISIT',dateKey:previous,checkOutAt:null,checklist:{state:'FINISHED'}},
  {id:'out-old',kind:'VISIT',dateKey:previous,checkOutAt:new Date(),checklist:{}},
  {id:'today',kind:'VISIT',dateKey:today,checkOutAt:null,checklist:{state:'FINISHED'}},
 ];
 prisma.staffActivity.findMany=async query=>{
  assert.equal(query.where.userId,'spv');
  assert.ok(query.where.OR.some(branch=>branch.kind?.in?.includes('VISIT')&&branch.checkOutAt===null));
  return rows;
 };
 const handler=staffRoutes.stack.find(layer=>layer.route?.path==='/'&&layer.route.methods.get).route.stack.at(-1).handle;
 let response;await withPolicy({values:{...CONFIG_DEFAULTS}},()=>handler({user:{id:'spv'}},{json:value=>{response=value;}},error=>{throw error;}));
 assert.deepEqual(response.data.map(row=>row.id),['open-old','today']);
});
