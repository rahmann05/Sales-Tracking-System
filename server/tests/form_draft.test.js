import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readDraft,writeDraft,DRAFT_TTL} from '../../shared/form-draft.mjs';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
test('draft survives reload and is isolated by account and task',()=>{const s=memory();assert.equal(writeDraft(s,'sales-1:order:stop-1',{code:'SO-123',items:[{id:'p',quantity:3}]},100),true);assert.equal(readDraft(s,'sales-2:order:stop-1',101),null);assert.equal(readDraft(s,'sales-1:order:stop-2',101),null);assert.equal(readDraft(s,'sales-1:order:stop-1',101).items[0].quantity,3);});
test('expired normal drafts and corrupted storage are ignored',()=>{const s=memory();writeDraft(s,'a',{note:'old'},100);assert.equal(readDraft(s,'a',101+DRAFT_TTL),null);s.setItem('a','broken');assert.equal(readDraft(s,'a'),null);});
test('unconfirmed submission identity remains recoverable beyond ordinary draft expiry',()=>{const s=memory();const pending={requestId:'same-request',outletName:'Toko',gpsLocation:{lat:-6.9,lng:107.6}};writeDraft(s,'a',{pending},100);assert.deepEqual(readDraft(s,'a',101+DRAFT_TTL).pending,pending);});
test('storage quota or disabled storage returns a recoverable failure',()=>{assert.equal(writeDraft({setItem(){throw new Error('quota');}},'a',{note:'x'}),false);assert.equal(readDraft({getItem(){throw new Error('disabled');}},'a'),null);});
