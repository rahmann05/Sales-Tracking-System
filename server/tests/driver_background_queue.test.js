import test from 'node:test';
import assert from 'node:assert/strict';
import {retryDisposition,retryDelay,validQueueJob,terminalExpired} from '../../client/public/driver-evidence-worker.mjs';
import {policyConflicts} from '../../shared/operational-policy.mjs';
test('Automatic evidence retries only network/server failures and preserves validation and session failures for attention',()=>{
 for(const status of [408,429,500,502,503])assert.equal(retryDisposition(status),'RETRY');
 for(const status of [400,403,404,409,422])assert.equal(retryDisposition(status),'NEEDS_REVIEW');
 assert.equal(retryDisposition(401),'NEEDS_AUTH');assert.equal(retryDisposition(201),'CONFIRMED');
 assert.ok(retryDelay(5)>retryDelay(1));assert.equal(retryDelay(30),300000);
});
test('Retention removes only old terminal metadata, preserving every unresolved proof',()=>{
 const now=100000000,updatedAt=now-25*3600000;
 for(const state of ['CONFIRMED','CANCELLED'])assert.equal(terminalExpired({state,updatedAt},now,24),true);
 for(const state of ['QUEUED','RETRY','NEEDS_AUTH','NEEDS_REVIEW','PAUSED'])assert.equal(terminalExpired({state,updatedAt},now,24),false);
 assert.equal(terminalExpired({state:'CONFIRMED',updatedAt:now},now,24),false);
 assert.equal(terminalExpired({state:'CONFIRMED'},now,24),false);
});
test('Queue only supports persistent, actor-scoped Driver operations with original request identity',()=>{
 const job={actorId:'driver',requestId:'request',body:{requestId:'request'},draftKey:'form-draft:driver:driver-evidence:stop:absen_in',method:'POST',endpoint:'/delivery/stops/stop/attendance'};
 assert.ok(validQueueJob(job));assert.ok(!validQueueJob({...job,endpoint:'/orders'}));assert.ok(!validQueueJob({...job,method:'DELETE'}));
 assert.ok(!validQueueJob({...job,body:{requestId:'different'}}));assert.ok(!validQueueJob({...job,actorId:'different'}));
 assert.match(policyConflicts({DRIVER_BACKGROUND_SUBMISSION_ENABLED:true,DRAFT_STORAGE_MODE:'SESSION'})[0],/persisten/);
 assert.ok(!policyConflicts({DRIVER_BACKGROUND_SUBMISSION_ENABLED:true,DRAFT_STORAGE_MODE:'PERSISTENT'}).some(message=>message.includes('persisten')));
});
