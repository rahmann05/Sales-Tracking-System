import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OUTLET_DIGITAL_VERSION} from '../../../shared/outlet-validation.mjs';
import {outletDigitalReadiness,outletDigitalRejectionMessage} from '../../../shared/outlet-digital-readiness.mjs';

const now=Date.parse('2026-10-10T08:00:00Z');
const outlet={name:'Toko Sumber Berkah',address:'Jl Melati No 12, Kota Bandung',latitude:-6.9,longitude:107.6,clusterId:'bandung',phone:null};
const future=new Date(now+86400000).toISOString(),past=new Date(now-1000).toISOString();
const run=()=>({snapshot:{...outlet},providerContent:{candidates:[{placeId:'place'}]},providerExpiresAt:future,result:{version:OUTLET_DIGITAL_VERSION,code:'STRONG',selectedPlaceId:'place',expiresAt:future,providerExpiresAt:future}});
const ready=(r,o=outlet,options={})=>outletDigitalReadiness(r,o,{now,...options});
const codes=r=>ready(r).issues.map(i=>i.code);

test('only current strong results allow a new confirmation, with Date and ISO expiry',()=>{
 const r=run();assert.equal(ready(r).canConfirm,true);assert.equal(ready(r).current,true);
 r.providerExpiresAt=new Date(future);assert.equal(ready(r).canConfirm,true);
 r.result.expiresAt=null;assert.equal(ready(r).canConfirm,true);
 assert.equal(ready(r,outlet,{placeId:'place'}).canConfirm,true);
});
test('no result explains the missing check without claiming expiry or old rules',()=>{
 const result=ready(undefined);assert.deepEqual(result.issues.map(i=>i.code),['GOOGLE_NOT_CHECKED']);
 assert.match(result.issues[0].action,/Periksa dengan Google/);assert.equal(result.canConfirm,false);
});
test('master changes identify exact fields, including both coordinate changes without repeated labels',()=>{
 const r=run(),result=ready(r,{...outlet,name:'Toko lain',address:'Jl Mawar 14',latitude:0,longitude:0});
 assert.deepEqual(result.issues[0].fields,['name','address','latitude','longitude']);
 assert.match(result.issues[0].message,/nama outlet, alamat, titik koordinat/);
 assert.equal(result.issues[0].message.match(/titik koordinat/g).length,1);
 assert.equal(result.canConfirm,false);
 assert.equal(ready(r,{...outlet,radiusMeters:100}).canConfirm,true);
});
test('legacy assessment and missing snapshot have distinct causes',()=>{
 const r=run();r.result.version='legacy';delete r.snapshot;
 assert.deepEqual(codes(r),['EVALUATION_METHOD_CHANGED','MASTER_SNAPSHOT_MISSING']);
 assert.doesNotMatch(outletDigitalRejectionMessage(ready(r)),/Data master berubah/);
});
test('malformed historical JSON is explained without crashing the readiness check',()=>{
 const r=run();r.snapshot=[];r.result={version:'legacy',code:'REVIEW',assessments:{},candidates:{},steps:{},reasons:{}};
 assert.deepEqual(codes(r),['EVALUATION_METHOD_CHANGED','MASTER_SNAPSHOT_MISSING','MATCH_NOT_STRONG']);
 r.result.steps=[null,{state:'ERROR',error:'MAP_TIMEOUT'}];assert.match(outletDigitalRejectionMessage(ready(r)),/tidak merespons/);
});
test('an otherwise strong partial result remains eligible under the existing decision rules',()=>{
 const r=run();r.result.technical='PARTIAL';r.result.steps=[{state:'ERROR',error:'MAP_TIMEOUT'}];
 assert.equal(ready(r).canConfirm,true);
});
test('assessment expiry has its own dated reason and does not claim cache expiry',()=>{
 const r=run();r.result.expiresAt=past;
 const result=ready(r);assert.deepEqual(result.issues.map(i=>i.code),['ASSESSMENT_EXPIRED']);
 assert.match(result.issues[0].message,/WIB/);assert.equal(result.issues[0].expiredAt,past);
 r.result.expiresAt='invalid';assert.deepEqual(codes(r),['ASSESSMENT_VALIDITY_UNKNOWN']);
});
test('expired cache retains its exact reason after provider content is purged',()=>{
 const r=run();r.providerExpiresAt=past;r.result.providerExpiresAt=past;
 assert.deepEqual(codes(r),['GOOGLE_CACHE_EXPIRED']);
 r.providerContent=null;r.providerExpiresAt=null;
 assert.deepEqual(codes(r),['GOOGLE_CACHE_EXPIRED']);
 assert.equal(ready(r).issues[0].expiredAt,past);
});
test('unavailable cache and unrecorded cache expiry do not invent a date',()=>{
 const r=run();r.providerContent=null;assert.deepEqual(codes(r),['GOOGLE_CACHE_UNAVAILABLE']);
 r.providerContent={candidates:[]};r.providerExpiresAt=null;assert.deepEqual(codes(r),['GOOGLE_CACHE_VALIDITY_UNKNOWN']);
 r.providerExpiresAt='invalid';assert.deepEqual(codes(r),['GOOGLE_CACHE_VALIDITY_UNKNOWN']);
});
test('all non-strong outcomes explain their own cause and next action',()=>{
 const expected={AMBIGUOUS:'CANDIDATES_AMBIGUOUS',ADDRESS_ONLY:'ONLY_ADDRESS_FOUND',NOT_FOUND:'OUTLET_NOT_FOUND',ERROR:'GOOGLE_CHECK_FAILED',INCOMPLETE:'SEARCH_INFORMATION_INCOMPLETE',REVIEW:'MATCH_NOT_STRONG',OTHER:'ASSESSMENT_INCOMPLETE'};
 for(const [code,issue] of Object.entries(expected)){
  const r=run();r.result.code=code;r.result.reasons=['Nomor alamat berbeda'];
  const result=ready(r);assert.equal(result.current,true);assert.equal(result.canConfirm,false);
  assert.deepEqual(result.issues.map(i=>i.code),[issue]);assert.ok(result.issues[0].action);
  assert.match(outletDigitalRejectionMessage(result),/Nomor alamat berbeda/);
 }
});
test('weak matching gives the stored threshold and comparison, without altering the assessment',()=>{
 const r=run();r.result={...r.result,code:'REVIEW',reasons:['Nomor alamat berbeda'],assessments:[{placeId:'place',nameScore:70,addressScore:65}],comparisonPolicy:{strongName:90,strongAddress:80}};
 const before=JSON.stringify(r),details=ready(r).issues[0].details;
 assert.ok(details.includes('Kemiripan nama 70%, di bawah batas konfirmasi 90% pada pemeriksaan ini.'));
 assert.ok(details.includes('Kemiripan alamat 65%, di bawah batas konfirmasi 80% pada pemeriksaan ini.'));
 assert.equal(JSON.stringify(r),before);
});
test('service failures translate known errors without exposing arbitrary provider output',()=>{
 const r=run();r.result.code='ERROR';r.result.steps=[{state:'ERROR',error:'MAP_TIMEOUT'},{state:'ERROR',error:'MAP_TIMEOUT'},{state:'ERROR',error:'Kunci Google pada server belum tersedia'},{state:'ERROR',error:'sensitive response'},{state:'SKIPPED',reason:'Batas panggilan tercapai'}];
 const message=outletDigitalRejectionMessage(ready(r));
 assert.match(message,/tidak merespons/);assert.match(message,/Kunci Google pada server belum tersedia/);
 assert.match(message,/batas panggilan per pemeriksaan/);assert.doesNotMatch(message,/sensitive response/);
 assert.equal(message.match(/tidak merespons/g).length,1);
});
test('missing and changed candidates have distinct reasons',()=>{
 const r=run();delete r.result.selectedPlaceId;assert.deepEqual(codes(r),['GOOGLE_CANDIDATE_MISSING']);
 r.result.selectedPlaceId='place';const result=ready(r,outlet,{placeId:'other'});
 assert.deepEqual(result.issues.map(i=>i.code),['GOOGLE_CANDIDATE_CHANGED']);assert.equal(result.current,true);
});
test('simultaneous blockers are all reported but the shared recheck action appears once in API text',()=>{
 const r=run();r.result.version='legacy';r.result.expiresAt=past;r.providerExpiresAt=past;r.snapshot.name='Old';
 const result=ready(r);assert.deepEqual(result.issues.map(i=>i.code),['EVALUATION_METHOD_CHANGED','MASTER_CHANGED','ASSESSMENT_EXPIRED','GOOGLE_CACHE_EXPIRED']);
 assert.equal(outletDigitalRejectionMessage(result).match(/Klik “Periksa dengan Google”/g).length,1);
});
