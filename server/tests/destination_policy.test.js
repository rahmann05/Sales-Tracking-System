import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deliveryStopGate} from '../../shared/driver-workspace.mjs';
import {assertDestinationStart,flagIncompleteDestinations} from '../src/modules/delivery/services/destination-policy.service.js';

const stops=()=>[1,2,3].map(sequence=>({id:`s${sequence}`,sequence,status:'PENDING',outlet:{name:`Toko ${sequence}`},attendances:[]}));
test('destination order blocks skipping, but completing an already started destination always remains available',()=>{
 const rows=stops(),strict={DELIVERY_STOP_ORDER:'SEQUENTIAL',DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT:true};
 assert.equal(deliveryStopGate(rows,'s1',strict).blocked,false);
 assert.equal(deliveryStopGate(rows,'s2',strict).blocked,true);
 rows[0].arrivedAt='2026-10-09';assert.equal(deliveryStopGate(rows,'s2',strict).blocked,true);
 rows[1].arrivedAt='2026-10-09';assert.equal(deliveryStopGate(rows,'s2',strict).blocked,false);
 rows[0].status='DELIVERED';rows[1].arrivedAt=null;assert.equal(deliveryStopGate(rows,'s2',strict).blocked,false);
});
test('free-order continuation flags only actual unfinished visits and never invents results or OUT evidence',()=>{
 const rows=stops();assert.deepEqual(deliveryStopGate(rows,'s3').incomplete,[]);
 rows[0].attendances=[{type:'IN'}];
 const before=structuredClone(rows),gate=deliveryStopGate(rows,'s3');
 assert.equal(gate.blocked,false);assert.deepEqual(gate.incomplete.map(s=>s.id),['s1']);assert.deepEqual(rows,before);
 assert.equal(deliveryStopGate(rows,'s3',{DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT:false}).blocked,true);
 assert.equal(deliveryStopGate(rows,'s1',{DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT:false}).blocked,false);
 rows[0].status='PARTIAL_REJECT';assert.equal(deliveryStopGate(rows,'s3',{DELIVERY_ALLOW_CONTINUE_WITHOUT_RESULT:false}).blocked,false);
});
test('older trip snapshots retain free-order semantics when new destination settings did not exist',async()=>{
 const rows=stops();rows[0].arrivedAt='2026-10-09';
 const db={deliveryStop:{findMany:async()=>rows}};
 const pending=await assertDestinationStart(db,{...rows[2],deliveryRoute:{id:'r',policySnapshot:{values:{}}}});
 assert.deepEqual(pending.map(s=>s.id),['s1']);
 await assert.rejects(()=>assertDestinationStart(db,{...rows[2],deliveryRoute:{id:'r',policySnapshot:{values:{DELIVERY_STOP_ORDER:'SEQUENTIAL'}}}}),e=>e.statusCode===409);
});
test('warehouse flag is created once even after resolution; disabling notifications leaves the task intact',async()=>{
 const rows=stops(),issues=[],notifications=[];
 const db={deliveryIssue:{findFirst:async q=>issues.find(i=>i.stopId===q.where.stopId&&i.title===q.where.title),create:async({data})=>{const issue={id:'issue',...data};issues.push(issue);return issue;}},user:{findFirst:async()=>({id:'warehouse'}),findUnique:async()=>null},notification:{create:async args=>notifications.push(args)}};
 const stop={...rows[2],deliveryRoute:{id:'r',code:'TRIP',createdById:'warehouse',policySnapshot:{values:{DELIVERY_ISSUE_DEFAULT_HOURS:2}}}};
 await flagIncompleteDestinations(db,stop,[rows[0]],'driver');
 assert.equal(issues.length,1);assert.equal(issues[0].ownerId,'warehouse');assert.equal(issues[0].stopId,'s1');assert.equal(issues[0].history[0].nextStopId,'s3');
 issues[0].status='DONE';await flagIncompleteDestinations(db,stop,[rows[0]],'driver');assert.equal(issues.length,1);assert.equal(notifications.length,0);
 assert.equal(rows[0].status,'PENDING');assert.deepEqual(rows[0].attendances,[]);
});
