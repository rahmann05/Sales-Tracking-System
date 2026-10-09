import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {saveOrderReviewAssignment,assertOrderReviewDecision,loadOrderReviewAssignments,orderReviewConflict,salesOrderHistory} from '../src/modules/orders/services/order-review-assignment.service.js';
import {paginateAttention} from '../../shared/attention-queue.mjs';
const admin={id:randomUUID(),role:'ADMIN',name:'Admin'},spv={id:randomUUID(),role:'SUPERVISOR',name:'SPV'},sales={id:randomUUID(),role:'SALES',supervisorId:spv.id};
const order={id:randomUUID(),createdBy:sales.id,status:'PENDING_APPROVAL',history:[],createdByUser:sales};
const input={ownerId:spv.id,dueAt:'2026-10-09T03:00:00Z',revision:0,reason:'Periksa rincian order pelanggan'};
function replace(t,model,method,fn){const original=model[method];model[method]=fn;t.after(()=>{model[method]=original;});}
test('assign, transfer and release preserve revisions, before/after audit and order history',async t=>{
  let saved=null;const events=[],notifications=[];
  const tx={$executeRaw:async()=>{},order:{findUnique:async()=>order,update:async({data})=>{order.history=data.history;}},user:{findUnique:async({where})=>[sales,spv,admin].find(person=>person.id===where.id)},systemConfig:{findUnique:async()=>saved,upsert:async({update})=>{saved={value:update.value};}},auditEvent:{create:async({data})=>events.push(data)},notification:{create:async({data})=>notifications.push(data)}};
  replace(t,prisma,'$transaction',async work=>work(tx));
  const first=await saveOrderReviewAssignment(order.id,input,admin);assert.equal(first.revision,1);assert.equal(first.ownerName,'SPV');
  await assert.rejects(()=>saveOrderReviewAssignment(order.id,input,admin),error=>error.statusCode===409);
  const transferred=await saveOrderReviewAssignment(order.id,{...input,revision:1,ownerId:admin.id},admin);assert.equal(transferred.revision,2);assert.equal(events[1].before.ownerId,spv.id);
  const released=await saveOrderReviewAssignment(order.id,{...input,revision:2,ownerId:null,dueAt:null},admin);assert.equal(released.revision,3);assert.equal(released.ownerId,null);assert.equal(events[2].action,'RELEASE_REVIEWER');assert.equal(notifications.length,2);assert.equal(order.history.at(-1).assignmentRevision,3);
});
test('invalid assignments and unauthorized assignment changes do not enter a transaction',async()=>{
  for(const actor of [spv,sales,{...admin,permissions:{can_approve_order:false}}])await assert.rejects(()=>saveOrderReviewAssignment(order.id,input,actor),error=>error.statusCode===403);
  for(const patch of [{ownerId:null},{dueAt:null},{reason:'x'},{revision:-1},{dueAt:'invalid'},{extra:'field'}])await assert.rejects(()=>saveOrderReviewAssignment(order.id,{...input,...patch},admin),error=>error.statusCode===400);
});
test('decisions require the latest assignment and only Admin can override another reviewer with a reason',async()=>{
  const tx={systemConfig:{findUnique:async()=>({value:{ownerId:admin.id,revision:2}})},user:{findFirst:async()=>sales}};
  await assert.rejects(()=>assertOrderReviewDecision(tx,order,spv,{assignmentRevision:2}),error=>error.statusCode===403);
  await assert.rejects(()=>assertOrderReviewDecision(tx,order,admin,{assignmentRevision:1}),error=>error.statusCode===409);
  const other={...admin,id:randomUUID()};
  await assert.rejects(()=>assertOrderReviewDecision(tx,order,other,{assignmentRevision:2}),error=>error.statusCode===400);
  const result=await assertOrderReviewDecision(tx,order,other,{assignmentRevision:2,overrideReason:'Admin menggantikan pemeriksa berhalangan'});assert.equal(result.assignedOwnerId,admin.id);assert.match(result.overrideReason,/berhalangan/);
  await assert.rejects(()=>assertOrderReviewDecision(tx,order,{...admin,permissions:{can_approve_order:false}},{assignmentRevision:2}),error=>error.statusCode===403);
});
test('unassigned orders keep ordinary scoped approval and a release still rejects stale revisions',async()=>{
  const tx={systemConfig:{findUnique:async()=>null},user:{findFirst:async()=>sales}};
  assert.equal((await assertOrderReviewDecision(tx,order,spv)).assignmentRevision,0);
  tx.systemConfig.findUnique=async()=>({value:{ownerId:null,revision:3}});
  await assert.rejects(()=>assertOrderReviewDecision(tx,order,spv),error=>error.statusCode===409);
  assert.equal((await assertOrderReviewDecision(tx,order,spv,{assignmentRevision:3})).overrideReason,null);
});
test('batch assignment lookup flags inactive or transferred SPV without expanding access',async t=>{
  replace(t,prisma.systemConfig,'findMany',async()=>[{key:`_ORDER_REVIEW:${order.id}`,value:{orderId:order.id,ownerId:spv.id,revision:1}}]);
  replace(t,prisma.user,'findMany',async()=>[spv]);
  assert.equal((await loadOrderReviewAssignments([order])).get(order.id).ownerValid,true);
  assert.equal((await loadOrderReviewAssignments([{...order,createdByUser:{...sales,supervisorId:randomUUID()}}])).get(order.id).ownerValid,false);
  spv.deletedAt=new Date();assert.equal((await loadOrderReviewAssignments([order])).get(order.id).ownerValid,false);delete spv.deletedAt;
});
test('serialization conflicts become actionable reload errors',()=>{
  assert.throws(()=>orderReviewConflict({code:'P2034'}),error=>error.statusCode===409);
  const error=new Error('unrelated failure');assert.throws(()=>orderReviewConflict(error),value=>value===error);
});
test('my-stage filter uses the signed-in actor and filters before pagination',()=>{
  const rows=Array.from({length:40},(_,index)=>({key:`other:${index}`,category:'ORDER',ownerId:'other',since:'2026-10-08'}));
  rows.push({key:'mine',category:'ORDER',ownerId:'me',since:'2026-10-08'});
  const mine=paginateAttention(rows,{filter:'MINE',actorId:'me',limit:1});assert.equal(mine.total,1);assert.equal(mine.rows[0].key,'mine');assert.equal(mine.summary.total,41);
  assert.equal(paginateAttention(rows,{filter:'MINE'}).total,0);
});
test('sales retain operational decision history without internal assignment or takeover details',()=>{
  const history=[{action:'ASSIGN_REVIEWER',after:{reason:'Internal assignment'}},{action:'RELEASE_REVIEWER'},{action:'REJECT',note:'Rincian order belum lengkap',actorId:'admin',assignmentRevision:3,assignedOwnerId:'reviewer',overrideReason:'Internal takeover'}];
  assert.deepEqual(salesOrderHistory(history),[{action:'REJECT',note:'Rincian order belum lengkap',actorId:'admin'}]);assert.equal(history[2].assignmentRevision,3);
});
import {useDefaultPolicy} from './helpers/config-fixture.js';
useDefaultPolicy();
