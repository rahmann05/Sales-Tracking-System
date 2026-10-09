import test from 'node:test';
import assert from 'node:assert/strict';
import {preparationOwnerProblem,warehouseStaffEligible} from '../../shared/warehouse-policy.mjs';
import {warehouseAssignmentGaps} from '../../shared/warehouse-assignment-readiness.mjs';
const picker={id:'picker',role:'KEPALA_GUDANG',permissions:{}},checker={id:'checker',role:'ADMIN',permissions:{}};
const route={id:'route',code:'TRIP-UJI',status:'DRAFT',policySnapshot:{values:{WAREHOUSE_REQUIRE_PICK:true,WAREHOUSE_REQUIRE_CHECK:true,WAREHOUSE_REQUIRE_LOAD:false,WAREHOUSE_SEPARATE_CHECKER:true}},preparation:{tasks:{PICK:{ownerId:picker.id},CHECK:{ownerId:checker.id}}}};
test('warehouse owners need both read and execution permission; explicit Admin deny applies',()=>{
 assert.equal(warehouseStaffEligible(picker,'can_manage_delivery_routes'),true);
 assert.equal(warehouseStaffEligible({...checker,permissions:{can_monitor_delivery:false}},'can_manage_delivery_routes'),false);
 assert.equal(warehouseStaffEligible({...picker,permissions:{can_manage_delivery_routes:false}},'can_manage_delivery_routes'),false);
 assert.equal(warehouseStaffEligible({...picker,deletedAt:new Date()},'can_manage_delivery_routes'),false);
});
test('separate checker is checked against planned and actual picker in either assignment order',()=>{
 assert.match(preparationOwnerProblem(picker,route,'CHECK'),/harus berbeda/);
 assert.match(preparationOwnerProblem(checker,route,'PICK'),/harus berbeda/);
 const actual={...route,preparation:{PICK:{actorId:picker.id},tasks:{}}};
 assert.match(preparationOwnerProblem(picker,actual,'CHECK'),/harus berbeda/);
 assert.equal(preparationOwnerProblem(checker,actual,'CHECK'),null);
});
test('only unresolved required preparation tasks protect account changes, not historical actors',()=>{
 const people=[{...picker,deletedAt:new Date()},checker];
 assert.deepEqual(warehouseAssignmentGaps([route],people).map(g=>g.key),['PREPARATION:route:PICK']);
 assert.deepEqual(warehouseAssignmentGaps([{...route,preparation:{...route.preparation,PICK:{actorId:picker.id}}}],people),[]);
 assert.deepEqual(warehouseAssignmentGaps([{...route,cancelledAt:new Date()}],people),[]);
 const skipped={...route,policySnapshot:{values:{...route.policySnapshot.values,WAREHOUSE_REQUIRE_PICK:false}}};
 assert.deepEqual(warehouseAssignmentGaps([skipped],people),[]);
});
test('assigned return inspection stays protected after trip return or optional closure, then releases on inspection',()=>{
 const returned={...route,status:'PARTIAL',closedAt:new Date(),preparation:{returnTasks:{stop:{ownerId:picker.id}}},stops:[{id:'stop',rejectedCartons:1}]};
 const people=[{...picker,permissions:{can_monitor_delivery:false}},checker];
 assert.deepEqual(warehouseAssignmentGaps([returned],people).map(g=>g.key),['RETURN:stop:OWNER']);
 assert.deepEqual(warehouseAssignmentGaps([{...returned,stops:[{...returned.stops[0],returnInspection:{actorId:checker.id}}]}],people),[]);
 assert.deepEqual(warehouseAssignmentGaps([{...returned,preparation:{}}],people),[]);
});
