import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateDigitalOutlet,durableDigitalResult} from '../../src/modules/outlets/services/outlet-digital-evaluator.service.js';
import {knownPoint,outletEvidenceCurrent,outletIssues,fieldTaskGaps} from '../../../shared/outlet-validation.mjs';
import {calculateDistanceMeters} from '../../src/utils/geolocation.js';
import {searchGoogleOutlet} from '../../src/modules/outlets/services/google-outlet-search.service.js';
const o={name:'Toko Sumber Berkah',address:'Jl Melati No 12, Kota Bandung',latitude:null,longitude:null,clusterId:'cluster'};
const c={placeId:'a',detailsConfirmed:true,name:o.name,address:o.address,latitude:-6.9,longitude:107.6,businessStatus:'OPERATIONAL',city:'Kota Bandung'};
const steps=[{kind:'TEXT',state:'SUCCESS',called:true}];
test('missing and suspect master coordinates do not veto trustworthy identity',()=>{
 assert.equal(evaluateDigitalOutlet(o,[c],steps).code,'STRONG');
 const result=evaluateDigitalOutlet({...o,latitude:0,longitude:0,source:'IMPORT'},[c],steps);
 assert.equal(result.code,'STRONG');assert.equal(result.aligned,false);assert.ok(result.candidates[0].distanceMeters>5000);
 assert.equal(knownPoint({latitude:0,longitude:0}),true);assert.equal(calculateDistanceMeters(null,null,0,0),null);
});
test('same name branches, house number, city and phone conflicts never become strong',()=>{
 for(const candidate of [{...c,name:'Toko Sumber Berkah 2'},{...c,address:'Jl Melati No 13, Kota Bandung'},{...c,city:'Kabupaten Bogor'},{...c,phone:'08111',businessStatus:'CLOSED_PERMANENTLY'}]){
  const result=evaluateDigitalOutlet({...o,name:candidate.name.includes('2')?'Toko Sumber Berkah 1':o.name,phone:'08222'},[candidate],steps);assert.notEqual(result.code,'STRONG');assert.ok(result.candidates[0].conflicts.length+result.candidates[0].hardConflicts.length);
 }
 assert.equal(evaluateDigitalOutlet(o,[c,{...c,placeId:'b'}],steps).code,'AMBIGUOUS');
});
test('address geocode and generic name are not a verified outlet; technical failure is distinct from empty',()=>{
 assert.equal(evaluateDigitalOutlet(o,[],[{kind:'GEOCODE',state:'SUCCESS'}]).code,'ADDRESS_ONLY');
 assert.equal(evaluateDigitalOutlet({...o,name:'Toko'},[c],steps).code,'REVIEW');
 assert.equal(evaluateDigitalOutlet(o,[],[{state:'EMPTY'}]).code,'NOT_FOUND');
 assert.equal(evaluateDigitalOutlet(o,[],[{state:'ERROR'}]).code,'ERROR');
 const partial=evaluateDigitalOutlet(o,[c],[...steps,{state:'ERROR'}]);assert.equal(partial.code,'STRONG');assert.equal(partial.technical,'PARTIAL');
});
test('provider content is separated from durable audit; provider cache never exceeds 30 days',()=>{
 const result=evaluateDigitalOutlet(o,[c],steps,{OUTLET_REVIEW_EVIDENCE_DAYS:0});assert.equal(result.expiresAt,null);
 assert.ok(Date.parse(result.providerExpiresAt)-Date.now()<=30*86400000);
 const durable=durableDigitalResult(result);assert.equal(durable.candidates,undefined);assert.equal(JSON.stringify(durable).includes(c.address),false);assert.equal(JSON.stringify(durable).includes('107.6'),false);
});
test('field proof currentness and readiness reject stale identity, denied and foreign reviewer',()=>{
 const run={snapshot:o,result:{expiresAt:new Date(Date.now()+10000).toISOString()}};
 assert.equal(outletEvidenceCurrent(run,o),true);assert.equal(outletEvidenceCurrent(run,{...o,name:'Changed'}),false);
 assert.deepEqual(outletIssues(o),['MISSING_POINT']);
 const sales={id:'s',role:'SALES',supervisorId:'v',permissions:{can_submit_outlet_field:true}},reviewer={id:'v',role:'SUPERVISOR',permissions:{can_review_outlet_field:true}},task={id:'t',ownerId:'s',reviewerId:'v'};
 assert.equal(fieldTaskGaps([{...task,review:{outlet:{cluster:{supervisorId:'other'}}}}],[sales,reviewer]).length,1);
 assert.equal(fieldTaskGaps([task],[sales,reviewer]).length,0);assert.equal(fieldTaskGaps([task],[{...sales,supervisorId:'other'},reviewer]).length,1);
});
test('adaptive Google queries never bias missing/suspect coordinates and enforce call caps',async()=>{
 const calls=[],fetcher=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({places:[{id:'a',displayName:{text:c.name},formattedAddress:c.address,location:{latitude:c.latitude,longitude:c.longitude}}]})};};
 const result=await searchGoogleOutlet({...o,latitude:0,longitude:0,source:'IMPORT'},'fixture-key',{OUTLET_REVIEW_MAX_CALLS:2},{},fetcher);
 assert.equal(calls.length,2);assert.equal(JSON.parse(calls[0].options.body).locationBias.circle,undefined);assert.ok(JSON.parse(calls[0].options.body).locationBias.rectangle);assert.equal(JSON.parse(calls[0].options.body).regionCode,'ID');assert.ok(calls[0].options.headers['X-Goog-FieldMask']);assert.equal(result.candidates.length,1);assert.ok(result.steps.some(s=>s.state==='SKIPPED'));
});
test('Google malformed/failed response remains a technical problem with no fabricated candidates',async()=>{
 const result=await searchGoogleOutlet(o,'fixture-key',{OUTLET_REVIEW_MAX_CALLS:2},{},async()=>({ok:true,json:async()=>({places:{bad:'payload'}})}));
 assert.equal(result.candidates.length,0);assert.ok(result.steps.some(s=>s.state==='ERROR'));
});

