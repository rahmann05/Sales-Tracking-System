import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readDraft,writeDraft,DRAFT_TTL,mergeFormDraft,draftPolicyVersion,policyVersionChanged} from '../../shared/form-draft.mjs';
import {driverPendingDrafts} from '../../shared/driver-pending.mjs';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
test('draft survives reload and is isolated by account and task',()=>{const s=memory();assert.equal(writeDraft(s,'sales-1:order:stop-1',{code:'SO-123',items:[{id:'p',quantity:3}]},100),true);assert.equal(readDraft(s,'sales-2:order:stop-1',101),null);assert.equal(readDraft(s,'sales-1:order:stop-2',101),null);assert.equal(readDraft(s,'sales-1:order:stop-1',101).items[0].quantity,3);});
test('expired normal drafts and corrupted storage are ignored',()=>{const s=memory();writeDraft(s,'a',{note:'old'},100);assert.equal(readDraft(s,'a',101+DRAFT_TTL),null);s.setItem('a','broken');assert.equal(readDraft(s,'a'),null);});
test('unconfirmed submission identity remains recoverable beyond ordinary draft expiry',()=>{const s=memory();const pending={requestId:'same-request',outletName:'Toko',gpsLocation:{lat:-6.9,lng:107.6}};writeDraft(s,'a',{pending},100);assert.deepEqual(readDraft(s,'a',101+DRAFT_TTL).pending,pending);});
test('storage quota or disabled storage returns a recoverable failure',()=>{assert.equal(writeDraft({setItem(){throw new Error('quota');}},'a',{note:'x'}),false);assert.equal(readDraft({getItem(){throw new Error('disabled');}},'a'),null);});
test('draft retention is configurable but cannot expire an unconfirmed request',()=>{
 const s=memory();writeDraft(s,'normal',{note:'x'},100);writeDraft(s,'pending',{pending:{requestId:'same'}},100);
 assert.equal(readDraft(s,'normal',201,100),null);assert.equal(readDraft(s,'pending',201,100).pending.requestId,'same');
});
test('driver recovery scans every pending submission even when an earlier ordinary draft expires',()=>{
 const s=memory(),keys=()=>[...s.data.keys()];s.data=new Map();
 s.getItem=k=>s.data.get(k)||null;s.setItem=(k,v)=>s.data.set(k,v);s.removeItem=k=>s.data.delete(k);
 Object.defineProperty(s,'length',{get:()=>s.data.size});s.key=i=>keys()[i]??null;
 const prefix='form-draft:driver-1:driver-evidence:';
 writeDraft(s,prefix+'expired',{note:'expired'},100);
 writeDraft(s,prefix+'pending',{pending:{requestId:'same-request',stopId:'stop-1'}},100);
 writeDraft(s,'form-draft:driver-2:driver-evidence:other',{pending:{requestId:'private',stopId:'stop-2'}},100);
 assert.deepEqual(driverPendingDrafts(s,'driver-1').map(row=>row.pending.requestId),['same-request']);
 assert.equal(s.getItem(prefix+'expired'),null);
});
test('legacy order receipt survives merging with an ordinary draft and newer receipt takes precedence',()=>{
 const old={pending:{requestId:'old'}},saved={code:'draft',pending:null};assert.equal(mergeFormDraft(old,saved).pending.requestId,'old');
 assert.equal(mergeFormDraft(old,{pending:{requestId:'new'}}).pending.requestId,'new');
});
test('policy metadata preserves the original revision, detects changes and never fabricates old versions',()=>{
 const s=memory(),versions=[{scope:'GLOBAL',revision:1},{scope:'ROLE:SALES',revision:2}];
 writeDraft(s,'a',{note:'x'},100,{policyVersions:versions});assert.deepEqual(draftPolicyVersion(s,'a'),versions);
 assert.equal(policyVersionChanged(versions,[...versions].reverse()),false);assert.equal(policyVersionChanged(versions,[{scope:'GLOBAL',revision:2}]),true);
 assert.equal(policyVersionChanged(null,versions),false);writeDraft(s,'legacy',{note:'x'},100);assert.equal(draftPolicyVersion(s,'legacy'),null);
});
