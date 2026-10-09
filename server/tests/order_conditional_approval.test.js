import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderApprovalDecision,orderReviewRole} from '../../shared/approval-workflow.mjs';
import {parameterGuidance} from '../../shared/policy-guidance.mjs';
const rules={ORDER_APPROVAL_MODE:'NONE',ORDER_APPROVAL_AMOUNT_THRESHOLD:2000,ORDER_APPROVAL_AMOUNT_MODE:'SUPERVISOR',ORDER_PRICE_OVERRIDE_APPROVAL_MODE:'ADMIN',ORDER_APPROVAL_CONDITION_PRIORITY:'PRICE_FIRST'};
test('parameter dependencies behave equally for saved booleans and form strings',()=>{
 for(const value of [false,'false']){
  const values={...rules,SALES_ALLOW_PRICE_OVERRIDE:value,NOTIFY_REALTIME_ENABLED:value,VEHICLE_SERVICE_ALLOW_BACKDATE:value};
  for(const key of ['ORDER_PRICE_OVERRIDE_APPROVAL_MODE','ORDER_APPROVAL_CONDITION_PRIORITY','NOTIFY_RETRY_MAX_ATTEMPTS','VEHICLE_SERVICE_MAX_BACKDATE_DAYS'])assert.ok(parameterGuidance(key,values),key);
 }
 for(const value of [true,'true']){
  const values={...rules,SALES_ALLOW_PRICE_OVERRIDE:value,NOTIFY_REALTIME_ENABLED:value,VEHICLE_SERVICE_ALLOW_BACKDATE:value};
  for(const key of ['ORDER_PRICE_OVERRIDE_APPROVAL_MODE','ORDER_APPROVAL_CONDITION_PRIORITY','NOTIFY_RETRY_MAX_ATTEMPTS','VEHICLE_SERVICE_MAX_BACKDATE_DAYS'])assert.equal(parameterGuidance(key,values),'',key);
 }
});
test('conditional approval uses the final total including the exact amount boundary; zero disables it',()=>{
 assert.equal(orderApprovalDecision({totalValue:1999},rules).mode,'NONE');
 assert.equal(orderApprovalDecision({totalValue:2000},rules).mode,'SUPERVISOR');
 assert.equal(orderApprovalDecision({totalValue:2220},rules).source,'AMOUNT');
 assert.equal(orderApprovalDecision({totalValue:2220},{...rules,ORDER_APPROVAL_AMOUNT_THRESHOLD:0}).mode,'NONE');
});
test('overlapping conditions follow explicit priority; inherited price policy still allows amount rules',()=>{
 const facts={totalValue:2200,hasPriceOverride:true};
 assert.equal(orderApprovalDecision(facts,rules).mode,'ADMIN');
 assert.equal(orderApprovalDecision(facts,{...rules,ORDER_APPROVAL_CONDITION_PRIORITY:'AMOUNT_FIRST'}).mode,'SUPERVISOR');
 assert.equal(orderApprovalDecision(facts,{...rules,ORDER_PRICE_OVERRIDE_APPROVAL_MODE:'INHERIT'}).source,'AMOUNT');
 assert.equal(orderApprovalDecision({...facts,hasPriceOverride:false},rules).source,'AMOUNT');
 assert.equal(orderApprovalDecision({totalValue:100,hasPriceOverride:true},rules).source,'PRICE_OVERRIDE');
});
test('saved conditional decision retains its stage even when current defaults and conditions change',()=>{
 const decision=orderApprovalDecision({totalValue:2000},{...rules,ORDER_APPROVAL_AMOUNT_MODE:'SEQUENTIAL'});
 const order={policySnapshot:{values:{ORDER_APPROVAL_MODE:decision.mode},orderApproval:decision},history:[]};
 assert.equal(orderReviewRole(order,{ORDER_APPROVAL_MODE:'NONE',ORDER_APPROVAL_AMOUNT_THRESHOLD:0}),'SUPERVISOR');
 order.history.push({action:'SUPERVISOR_REVIEW'});
 assert.equal(orderReviewRole(order,{ORDER_APPROVAL_MODE:'NONE'}),'ADMIN');
});
