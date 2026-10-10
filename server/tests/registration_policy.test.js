import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registrationLocation,registrationRevisionReadiness} from '../../shared/registration-policy.mjs';
test('optional outlet coordinates remain unknown, paired and range checked',()=>{
 assert.deepEqual(registrationLocation({},false),{latitude:null,longitude:null});
 assert.deepEqual(registrationLocation({latitude:0,longitude:0}),{latitude:0,longitude:0});
 for(const value of [{},{latitude:0},{latitude:NaN,longitude:1},{latitude:91,longitude:0},{latitude:'0',longitude:'0'}])assert.throws(()=>registrationLocation(value));
 assert.throws(()=>registrationLocation({latitude:null,longitude:0},false));
});
test('revision count, deadline and frozen policy are independent and explain rejection',()=>{
 const row={registrationStatus:'REJECTED',updatedAt:'2026-10-10T01:00:00Z',revisionHistory:[{requestId:'1'}],policySnapshot:{values:{REGISTRATION_MAX_REVISIONS:2,REGISTRATION_REVISION_DAYS:1}}};
 const now=Date.parse('2026-10-10T02:00:00Z');
 const ready=registrationRevisionReadiness(row,undefined,now);assert.equal(ready.allowed,true);assert.equal(ready.deadline,'2026-10-11T01:00:00.000Z');assert.equal(ready.count,1);
 assert.equal(registrationRevisionReadiness(row,{REGISTRATION_MAX_REVISIONS:1},now).allowed,false);
 assert.equal(registrationRevisionReadiness(row,{REGISTRATION_ALLOW_REVISION:false},now).allowed,false);
 assert.equal(registrationRevisionReadiness(row,undefined,Date.parse('2026-10-11T01:00:00Z')).allowed,true);
 assert.match(registrationRevisionReadiness(row,undefined,Date.parse('2026-10-11T01:00:01Z')).issues[0],/berakhir/);
 assert.equal(registrationRevisionReadiness(row,{},Date.parse('2027-10-11T01:00:00Z')).allowed,true);
 assert.equal(registrationRevisionReadiness({...row,updatedAt:null},row.policySnapshot.values,now).allowed,false);
 assert.equal(registrationRevisionReadiness({...row,registrationStatus:'REGISTERED_ACTIVE'}, {},now).allowed,false);
});
