import {test} from 'node:test';
import assert from 'node:assert/strict';
import {outletLocationAlert,fieldTaskTiming} from '../../shared/outlet-monitoring.mjs';
import {outletLocationBasis} from '../../shared/outlet-location.mjs';
import {applyAttentionSla} from '../../shared/attention-sla.mjs';
const now=Date.parse('2026-10-12T09:00:00+07:00'),createdAt=new Date(now-86400000).toISOString();
const base={name:'Toko Melati',address:'Jl Melati No 12 Bandung',phone:null,clusterId:'c',latitude:null,longitude:null,createdAt,updatedAt:createdAt};
const g={status:'ACTIVE',basis:outletLocationBasis(base),latitude:-6.9,longitude:107.6,cachedAt:createdAt,expiresAt:new Date(now+86400000).toISOString()};
test('location monitoring distinguishes usable provider errors, expired and missing points without coordinates in alerts',()=>{
 assert.equal(outletLocationAlert({...base,googleLocation:g},now),null);
 assert.equal(outletLocationAlert({...base,latitude:-6.9,longitude:107.6},now),null);
 assert.equal(outletLocationAlert(base,now).code,'MISSING');
 const problemSince=new Date(now-3600000).toISOString(),alert=outletLocationAlert({...base,googleLocation:{...g,lastError:'PROVIDER_UNAVAILABLE',problemSince}},now);
 assert.equal(alert.code,'REFRESH_FAILED');assert.equal(alert.usable,true);assert.equal(alert.since,problemSince);assert.equal('latitude' in alert,false);
 const expired=outletLocationAlert({...base,googleLocation:{...g,expiresAt:createdAt}},now);assert.equal(expired.code,'EXPIRED');assert.equal(expired.usable,false);assert.equal(expired.since,createdAt);
 assert.equal(outletLocationAlert({...base,address:'Jl Mawar',googleLocation:g},now).code,'CHANGED');
 assert.equal(outletLocationAlert({...base,googleLocation:{...g,status:'CONFLICT',problemSince}},now).since,problemSince);
});
test('location warning SLA uses stable problem anchor and can be disabled',()=>{
 const row={stage:'OUTLET_LOCATION',since:createdAt};
 assert.equal(applyAttentionSla(row,{OUTLET_LOCATION_ALERT_SLA_HOURS:2}).dueAt,new Date(Date.parse(createdAt)+7200000).toISOString());
 assert.equal(applyAttentionSla(row,{OUTLET_LOCATION_ALERT_SLA_HOURS:0}).dueAt,undefined);
});
test('review deadlines follow frozen business calendar separately from Sales due date',()=>{
 const task={status:'SUBMITTED',updatedAt:'2026-10-09T16:00:00+07:00',dueAt:'2026-10-08T00:00:00Z',policySnapshot:{values:{OUTLET_FIELD_REVIEW_SLA_HOURS:2,SLA_CLOCK_MODE:'BUSINESS',SLA_WORKING_DAYS:'1,2,3,4,5',SLA_WORK_START:'08:00',SLA_WORK_END:'17:00'}}};
 const timing=fieldTaskTiming(task,now);assert.equal(timing.reviewDueAt,'2026-10-12T02:00:00.000Z');assert.equal(timing.overdue,false);
 assert.equal(fieldTaskTiming({...task,status:'OPEN'},now).overdue,true);
 assert.equal(fieldTaskTiming({...task,status:'DONE'},now).overdue,false);
 assert.equal(fieldTaskTiming({...task,policySnapshot:{values:{OUTLET_FIELD_REVIEW_SLA_HOURS:0}}},now).reviewDueAt,null);
 assert.equal(fieldTaskTiming({...task,updatedAt:undefined},now).reviewDueAt,null);
});
