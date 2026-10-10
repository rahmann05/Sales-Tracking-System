import 'dotenv/config';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {getDynamicConfig} from '../src/modules/config/config.service.js';
import {capturePolicySnapshot} from '../src/modules/config/services/process-policy.service.js';
import {outletComparisonPolicy} from '../src/modules/outlets/services/outlet-comparison-policy.service.js';
import {searchGoogleOutlet} from '../src/modules/outlets/services/google-outlet-search.service.js';
import {evaluateDigitalOutlet} from '../src/modules/outlets/services/outlet-digital-evaluator.service.js';
import {belfoodsGoogleSamples} from './fixtures/belfoods-google-samples.mjs';
import {fetchGoogleLegs} from '../src/modules/routing/googleDirectionsProvider.js';
assert.ok(process.argv.includes('--live'),'Explicit --live is required (billable Google calls).');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Use local database budget ledger only.');
const values=(await capturePolicySnapshot()).values,key=await getDynamicConfig('MAPS_API_KEY','')||config.googleMapsApiKey;
assert.ok(key,'Google server key is missing');
const {providerLimits}=await outletComparisonPolicy();
const report={at:new Date().toISOString(),dataset:'8 explicit historical Belfoods records; controlled variants are not historical truth',maximumCalls:48,actualCalls:0,results:[],failures:[]};
const realFetch=globalThis.fetch,routeSmokePoints=[];
const fetcher=async(url,options)=>{assert.ok(['places.googleapis.com','maps.googleapis.com','routes.googleapis.com'].includes(new URL(url).hostname));assert.ok(report.actualCalls<report.maximumCalls,'Call budget exceeded');report.actualCalls++;return realFetch(url,options);};
try{
 for(const sample of belfoodsGoogleSamples){
  const outlet={...sample,source:'IMPORT',locationEvidence:{source:'IMPORT'},phone:null,clusterId:'historical-sample',cluster:{region:'Bandung Jawa Barat'}};
  const search=await searchGoogleOutlet(outlet,key,{...values,OUTLET_REVIEW_MAX_CALLS:6},providerLimits,fetcher);
  const evaluate=o=>evaluateDigitalOutlet(o,search.candidates,search.steps,values);
  const result=evaluate(outlet),missing=evaluate({...outlet,latitude:null,longitude:null}),wrong=evaluate({...outlet,latitude:-6.2,longitude:106.8});
  const weak=evaluate({...outlet,name:'Usman',address:'Cimahi'});
  const row={id:sample.id,inputName:sample.name,code:result.code,technical:result.technical,placeId:result.selectedPlaceId,candidateCount:result.candidates.length,assessments:result.candidates.map(({placeId,nameScore,addressScore,phoneMatch,conflicts})=>({placeId,nameScore,addressScore,phoneMatch,conflicts})),steps:search.steps.map(({kind,strategy,state,called,error})=>({kind,strategy,state,called,error})),missingPointCode:missing.code,suspectPointCode:wrong.code,weakIdentityCode:weak.code};
  if(sample.expectReview&&result.code==='STRONG')report.failures.push(`${sample.id}: area-only address accepted`);
  if(weak.code==='STRONG')report.failures.push(`${sample.id}: weak identity accepted`);
  if(result.code!==missing.code||result.code!==wrong.code)report.failures.push(`${sample.id}: untrusted native point changed identity classification`);
  report.results.push(row);console.log(`${sample.id}: ${result.code} (${result.technical}), candidates=${result.candidates.length}`);
  if(result.code==='STRONG'){const p=result.candidates.find(c=>c.placeId===result.selectedPlaceId);routeSmokePoints.push({lat:p.latitude,lng:p.longitude});}
 }
 // Additional provider requests exercise the actual search path with incomplete/suspect inputs.
 const sample=belfoodsGoogleSamples[1],base={...sample,source:'IMPORT',phone:null,clusterId:'historical-sample',locationEvidence:{source:'IMPORT'},cluster:{region:'Bandung Jawa Barat'}};
 report.liveVariants=[];
 for(const [variant,changes,expectReview] of [['MISSING_POINT',{latitude:null,longitude:null},false],['SUSPECT_POINT',{latitude:-6.2,longitude:106.8},false],['GENERIC_NAME',{name:'Usman'},true],['WRONG_BRANCH',{name:sample.name+' Cabang 99'},true]]){
  const input={...base,...changes},search=await searchGoogleOutlet(input,key,{...values,OUTLET_REVIEW_MAX_CALLS:6},providerLimits,fetcher),result=evaluateDigitalOutlet(input,search.candidates,search.steps,values);
  report.liveVariants.push({id:sample.id,variant,code:result.code,technical:result.technical,placeId:result.selectedPlaceId,candidateCount:result.candidates.length});
  if(expectReview&&result.code==='STRONG')report.failures.push(`${sample.id}: ${variant} accepted`);
  console.log(`${sample.id} ${variant}: ${result.code} (${result.technical})`);
 }
 report.technicalReady=report.results.filter(r=>r.technical==='READY').length;
 if(routeSmokePoints.length>=2){
  globalThis.fetch=fetcher;
  try{const legs=await fetchGoogleLegs(routeSmokePoints.slice(0,2),key);report.routing={state:'READY',provider:'GOOGLE',legCount:legs.length,hasDistance:legs.every(l=>l.distanceKm>0),hasPath:legs.every(l=>l.path.length>1)};assert.ok(report.routing.hasDistance&&report.routing.hasPath);}
  catch{report.routing={state:'GOOGLE_ROUTE_UNAVAILABLE'};}
  finally{globalThis.fetch=realFetch;}
 }
 report.strong=report.results.filter(r=>r.code==='STRONG').length;
 report.conclusion=report.technicalReady===report.results.length?'Provider exercised; independent field truth still required to measure accuracy.':'Provider not fully operational; results do not prove matching accuracy.';
 writeFileSync('../docs/OV12_BELFOODS_GOOGLE_LIVE.json',JSON.stringify(report,null,2)+'\n');
 assert.deepEqual(report.failures,[]);
 console.log(JSON.stringify({samples:report.results.length,calls:report.actualCalls,technicalReady:report.technicalReady,strong:report.strong,negativeFalseAccepts:report.failures.length}));
}finally{globalThis.fetch=realFetch;await prisma.$disconnect();}
