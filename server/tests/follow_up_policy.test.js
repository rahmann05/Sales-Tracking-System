import test from 'node:test';
import assert from 'node:assert/strict';
import {followUpAssignmentGaps,followUpAllowed,followUpOwnerEligible} from '../../shared/follow-up-policy.mjs';
test('Follow-up explicit denial applies to Admin and legacy templates keep role defaults',()=>{
 assert.equal(followUpAllowed({role:'ADMIN',permissions:{can_assign_follow_up:false}},'assign'),false);
 assert.equal(followUpAllowed({role:'SUPERVISOR'},'review'),true);
 assert.equal(followUpOwnerEligible({role:'SALES',deletedAt:new Date()}),false);
});
test('Follow-up reviewer must be active and in the owner team; completed tasks release accounts',()=>{
 const task={id:'f',followUp:{status:'SUBMITTED',ownerId:'sales'},policySnapshot:{values:{FOLLOW_UP_REQUIRE_REVIEW:true}}};
 const sales={id:'sales',role:'SALES',supervisorId:'spv'},wrong={id:'wrong',role:'SUPERVISOR'};
 assert.equal(followUpAssignmentGaps([task],[sales,wrong])[0].key,'FOLLOW_UP:f:REVIEWER');
 assert.deepEqual(followUpAssignmentGaps([task],[sales,{id:'spv',role:'SUPERVISOR'}]),[]);
 assert.deepEqual(followUpAssignmentGaps([{...task,followUp:{...task.followUp,status:'DONE'}}],[]),[]);
});
