import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRoleDefinitions} from '../src/modules/roles/persist-role-definitions.service.js';
import {BUILT_IN_ROLES} from '../src/modules/roles/roles.constants.js';
test('role optimistic checks compare the same effective template the editor loaded',()=>{
 const base=BUILT_IN_ROLES.find(r=>r.code==='ADMIN'),raw={...base,defaultPermissions:{can_manage_rjp:false}};
 const displayed={...raw,baseRole:'ADMIN',userCount:3,defaultPermissions:{...base.defaultPermissions,...raw.defaultPermissions}};
 assert.deepEqual(normalizeRoleDefinitions([raw]),normalizeRoleDefinitions([displayed]));
 assert.notDeepEqual(normalizeRoleDefinitions([{...raw,defaultPermissions:{can_manage_rjp:true}}]),normalizeRoleDefinitions([displayed]));
 const custom={code:'CUSTOM',isSystem:false,defaultPermissions:{can_manage_rjp:false}};
 assert.equal(normalizeRoleDefinitions([custom])[0].baseRole,'SALES');assert.deepEqual(normalizeRoleDefinitions([custom])[0].defaultPermissions,custom.defaultPermissions);
});