test('quality flags catch legacy names and area-only addresses; field confirmation is bound to current master',()=>{
 for(const address of ['Cimahi','Padalarang','Kota Cimahi','Padalarang, Kabupaten Bandung Barat, Jawa Barat','Jl Melati'])assert.deepEqual(outletIssues({name:'Usman',address}),['MISSING_POINT','UNCLEAR_NAME','INCOMPLETE_ADDRESS']);
 const verified={name:'Usman',address:'Kota Cimahi',latitude:-6.9,longitude:107.6,locationEvidence:{source:'FIELD'},validationDetails:{qualityConfirmed:{source:'FIELD',name:'Usman',address:'Kota Cimahi'}}};
 assert.deepEqual(outletIssues(verified),[]);
 assert.ok(outletIssues({...verified,name:'Unknown'}).includes('UNCLEAR_NAME'));
 assert.ok(outletIssues({...verified,validationDetails:{...verified.validationDetails,stale:true}}).includes('INCOMPLETE_ADDRESS'));
 assert.ok(outletIssues({...verified,latitude:null,longitude:null}).includes('MISSING_POINT'));
 assert.deepEqual(outletIssues({...o,name:'Toko Usman'}),['MISSING_POINT']);
});

test('validation carry awaiting SPV does not invent another planned or actual visit',async()=>{
 const {countsAsPlannedVisit,visitSalesResult,summarizeVisits}=await import('../../../shared/visit-metrics.mjs');
 for(const state of ['WAITING_REVIEW','ACCEPTED','RESOLVED','CANCELLED','REASSIGNED']){
  const stop={status:'PENDING',validationOnly:true,validationResult:{state}};
  assert.equal(countsAsPlannedVisit(stop),false);assert.equal(visitSalesResult(stop).actual,false);assert.equal(summarizeVisits([stop]).total,0);
 }
 const proof={status:'VISITED',validationOnly:true,validationResult:{state:'WAITING_REVIEW',submittedAt:new Date().toISOString()}};
 assert.equal(countsAsPlannedVisit(proof),true);assert.equal(visitSalesResult(proof).actual,true);assert.equal(visitSalesResult(proof).effective,false);
 assert.equal(countsAsPlannedVisit({validationOnly:false,validationResult:{state:'WAITING_REVIEW'}}),true);
});
