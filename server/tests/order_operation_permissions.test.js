import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canOrderOperation,ORDER_OPERATION_PERMISSIONS} from '../../shared/order-operation-permissions.mjs';
test('order operation restrictions preserve Admin boundaries and independent grants',()=>{
 for(const [action,{key}] of Object.entries(ORDER_OPERATION_PERMISSIONS)){
  assert.equal(canOrderOperation({role:'ADMIN'},action),true);
  assert.equal(canOrderOperation({role:'ADMIN',permissions:{[key]:false}},action),false);
  assert.equal(canOrderOperation({role:'ADMIN',deletedAt:new Date(),permissions:{[key]:true}},action),false);
  for(const role of ['SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR'])assert.equal(canOrderOperation({role,permissions:{[key]:true}},action),false);
  for(const [other,{key:otherKey}] of Object.entries(ORDER_OPERATION_PERMISSIONS))if(other!==action)assert.equal(canOrderOperation({role:'ADMIN',permissions:{[otherKey]:false}},action),true);
 }
 assert.equal(canOrderOperation({role:'ADMIN',permissions:{can_approve_order:false,can_assign_order_review:true}},'ASSIGN_REVIEW'),false);
 assert.equal(canOrderOperation(null,'PROMISE'),false);
 assert.equal(canOrderOperation({role:'ADMIN'},'UNKNOWN'),false);
});
