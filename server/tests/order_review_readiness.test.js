import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderReviewAssignmentGaps} from '../../shared/approval-readiness.mjs';
test('an explicit order reviewer remains eligible even when other approvers exist',()=>{
 const sales={id:'sales',role:'SALES',supervisorId:'spv'},spv={id:'spv',role:'SUPERVISOR'},admin={id:'admin',role:'ADMIN'},other={id:'other',role:'ADMIN'};
 const order={createdBy:sales.id,history:[],policySnapshot:{values:{ORDER_APPROVAL_MODE:'BOTH'}}},assignment={ownerId:admin.id,ownerRole:'ADMIN'};
 assert.deepEqual(orderReviewAssignmentGaps(order,assignment,[sales,spv,admin,other]),[]);
 for(const patch of [{deletedAt:new Date()},{permissions:{can_approve_order:false}},{role:'SALES'}])assert.deepEqual(orderReviewAssignmentGaps(order,assignment,[sales,spv,{...admin,...patch},other]),['ASSIGNED_REVIEWER']);
 assert.deepEqual(orderReviewAssignmentGaps(order,{ownerId:spv.id,ownerRole:'SUPERVISOR'},[{...sales,supervisorId:'new'},spv,admin]),['ASSIGNED_REVIEWER']);
 assert.deepEqual(orderReviewAssignmentGaps(order,{ownerId:null},[sales]),[]);
 const sequential={...order,policySnapshot:{values:{ORDER_APPROVAL_MODE:'SEQUENTIAL'}},history:[{action:'SUPERVISOR_REVIEW'}]};
 assert.deepEqual(orderReviewAssignmentGaps(sequential,{ownerId:spv.id,ownerRole:'SUPERVISOR'},[sales,admin]),[]);
 assert.deepEqual(orderReviewAssignmentGaps(sequential,assignment,[sales,admin]),[]);
});
