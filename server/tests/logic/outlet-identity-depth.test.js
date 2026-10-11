import {test} from 'node:test';
import assert from 'node:assert/strict';
import {outletIssues,canOpenOutletReview,OUTLET_DIGITAL_VERSION} from '../../../shared/outlet-validation.mjs';
import {evaluateDigitalOutlet,durableDigitalResult} from '../../src/modules/outlets/services/outlet-digital-evaluator.service.js';
import {searchGoogleOutlet} from '../../src/modules/outlets/services/google-outlet-search.service.js';
import {adminOutletDecisionReadiness} from '../../../shared/outlet-admin-decision.mjs';
import {candidateIdentityFacts} from '../../src/modules/outlets/services/outlet-identity-evidence.service.js';
const master={name:'INDOMARET FRESH GUNUNG BATU',address:'Sukaraja Cicendo Kota Bandung Jawa Barat',latitude:-6.889808,longitude:107.569918,source:'IMPORT',cluster:{region:'Bandung'}};
const a={placeId:'branch61',name:'Indomaret Gunung Batu 61',address:'Jl Gunung Batu No 61, Sukaraja, Kota Bandung',city:'Kota Bandung',latitude:-6.891966,longitude:107.562491,detailsConfirmed:true,types:['store','establishment'],businessStatus:'OPERATIONAL'};
const b={...a,placeId:'branch69',name:'Indomaret Gunung Batu 69',address:'Jl Gunung Batu No 69, Sukaraja, Kota Bandung',latitude:master.latitude,longitude:master.longitude};
const admin={role:'ADMIN',permissions:{can_apply_outlet_review:true}};
const steps=[{kind:'DETAILS',state:'SUCCESS'}];
const run=(outlet,candidates)=>{const r=evaluateDigitalOutlet(outlet,candidates,steps);return {result:durableDigitalResult(r),snapshot:outlet,providerContent:{candidates:r.candidates},providerExpiresAt:r.providerExpiresAt};};
const payload=c=>({id:c.placeId,displayName:{text:c.name},formattedAddress:c.address,location:{latitude:c.latitude,longitude:c.longitude},businessStatus:c.businessStatus,types:c.types});

