import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ALL_PERMISSIONS,BUILT_IN_ROLES} from '../src/modules/roles/roles.constants.js';
import {ALL_PERMISSIONS as clientPermissions,BUILT_IN_ROLE_TEMPLATES} from '../../client/src/constants/permissions.js';
import {BUSINESS_ACTIONS,actionNames,actionFeature} from '../../shared/business-actions.mjs';
import {featureDecision} from '../../shared/feature-policy.mjs';
test('client and API expose the same permission keys and built-in role defaults',()=>{
 const keys=ALL_PERMISSIONS.map(p=>p.key).sort();assert.equal(new Set(keys).size,keys.length);
 assert.deepEqual(clientPermissions.map(p=>p.key).sort(),keys);
 for(const role of BUILT_IN_ROLES)assert.deepEqual(BUILT_IN_ROLE_TEMPLATES[role.code],role.defaultPermissions,role.code);
});
test('every declared multipurpose action has explicit intent; disabled features retain existing work',()=>{
 for(const [group,rules] of Object.entries(BUSINESS_ACTIONS))for(const name of actionNames(group)){
  const rule=rules[name];assert.ok(['NEW_WORK','EXISTING_WORK'].includes(rule.intent));assert.deepEqual(actionFeature(group,name),[rule.feature,rule.intent==='NEW_WORK']);
 }
 for(const mode of ['ACTIVE','PAUSED','OFF'])for(const action of actionNames('STAFF')){
  const rule=BUSINESS_ACTIONS.STAFF[action];
  assert.equal(featureDecision({['FEATURE_'+rule.feature+'_MODE']:mode},'/api/v1/staff-attendance','POST',{action}).allowed,mode==='ACTIVE'||!['SHIFT_IN','VISIT_IN','OFF_PJP'].includes(action));
 }
 for(const action of actionNames('TRIP'))assert.equal(featureDecision({FEATURE_DELIVERY_MODE:'OFF'},'/api/v1/delivery/routes/id/actions','POST',{action}).allowed,true);
 assert.equal(actionFeature('TRIP','UNKNOWN'),null);
});
