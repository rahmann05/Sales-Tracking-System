import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderReviewerGaps,registrationReviewerGaps} from '../../shared/approval-readiness.mjs';
const sales={id:'sales',role:'SALES',supervisorId:'spv'},admin={id:'admin',role:'ADMIN'},spv={id:'spv',role:'SUPERVISOR'},foreign={id:'foreign',role:'SUPERVISOR'};
const order=mode=>({policySnapshot:{values:{ORDER_APPROVAL_MODE:mode}}});
test('order reviewer must belong to current team, have permission and be active',()=>{
 assert.deepEqual(orderReviewerGaps(order('SUPERVISOR'),sales,[admin,foreign]),['SUPERVISOR']);
 for(const patch of [{deletedAt:new Date()},{permissions:{can_approve_order:false}}])assert.deepEqual(orderReviewerGaps(order('SUPERVISOR'),sales,[{...spv,...patch}]),['SUPERVISOR']);
 assert.deepEqual(orderReviewerGaps(order('BOTH'),sales,[admin]),[]);
 assert.deepEqual(orderReviewerGaps(order('NONE'),sales,[]),[]);
});
test('sequential order requires both stages initially, only Admin after SPV decision',()=>{
 assert.deepEqual(orderReviewerGaps(order('SEQUENTIAL'),sales,[spv],{allStages:true}),['ADMIN']);
 assert.deepEqual(orderReviewerGaps({...order('SEQUENTIAL'),history:[{action:'SUPERVISOR_REVIEW'}]},sales,[admin]),[]);
 assert.deepEqual(orderReviewerGaps(order('ADMIN'),{...sales,id:'admin'},[admin]),['ADMIN']);
});
test('outlet registration validates activation even without human review',()=>{
 const record={policySnapshot:{values:{REGISTRATION_APPROVAL_MODE:'NONE',REGISTRATION_ACTIVATOR:'SUPERVISOR'}}};
 assert.deepEqual(registrationReviewerGaps(record,sales,[admin]),['SUPERVISOR']);
 assert.deepEqual(registrationReviewerGaps({...record,registrationStatus:'SPV_APPROVED'},sales,[spv]),[]);
 assert.deepEqual(registrationReviewerGaps({policySnapshot:{values:{REGISTRATION_APPROVAL_MODE:'SEQUENTIAL'}}},sales,[spv]),['ADMIN']);
 assert.deepEqual(registrationReviewerGaps({...record,registrationStatus:'SPV_APPROVED'},sales,[{...spv,permissions:{can_approve_outlet:false}}]),['SUPERVISOR']);
});
