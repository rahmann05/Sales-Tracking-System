import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateDigitalOutlet,durableDigitalResult} from '../../src/modules/outlets/services/outlet-digital-evaluator.service.js';
import {searchGoogleOutlet} from '../../src/modules/outlets/services/google-outlet-search.service.js';
import {adminOutletDecisionReadiness} from '../../../shared/outlet-admin-decision.mjs';
const outlet={name:'Toko Sumber Berkah',address:'Jl Melati No 12, Kota Bandung',latitude:-6.9,longitude:107.6,clusterId:'cluster',cluster:{region:'Bandung'}};
const candidate={placeId:'good',name:outlet.name,address:outlet.address,latitude:-6.9001,longitude:107.6,detailsConfirmed:true,businessStatus:'OPERATIONAL',city:'Kota Bandung',types:['store','establishment']};
const admin={role:'ADMIN',permissions:{can_apply_outlet_review:true}},steps=[{kind:'DETAILS',state:'SUCCESS'}];
const makeRun=(candidates=[candidate],master=outlet)=>{const result=evaluateDigitalOutlet(master,candidates,steps);return {snapshot:{...master},result:durableDigitalResult(result),providerExpiresAt:result.providerExpiresAt,providerContent:{candidates:result.candidates}};};
const payload=c=>({id:c.placeId,displayName:{text:c.name},formattedAddress:c.address,location:{latitude:c.latitude,longitude:c.longitude},businessStatus:c.businessStatus,types:c.types,addressComponents:[{longText:c.city,types:['administrative_area_level_2']}]});

