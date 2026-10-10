import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DOMAIN_PERMISSIONS,CORE_ADMIN_ACTIONS,canDomainAction,domainPermissionDefaults,hasAdminRecovery} from '../../shared/domain-permissions.mjs';
import {authorizeWithPermission} from '../src/middlewares/auth.middleware.js';
import {BUILT_IN_ROLES,ALL_PERMISSIONS} from '../src/modules/roles/roles.constants.js';
test('every domain action requires both an eligible role and its independent permission',()=>{
 for(const [action,rule] of Object.entries({...DOMAIN_PERMISSIONS,...CORE_ADMIN_ACTIONS}))for(const role of BUILT_IN_ROLES.map(r=>r.code)){
  const actor={id:'person',role};
  assert.equal(canDomainAction(actor,action),rule.roles.includes(role));
  assert.equal(canDomainAction({...actor,permissions:{[rule.key]:true}},action),rule.roles.includes(role));
  assert.equal(canDomainAction({...actor,permissions:{[rule.key]:false}},action),false);
  assert.equal(canDomainAction({...actor,deletedAt:new Date()},action),false);
 }
 assert.equal(canDomainAction(null,'START_SHIFT'),false);assert.equal(canDomainAction({role:'ADMIN'},'UNKNOWN'),false);
});
test('new permission defaults match every built-in role and are registered exactly once',()=>{
 for(const role of BUILT_IN_ROLES)for(const [key,value] of Object.entries(domainPermissionDefaults(role.code))){
  assert.equal(role.defaultPermissions[key],value);assert.equal(ALL_PERMISSIONS.filter(p=>p.key===key).length,1);
 }
});
test('general permission middleware cannot promote a role through a true grant',()=>{
 const gate=authorizeWithPermission(['ADMIN'],'can_manage_users');
 for(const role of ['SUPERVISOR','SALES','KEPALA_GUDANG','SUPIR']){
  let error;gate({user:{role,permissions:{can_manage_users:true}}},{},e=>{error=e;});assert.equal(error.statusCode,403);
 }
 let error;gate({user:{role:'ADMIN',permissions:{can_manage_users:false}}},{},e=>{error=e;});assert.equal(error.statusCode,403);
 gate({user:{role:'ADMIN',permissions:{can_manage_users:true}}},{},e=>{error=e;});assert.equal(error,undefined);
});
test('recovery requires one active Admin with all three core administration permissions',()=>{
 assert.equal(hasAdminRecovery({role:'ADMIN'}),true);
 for(const key of ['can_manage_users','can_manage_roles','can_manage_system_config'])assert.equal(hasAdminRecovery({role:'ADMIN',permissions:{[key]:false}}),false);
 assert.equal(hasAdminRecovery({role:'SUPERVISOR'}),false);assert.equal(hasAdminRecovery({role:'ADMIN',deletedAt:new Date()}),false);
});
