import {test} from 'node:test';
import assert from 'node:assert/strict';
import {departureChecklist} from '../../shared/warehouse-policy.mjs';
const items=[{key:'safe',label:'Kendaraan siap berangkat',required:true,type:'BOOLEAN',requireFailureReason:true},{key:'temperature',label:'Suhu muatan saat berangkat',required:true,type:'NUMBER',min:-30,max:30,failureBelow:-25}];
test('departure checklist is optional when empty and preserves typed answers when configured',()=>{
 assert.deepEqual(departureChecklist({},{}),{items:[],answers:{},failures:[]});
 assert.throws(()=>departureChecklist({TRIP_DEPARTURE_CHECKLIST:items},{}),/wajib/);
 assert.deepEqual(departureChecklist({TRIP_DEPARTURE_CHECKLIST:items},{safe:true,temperature:-18}).answers,{safe:true,temperature:-18});
});
test('failed departure checks block unless explicitly allowed, and retain reasons either way',()=>{
 const answers={safe:false,temperature:-18,_evidence:{safe:{reason:'Ban perlu diperiksa'}}};
 assert.throws(()=>departureChecklist({TRIP_DEPARTURE_CHECKLIST:items},answers),/Perbaiki/);
 const result=departureChecklist({TRIP_DEPARTURE_CHECKLIST:items,TRIP_BLOCK_FAILED_DEPARTURE_CHECKLIST:false},answers);
 assert.deepEqual(result.failures,[{key:'safe',label:'Kendaraan siap berangkat'}]);assert.equal(result.answers._evidence.safe.reason,'Ban perlu diperiksa');
 assert.throws(()=>departureChecklist({TRIP_DEPARTURE_CHECKLIST:items,TRIP_BLOCK_FAILED_DEPARTURE_CHECKLIST:false},{safe:false,temperature:-18}),/Alasan/);
});
