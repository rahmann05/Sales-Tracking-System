import { test } from 'node:test';
import assert from 'node:assert/strict';
import { packingBalance, validateAllocation } from '../../shared/packing.mjs';
import { CONFIG_DEFAULTS } from '../../shared/config.mjs';
import { packingReady } from '../src/modules/delivery/services/packing-workflow.service.js';
const packing = { status: 'RELEASED', totalCartons: 10, totalWeight: 100, items: [{ lineId: 'a', name: 'A', quantity: 100 }], deliveryStops: [] };
test('default packing workflow is manual admin release with optional split', () => { assert.equal(CONFIG_DEFAULTS.PACKING_SOURCE_MODE,'MANUAL'); assert.equal(CONFIG_DEFAULTS.PACKING_AUTO_RELEASE,false); assert.equal(CONFIG_DEFAULTS.PACKING_AUTO_FROM_APPROVED_ORDER,false); assert.equal(CONFIG_DEFAULTS.PACKING_ALLOW_PENDING_ORDER,false); });
test('split reserves cartons and product quantities independently', () => {
 const first = validateAllocation(packing,{allocatedCartons:4,allocatedItems:[{lineId:'a',quantity:30}]},true);
 const balance = packingBalance({...packing,deliveryStops:[first]});
 assert.equal(balance.remainingCartons,6); assert.equal(balance.remainingItems[0].remaining,70); assert.equal(first.allocatedWeight,40);
 assert.throws(() => validateAllocation({...packing,deliveryStops:[first]},{allocatedCartons:7},true));
 assert.throws(() => validateAllocation({...packing,deliveryStops:[first]},{allocatedCartons:6,allocatedItems:[{lineId:'a',quantity:71}]},true));
});
test('draft and incomplete split cannot be dispatched', () => {
 assert.throws(() => validateAllocation({...packing,status:'DRAFT'},{},true));
 assert.throws(() => validateAllocation(packing,{allocatedCartons:5},true));
 assert.throws(() => validateAllocation(packing,{allocatedCartons:10,allocatedItems:[{lineId:'a',quantity:50}]},true));
 assert.throws(() => validateAllocation(packing,{allocatedCartons:5,allocatedItems:[{lineId:'a',quantity:50}]},false));
 assert.equal(validateAllocation(packing,{},false).allocatedCartons,10);
});
test('release requires real packing and invoice totals', () => {
 assert.equal(packingReady({...packing,invoices:[{totalCartons:10}]}),true);
 assert.equal(packingReady({...packing,invoices:[{totalCartons:9}]}),false);
 assert.equal(packingReady({...packing,totalCartons:0,invoices:[]}),false);
});