test('names from the reported master table are flagged; business names and verified field evidence remain usable',()=>{
 for(const name of ['Pak Mustori','Pak Yadi','Pd Berkah','Risky Jaya','Rizki Irma','Usman','Nama Orang Empat Kata','Toko 123','Tk.','Indomaret','Pak Toko'])assert.ok(outletIssues({...master,name}).includes('UNCLEAR_NAME'),name);
 for(const name of ['BORMA DAGO','Borma Kiaracondong','Grand Yogya Kepatihan','INDOMARET FRESH DJUNJUNAN 166','Toko Usman'])assert.ok(!outletIssues({...master,name}).includes('UNCLEAR_NAME'),name);
 const o={...master,name:'Pak Yadi',address:a.address,locationEvidence:{source:'FIELD'},validationDetails:{qualityConfirmed:{source:'FIELD',name:'Pak Yadi',address:a.address}}};
 assert.ok(!outletIssues(o).includes('UNCLEAR_NAME'));
 assert.ok(outletIssues({...o,name:'Pak Lain'}).includes('UNCLEAR_NAME'));
 const old={...o,validationDetails:{qualityConfirmed:{source:'ADMIN_DIGITAL',name:o.name,address:o.address,version:'legacy'}}};assert.ok(outletIssues(old).includes('UNCLEAR_NAME'));
 assert.ok(!outletIssues({...old,validationDetails:{qualityConfirmed:{...old.validationDetails.qualityConfirmed,version:OUTLET_DIGITAL_VERSION}}}).includes('UNCLEAR_NAME'));
});
test('Admin can open unflagged outlets; SPV requires flags; other roles cannot open cases',()=>{
 const o={...master,name:'Toko Melati',address:a.address,source:'REGISTRATION'};
 assert.deepEqual(outletIssues(o),[]);assert.equal(canOpenOutletReview(o,admin),true);assert.equal(canOpenOutletReview(o,{role:'SUPERVISOR'}),false);
 assert.equal(canOpenOutletReview({...o,name:'Pak Yadi'},{role:'SUPERVISOR'}),true);assert.equal(canOpenOutletReview({...o,name:'Pak Yadi'},{role:'SALES'}),false);
});
test('same-brand branches and generic area remain unresolved for Admin despite score or imported proximity',()=>{
 for(const chosen of [undefined,'branch61','branch69']){
  const r=evaluateDigitalOutlet(master,[a,b],steps,{},chosen);assert.equal(r.code,'AMBIGUOUS');assert.equal(r.identityReview.resolved,false);assert.equal(r.identityReview.competingPlaceIds.length,1);
  assert.equal(adminOutletDecisionReadiness({...run(master,[a,b]),result:durableDigitalResult(r)},master,admin,{OUTLET_REVIEW_ADMIN_ALLOW_AMBIGUOUS:true,OUTLET_REVIEW_ADMIN_ALLOW_CONFLICTS:true}).canConfirm,false);
 }
});
test('a unique branch identifier or complete matching address can resolve branch ambiguity',()=>{
 for(const outlet of [{...master,name:'Indomaret Gunung Batu 61',address:a.address},{...master,address:a.address}]){
  const r=evaluateDigitalOutlet(outlet,[b,a],steps);assert.equal(r.selectedPlaceId,'branch61');assert.equal(r.identityReview.resolved,true);assert.ok(r.identityReview.supports.length);
 }
});
test('same address / same phone used by multiple candidates is not a unique discriminator',()=>{
 const outlet={...master,name:a.name,address:a.address,phone:'081234567890'};
 const r=evaluateDigitalOutlet(outlet,[{...a,phone:outlet.phone},{...a,placeId:'duplicate-profile',phone:outlet.phone}],steps);
 assert.equal(r.identityReview.resolved,false);assert.equal(r.code,'AMBIGUOUS');
});
test('missing alternative phone details must not be treated as a mismatching phone',()=>{
 const outlet={...master,phone:'081234567890'};
 assert.equal(evaluateDigitalOutlet(outlet,[{...a,phone:outlet.phone},{...b,detailsConfirmed:false}],steps).identityReview.resolved,false);
 const resolved=evaluateDigitalOutlet(outlet,[{...a,phone:outlet.phone},{...b,phone:'081299999999'}],steps);assert.ok(resolved.identityReview.supports.includes('phone'));
});
test('unknown alternative address/branch is not negative evidence',()=>{
 const outlet={...master,name:a.name,address:a.address};
 const unknown={...a,placeId:'unknown',name:'Indomaret Gunung Batu',address:'Sukaraja Kota Bandung'};
 const r=evaluateDigitalOutlet(outlet,[a,unknown],steps);assert.equal(r.identityReview.resolved,false);
});
test('a person name discovered at a point is not automatically the correct store',()=>{
 const outlet={...master,name:'Pak Yadi'};
 const c={...b,name:'Toko Yadi'};
 const r=evaluateDigitalOutlet(outlet,[c],steps);assert.equal(r.identityReview.resolved,false);assert.equal(adminOutletDecisionReadiness(run(outlet,[c]),outlet,admin).canConfirm,false);
 const field={...outlet,locationEvidence:{source:'FIELD',accuracyMeters:15}};assert.equal(evaluateDigitalOutlet(field,[c],steps).identityReview.resolved,true);
 for(const accuracyMeters of [null,undefined,101,100000,NaN])assert.equal(evaluateDigitalOutlet({...field,locationEvidence:{source:'FIELD',accuracyMeters}},[c],steps).identityReview.resolved,false);
});
test('GPS uncertainty crossing the identity boundary is unknown, not a match or exclusion',()=>{
 const outlet={...master,locationEvidence:{source:'FIELD',accuracyMeters:20}};
 for(const [distanceMeters,expected] of [[79,true],[80,true],[81,null],[119,null],[120,null],[121,false]])assert.equal(candidateIdentityFacts(outlet,{...a,distanceMeters}).trustedGps,expected);
});
test('a new GPS source or accuracy invalidates a prior GPS identity decision even at the same coordinates',()=>{
 const outlet={...master,name:'Pak Yadi',locationEvidence:{source:'FIELD',accuracyMeters:15,capturedAt:'2026-10-11T00:00:00.000Z'}};
 const r=run(outlet,[{...b,name:'Toko Yadi'}]);
 assert.ok(r.result.identityReview.supports.includes('trustedGps'));
 for(const locationEvidence of [{...outlet.locationEvidence,accuracyMeters:500},{...outlet.locationEvidence,source:'MANUAL'},{...outlet.locationEvidence,capturedAt:'2026-10-11T01:00:00.000Z'}])assert.ok(adminOutletDecisionReadiness(r,{...outlet,locationEvidence},admin).issues.some(i=>i.code==='GPS_IDENTITY_EVIDENCE_CHANGED'));
});
test('text search and location discovery are independent and unioned even when text already found a branch',async()=>{
 const calls=[];const result=await searchGoogleOutlet(master,'fixture',{OUTLET_REVIEW_MAX_CALLS:6},{},async(url,options)=>{
  calls.push({url,body:options?.body&&JSON.parse(options.body)});
  return {ok:true,json:async()=>url.includes(':searchNearby')?{places:[payload(b)]}:url.includes(':searchText')?{places:[payload(a)]}:payload(url.includes('branch69')?b:a)};
 });
 assert.ok(calls.length<=6);assert.ok(calls.some(c=>c.url.includes(':searchNearby')));assert.equal(calls.find(c=>c.url.includes(':searchNearby')).body.locationRestriction.circle.center.latitude,master.latitude);
 assert.ok(calls.filter(c=>c.url.includes(':searchText')).every(c=>!c.body.locationBias.circle));assert.equal(result.candidates.length,2);
 assert.equal(evaluateDigitalOutlet(master,result.candidates,result.steps).identityReview.resolved,false);
});
test('unclear name triggers business-at-address search even if a personal-name query has results',async()=>{
 const bodies=[];await searchGoogleOutlet({...master,name:'Pak Yadi'},'fixture',{OUTLET_REVIEW_MAX_CALLS:6},{},async(url,options)=>{
  if(options?.body)bodies.push(JSON.parse(options.body));return {ok:true,json:async()=>url.includes(':search')?{places:[payload(a)]}:payload(a)};
 });assert.ok(bodies.some(body=>body.textQuery?.startsWith('toko ')));assert.ok(bodies.some(body=>body.locationRestriction));
});
test('candidate recheck retains alternatives that disappeared from the new search',async()=>{
 const result=await searchGoogleOutlet(master,'fixture',{OUTLET_REVIEW_MAX_CALLS:4},{},async url=>({ok:true,json:async()=>url.includes(':search')?{places:[payload(a)]}:payload(url.includes('branch69')?b:a)}),'branch61',[a,b]);
 assert.equal(result.candidates.length,2);assert.ok(result.candidates.some(c=>c.placeId==='branch69'));assert.equal(evaluateDigitalOutlet(master,result.candidates,result.steps,{},'branch61').identityReview.resolved,false);
});
test('fresh descriptions are required for Admin decisions after a process loses its transient descriptions',()=>{
 const r=run({...master,name:a.name,address:a.address},[a]);r.providerContent.candidates[0].descriptionAvailable=false;
 assert.ok(adminOutletDecisionReadiness(r,r.snapshot,admin).issues.some(i=>i.code==='GOOGLE_DESCRIPTION_UNAVAILABLE'));
});
test('incomplete required discovery cannot auto-close an otherwise aligned outlet',()=>{
 const outlet={...master,name:a.name,address:a.address,latitude:a.latitude,longitude:a.longitude,locationEvidence:{source:'FIELD'}};
 const r=evaluateDigitalOutlet(outlet,[a,{...b,address:'Jl Gunung Batu No 69, Kota Bandung'}],[...steps,{kind:'NEARBY',strategy:'POINT_BUSINESSES',state:'SKIPPED'}]);
 assert.equal(r.identityReview.comparisonIncomplete,true);assert.notEqual(r.code,'STRONG');assert.equal(r.aligned,false);
 assert.equal(adminOutletDecisionReadiness({result:durableDigitalResult(r),snapshot:outlet,providerContent:{candidates:r.candidates},providerExpiresAt:r.providerExpiresAt},outlet,admin).canConfirm,false);
});
test('provider failure cannot turn preserved candidates into fresh evidence',()=>{
 const outlet={...master,name:a.name,address:a.address};
 const r=evaluateDigitalOutlet(outlet,[{...a,refreshed:false,detailsConfirmed:false}],[{kind:'TEXT',state:'ERROR',error:'MAP_HTTP_ERROR'}]);
 assert.equal(r.code,'ERROR');assert.equal(r.identity,'UNCONFIRMED');assert.equal(r.aligned,false);
});
