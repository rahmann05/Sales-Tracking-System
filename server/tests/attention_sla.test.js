import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyAttentionSla,attentionDeadline,escalationReady} from '../../shared/attention-sla.mjs';
import {attentionState,paginateAttention} from '../../shared/attention-queue.mjs';
import {exceptionAttentionRows} from '../src/modules/attention/attention-exceptions.service.js';
import {escalateAttentionRows,runAttentionEscalation} from '../src/modules/attention/attention-escalation.service.js';
import {prisma} from '../src/config/prisma.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
const start='2026-10-08T03:00:00Z';
const row={key:'order:fixture',category:'ORDER',stage:'ORDER_APPROVAL',since:start,title:'Order fixture',nextAction:'Periksa order'};
function replace(t,model,method,fn){const previous=model[method];model[method]=fn;t.after(()=>{model[method]=previous;invalidateConfigCache();});}
test('SLA is disabled by default, never invents an owner, and honors explicit deadlines',()=>{
  assert.equal(applyAttentionSla(row).dueAt,undefined);
  for(const hours of [0,-1,1.5,'invalid'])assert.equal(applyAttentionSla(row,{SLA_ORDER_APPROVAL_HOURS:hours}).dueAt,undefined);
  const result=applyAttentionSla(row,{SLA_ORDER_APPROVAL_HOURS:2});assert.equal(result.dueAt,'2026-10-08T05:00:00.000Z');assert.equal(result.ownerId,undefined);
  const explicit=applyAttentionSla({...row,dueAt:'2026-10-10T03:00:00Z'},{SLA_ORDER_APPROVAL_HOURS:1});assert.equal(explicit.dueAt,'2026-10-10T03:00:00Z');assert.equal(explicit.deadlineSource,'EXPLICIT');
});
test('review deadlines begin with the latest submission, not the earlier sales deadline',()=>{
  const review=applyAttentionSla({...row,stage:'FOLLOW_UP_REVIEW',status:'SUBMITTED',since:start,dueDate:'2026-10-01'},{SLA_FOLLOW_UP_REVIEW_HOURS:4});
  assert.equal(review.reviewDueAt,'2026-10-08T07:00:00.000Z');
  assert.equal(attentionState(review,Date.parse('2026-10-08T06:00:00Z')).overdue,false);
  assert.equal(attentionState(review,Date.parse('2026-10-08T08:00:00Z')).overdue,true);
  assert.equal(attentionState({...review,reviewDueAt:undefined},Date.parse('2026-10-08T08:00:00Z')).missingDeadline,true);
});
test('escalation respects grace period and the end of the WIB business day',()=>{
  const due={...row,dueDate:'2026-10-08'};
  assert.equal(attentionDeadline(due),Date.parse('2026-10-08T16:59:59.999Z'));
  assert.equal(escalationReady(due,1,Date.parse('2026-10-08T17:30:00Z')),false);
  assert.equal(escalationReady(due,1,Date.parse('2026-10-08T18:00:00Z')),true);
  assert.equal(escalationReady(due,0,Date.parse('2026-10-10T18:00:00Z')),false);
  assert.equal(escalationReady(row,1),false);
});
test('pending exceptions and submitted results share review filtering before pagination',()=>{
  const result=paginateAttention([{...row,key:'other'}, {...row,key:'exception',category:'EXCEPTION',needsReview:true},{...row,key:'result',status:'SUBMITTED'}],{filter:'REVIEW',limit:1});
  assert.equal(result.summary.awaitingReview,2);assert.equal(result.total,2);assert.equal(result.rows.length,1);
});
test('exception queries scope every source to the current SPV team and avoid double review of off-PJP',async t=>{
  replace(t,prisma.operationalException,'findMany',async()=>[]);
  const queries=[];for(const model of ['offPjpAttendance','attendance','outletUnlockRequest','routeChangeRequest'])replace(t,prisma[model],'findMany',async query=>{queries.push({model,query});return [];});
  assert.deepEqual(await exceptionAttentionRows({id:'spv',role:'SUPERVISOR'}),[]);assert.equal(queries.length,5);
  for(const {model,query} of queries){const relation=model==='outletUnlockRequest'?'requestedByUser':model==='routeChangeRequest'?'reportedByUser':'user';assert.equal(query.where[relation].supervisorId,'spv');assert.equal(query.where[relation].deletedAt,null);}
  const manualOff=queries.find(value=>value.model==='offPjpAttendance'&&value.query.where.manualSalesStatus);assert.equal(manualOff.query.where.status,'APPROVED');
  const manual=queries.find(value=>value.model==='attendance');assert.deepEqual(manual.query.where.pjpStop.orders.none,{deletedAt:null});
  queries.length=0;assert.deepEqual(await exceptionAttentionRows({role:'KEPALA_GUDANG'}),[]);assert.equal(queries.length,0);
});
test('reroute waiting for Admin is visible but not actionable by SPV, with a fresh stage anchor',async t=>{
  replace(t,prisma.operationalException,'findMany',async()=>[]);
  const person={id:'sales',name:'Sales',supervisor:{id:'spv',name:'SPV',role:'SUPERVISOR',deletedAt:null}};
  for(const model of ['offPjpAttendance','attendance','outletUnlockRequest'])replace(t,prisma[model],'findMany',async()=>[]);
  replace(t,prisma.routeChangeRequest,'findMany',async()=>[{id:'request',type:'REROUTE',handledBy:'spv',replacementOutletId:'replacement',reportedByUser:person,pjpStop:{outlet:{name:'Toko'}},createdAt:'2026-10-07T03:00:00Z',updatedAt:start}]);
  const [spv]=await exceptionAttentionRows({id:'spv',role:'SUPERVISOR'});assert.equal(spv.canDecide,false);assert.equal(spv.responsibleRole,'ADMIN');assert.equal(spv.since,start);assert.equal(spv.ownerId,undefined);
  const [admin]=await exceptionAttentionRows({id:'admin',role:'ADMIN'});assert.equal(admin.canDecide,true);
});
test('escalation audit and notification share a transaction and repeated scans do not resend',async t=>{
  replace(t,prisma.systemConfig,'findMany',async()=>[]);
  const events=[],notifications=[];
  replace(t,prisma,'$transaction',async work=>work({$executeRaw:async()=>{},auditEvent:{findFirst:async({where})=>events.find(event=>event.entityId===where.entityId),create:async({data})=>events.push(data)},notification:{createMany:async({data})=>notifications.push(...data)}}));
  const rows=[{...row,dueAt:start}],admins=[{id:'admin'}],options={delayHours:1,now:Date.parse('2026-10-08T06:00:00Z')};
  assert.equal((await escalateAttentionRows(rows,admins,options)).notified,1);assert.equal((await escalateAttentionRows(rows,admins,options)).notified,0);
  assert.equal(events.length,1);assert.equal(notifications.length,1);assert.equal(notifications[0].userId,'admin');assert.equal(notifications[0].type,'SLA_ESCALATION');assert.match(notifications[0].message,/status terbaru/);
  assert.equal((await escalateAttentionRows([{...rows[0],stage:'TRIP_CLOSE'}],admins,options)).notified,1);
});
test('disabled escalation avoids scanning the operational history',async t=>{
  invalidateConfigCache();replace(t,prisma.systemConfig,'findMany',async()=>[]);
  replace(t,prisma.user,'findMany',async()=>{throw new Error('Must not scan');});
  assert.deepEqual(await runAttentionEscalation(),{notified:0,disabled:true});
});
