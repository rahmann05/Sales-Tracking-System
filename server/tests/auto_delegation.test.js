import test from 'node:test';
import assert from 'node:assert/strict';
import {delegationTrigger,delegationDeadline,delegationBlock,AUTO_DELEGATION_KINDS} from '../../shared/auto-delegation.mjs';
import {canScheduleAssignment} from '../../shared/assignment-schedules.mjs';
import {featureDecision} from '../../shared/feature-policy.mjs';
const now=Date.parse('2026-10-11T17:00:00Z');
test('Auto delegation respects WIB end of due date, grace, missing owner and terminal work',()=>{
 const rule={trigger:'OVERDUE',graceMinutes:1};
 assert.equal(delegationTrigger(rule,{dueAt:'2026-10-11'},true,now),false);
 assert.equal(delegationTrigger(rule,{dueAt:'2026-10-11'},true,now+60000),true);
 assert.equal(delegationTrigger(rule,{dueAt:null},false,now),false);
 assert.equal(delegationTrigger({trigger:'UNASSIGNED'},{ownerId:null},false,now),true);
 assert.equal(delegationTrigger({trigger:'OWNER_UNAVAILABLE'},{ownerId:'old'},false,now),true);
 assert.equal(delegationTrigger({trigger:'UNASSIGNED'},{finished:true},false,now),false);
 assert.equal(delegationDeadline('FOLLOW_UP',24,now),'2026-10-13');
 assert.equal(Object.hasOwn(AUTO_DELEGATION_KINDS,'TEAM'),false);
});
test('Transfer cap, cooldown and external assignment changes require explicit recovery',()=>{
 const rule={maxTransfers:2,cooldownMinutes:10},state={fingerprint:'latest'};
 assert.equal(delegationBlock(rule,state,null,now),null);
 assert.match(delegationBlock(rule,state,{transfers:2},now),/Batas/);
 assert.match(delegationBlock(rule,state,{lastFingerprint:'old'},now),/diubah/);
 assert.match(delegationBlock(rule,state,{lastFingerprint:'latest',lastAppliedAt:new Date(now-60000).toISOString()},now),/jeda/);
});
test('Schedule UI and service contract rejects foreign roles and denied process permissions',()=>{
 assert.equal(canScheduleAssignment({role:'SALES'},'FOLLOW_UP'),false);
 assert.equal(canScheduleAssignment({role:'ADMIN',permissions:{can_assign_follow_up:false}},'FOLLOW_UP'),false);
 assert.equal(canScheduleAssignment({role:'ADMIN',permissions:{can_assign_order_review:false}},'ORDER_REVIEW'),false);
 assert.equal(canScheduleAssignment({role:'ADMIN'},'UNKNOWN'),false);
});
test('Paused outlet master still allows cancelling stored changes and duplicate preview, but rejects a new proposal',()=>{
 const values={FEATURE_OUTLET_MASTER_MODE:'OFF'};
 assert.equal(featureDecision(values,'/api/v1/outlets/id/change-queue/job/cancel','POST').allowed,true);
 assert.equal(featureDecision(values,'/api/v1/outlets/duplicates','POST').allowed,true);
 assert.equal(featureDecision(values,'/api/v1/outlets/id/change-queue','POST').allowed,false);
});