test('details must be explicitly confirmed, duplicate place IDs are not competing evidence',()=>{
 assert.equal(evaluateDigitalOutlet(outlet,[{...candidate,detailsConfirmed:undefined}],steps).code,'REVIEW');
 assert.equal(evaluateDigitalOutlet(outlet,[candidate,candidate],steps).code,'STRONG');
 assert.equal(evaluateDigitalOutlet(outlet,[candidate,candidate],steps).candidates.length,1);
});
test('closed or conflicting candidates cannot outrank a complete compatible recommendation',()=>{
 const closed={...candidate,placeId:'closed',businessStatus:'CLOSED_PERMANENTLY'};
 const result=evaluateDigitalOutlet(outlet,[closed,candidate],steps);
 assert.equal(result.recommendedPlaceId,'good');assert.equal(result.selectedPlaceId,'good');assert.equal(result.code,'STRONG');
 const conflict={...candidate,placeId:'wrong-house',address:'Jl Melati No 13, Kota Bandung'};
 assert.equal(evaluateDigitalOutlet(outlet,[conflict,candidate],steps).code,'STRONG');
 assert.equal(evaluateDigitalOutlet(outlet,[closed],steps).recommendedPlaceId,null);
});
test('trusted GPS divergence is a conflict, imported coordinates only inform comparison',()=>{
 const changed={...outlet,latitude:0,longitude:0};
 const trusted=evaluateDigitalOutlet({...changed,locationEvidence:{source:'FIELD'}},[candidate],steps);
 assert.equal(trusted.code,'REVIEW');assert.match(trusted.reasons.join(' '),/GPS lapangan terpercaya/);
 assert.equal(evaluateDigitalOutlet({...changed,source:'IMPORT'},[candidate],steps).code,'STRONG');
});
test('city and regency of the same name remain distinct, malformed phone is not strong corroboration',()=>{
 const result=evaluateDigitalOutlet(outlet,[{...candidate,city:'Kabupaten Bandung'}],steps);assert.equal(result.code,'REVIEW');assert.match(result.reasons.join(' '),/Kota\/kabupaten/);
 assert.equal(evaluateDigitalOutlet({...outlet,phone:'123'},[{...candidate,phone:'123'}],steps).candidates[0].phoneMatch,null);
});
test('address-only places never become confirmed businesses',()=>{
 const result=evaluateDigitalOutlet(outlet,[{...candidate,types:['route','geocode']}],steps);
 assert.equal(result.code,'REVIEW');assert.equal(result.recommendedPlaceId,null);
 assert.equal(adminOutletDecisionReadiness(makeRun([{...candidate,types:['route']}]),outlet,admin).canConfirm,false);
});
test('default Admin review accepts ambiguity deliberately and retains original scoring',()=>{
 const run=makeRun([candidate,{...candidate,placeId:'alternative'}]);
 assert.equal(run.result.code,'AMBIGUOUS');assert.equal(adminOutletDecisionReadiness(run,outlet,admin).canConfirm,true);
 assert.equal(run.result.code,'AMBIGUOUS');
 assert.equal(adminOutletDecisionReadiness(run,outlet,{...admin,role:'SUPERVISOR'}).canConfirm,false);
 assert.equal(adminOutletDecisionReadiness(run,outlet,{...admin,permissions:{}}).canConfirm,false);
 for(const values of [{OUTLET_REVIEW_ADMIN_ENABLED:false},{OUTLET_REVIEW_ADMIN_ALLOW_AMBIGUOUS:false}])assert.equal(adminOutletDecisionReadiness(run,outlet,admin,values).canConfirm,false);
});
test('Admin thresholds, conflicts, changed selection and incomplete/expired evidence are enforced',()=>{
 const run=makeRun([{...candidate,address:'Jl Melati No 13, Kota Bandung'}]);
 assert.equal(adminOutletDecisionReadiness(run,outlet,admin).canConfirm,false);
 assert.equal(adminOutletDecisionReadiness(run,outlet,admin,{OUTLET_REVIEW_ADMIN_ALLOW_CONFLICTS:true}).canConfirm,true);
 assert.equal(adminOutletDecisionReadiness(makeRun(),outlet,admin,{}, {placeId:'foreign'}).canConfirm,false);
 for(const patch of [{businessStatus:'CLOSED_TEMPORARILY'},{movedPlaceId:'new'},{latitude:null},{detailsConfirmed:false}])assert.equal(adminOutletDecisionReadiness(makeRun([{...candidate,...patch}]),outlet,admin,{OUTLET_REVIEW_ADMIN_ALLOW_CONFLICTS:true}).canConfirm,false);
 const stale=makeRun();stale.providerExpiresAt=new Date(Date.now()-1000);assert.equal(adminOutletDecisionReadiness(stale,outlet,admin).canConfirm,false);
 assert.equal(adminOutletDecisionReadiness(makeRun(),{...outlet,name:'Changed'},admin).canConfirm,false);
 const low=makeRun([{...candidate,name:'CV Laut Selatan',address:'Jl Mawar Raya, Kota Bandung'}]);
 assert.equal(adminOutletDecisionReadiness(low,outlet,admin,{OUTLET_REVIEW_ADMIN_NAME_PERCENT:100,OUTLET_REVIEW_ADMIN_ADDRESS_PERCENT:100}).canConfirm,false);
 const legacy={...outlet,name:'Usman',address:'Cimahi'};
 const named={...candidate,name:'Toko Usman',address:'Jl Melati No 12, Kota Cimahi',city:'Kota Cimahi'};
 const legacyRun=makeRun([named],legacy);assert.notEqual(legacyRun.result.code,'STRONG');
 assert.equal(adminOutletDecisionReadiness(legacyRun,legacy,admin).canConfirm,true);
});
test('detail calls are reserved within budget and the selected ID must match its response',async()=>{
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>String(url).includes(':searchText')?{places:[payload(candidate),payload({...candidate,placeId:'alt'})]}:{...payload(candidate),id:new URL(url).pathname.split('/').at(-1)}};};
 const result=await searchGoogleOutlet(outlet,'fixture',{OUTLET_REVIEW_MAX_CALLS:4},{},fetcher);
 assert.ok(calls.length<=4);assert.equal(calls.filter(c=>!c.url.includes(':searchText')).length,2);assert.equal(result.candidates.filter(c=>c.detailsConfirmed).length,2);
 const bad=await searchGoogleOutlet(outlet,'fixture',{OUTLET_REVIEW_MAX_CALLS:2},{},async url=>({ok:true,json:async()=>String(url).includes(':searchText')?{places:[payload(candidate)]}:{...payload(candidate),id:'different'}}));
 assert.ok(bad.steps.some(s=>s.error==='MAP_PLACE_ID_MISMATCH'));assert.notEqual(evaluateDigitalOutlet(outlet,bad.candidates,bad.steps).code,'STRONG');
});
test('untrusted coordinates never create a circle/reverse query; trusted points may add context',async()=>{
 for(const source of ['IMPORT','FIELD']){
  const calls=[];const master={...outlet,locationEvidence:{source}};
  await searchGoogleOutlet(master,'fixture',{OUTLET_REVIEW_MAX_CALLS:6},{},async(url,options)=>{calls.push({url,body:options?.body?JSON.parse(options.body):null});return {ok:true,json:async()=>url.includes(':searchText')?{places:[payload(candidate)]}:payload(candidate)};});
  assert.equal(calls.some(c=>c.body?.locationBias?.circle),source==='FIELD');
 }
});
test('access/quota errors stop follow-on billing and are distinguished from no results',async()=>{
 for(const status of [403,429]){
  let calls=0;const result=await searchGoogleOutlet(outlet,'fixture',{},{},async()=>{calls++;return {ok:false,status};});
  assert.equal(calls,1);assert.equal(evaluateDigitalOutlet(outlet,result.candidates,result.steps).code,'ERROR');
  assert.equal(result.steps.find(s=>s.state==='ERROR').error,status===403?'MAP_AUTHORIZATION_ERROR':'MAP_QUOTA_EXCEEDED');
 }
});
