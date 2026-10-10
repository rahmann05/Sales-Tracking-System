import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRIP_PERMISSION_LABELS,canTripAction,tripPermission,tripPermissionDefaults} from '../../shared/trip-permissions.mjs';
test('Every trip action has individual permissions with broad denial taking precedence',()=>{
 for(const action of Object.keys(TRIP_PERMISSION_LABELS)){
  assert.equal(canTripAction({role:'ADMIN',permissions:tripPermissionDefaults('ADMIN')},action),true);
  assert.equal(canTripAction({role:'ADMIN',permissions:{[tripPermission(action)]:false}},action),false);
  assert.equal(canTripAction({role:'KEPALA_GUDANG',permissions:{can_manage_delivery_routes:false,[tripPermission(action)]:true}},action),false);
  assert.equal(canTripAction({role:'SUPIR'},action),['START','RETURN'].includes(action));
  assert.equal(canTripAction({role:'SALES'},action),false);
 }
 assert.equal(canTripAction({role:'ADMIN'},'UNKNOWN'),false);
});
