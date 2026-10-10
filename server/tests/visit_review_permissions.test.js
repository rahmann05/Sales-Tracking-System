import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canReviewVisit,VISIT_REVIEW_PERMISSIONS} from '../../shared/visit-review-permissions.mjs';
import {visitReviewGaps} from '../../shared/approval-readiness.mjs';
import {assertVisitReviewersAvailable} from '../src/modules/absensi/services/visit-review-permissions.js';
test('visit decisions have independent grants without expanding role or allowing self review',()=>{
 for(const [action,{key}] of Object.entries(VISIT_REVIEW_PERMISSIONS)){
  for(const role of ['ADMIN','SUPERVISOR']){
   assert.equal(canReviewVisit({id:'reviewer',role},action,'sales'),true);
   assert.equal(canReviewVisit({id:'reviewer',role,permissions:{[key]:false}},action,'sales'),false);
   assert.equal(canReviewVisit({id:'reviewer',role,deletedAt:new Date()},action,'sales'),false);
   assert.equal(canReviewVisit({id:'sales',role},action,'sales'),false);
  }
  for(const role of ['SALES','KEPALA_GUDANG','SUPIR'])assert.equal(canReviewVisit({role,permissions:{[key]:true}},action),false);
 }
 assert.equal(canReviewVisit({role:'SUPERVISOR',permissions:{can_review_off_pjp:false}},'MANUAL_SALES'),true);
 assert.equal(canReviewVisit({role:'ADMIN',permissions:{can_review_manual_sales:false}},'OFF_PJP'),true);
 assert.equal(canReviewVisit(null,'OFF_PJP'),false);
});
test('pending visit decisions need an eligible Admin or the current team Supervisor',()=>{
 const sales={id:'sales',role:'SALES',supervisorId:'spv'},spv={id:'spv',role:'SUPERVISOR'},foreign={id:'other',role:'SUPERVISOR'},admin={id:'admin',role:'ADMIN'},record={userId:'sales'};
 for(const [action,{key}] of Object.entries(VISIT_REVIEW_PERMISSIONS)){
  assert.deepEqual(visitReviewGaps(record,action,[sales,spv]),[]);
  assert.deepEqual(visitReviewGaps(record,action,[sales,foreign]),[action]);
  assert.deepEqual(visitReviewGaps(record,action,[sales,{...spv,permissions:{[key]:false}},admin]),[]);
  assert.deepEqual(visitReviewGaps(record,action,[sales,{...spv,permissions:{[key]:false}},{...admin,deletedAt:new Date()}]),[action]);
  assert.deepEqual(visitReviewGaps({userId:'admin'},action,[admin]),[action]);
 }
});
test('new submissions require the reviewer of each selected decision, using current role templates',async()=>{
 let locks=0;
 const sales={id:'sales',role:'SALES',supervisorId:'spv'},spv={id:'spv',role:'SUPERVISOR',roleCode:'RESTRICTED'};
 const db={$executeRaw:async()=>{locks++;},user:{findMany:async()=>[sales,spv]},systemConfig:{findMany:async()=>[{key:'ROLE_DEFINITIONS',value:[{code:'RESTRICTED',baseRole:'SUPERVISOR',defaultPermissions:{can_review_off_pjp:true,can_review_manual_sales:false}}]}]}};
 await assertVisitReviewersAvailable(db,sales.id,[]);assert.equal(locks,0);
 await assertVisitReviewersAvailable(db,sales.id,['OFF_PJP']);assert.equal(locks,1);
 await assert.rejects(()=>assertVisitReviewersAvailable(db,sales.id,['OFF_PJP','MANUAL_SALES']),e=>e.statusCode===409&&e.message.includes('hasil penjualan manual'));
 spv.permissions={can_review_manual_sales:true};await assertVisitReviewersAvailable(db,sales.id,['OFF_PJP','MANUAL_SALES']);
 sales.supervisorId='other';await assert.rejects(()=>assertVisitReviewersAvailable(db,sales.id,['OFF_PJP']),e=>e.statusCode===409);
});
