import 'dotenv/config';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {prisma} from '../src/config/prisma.js';
import {config} from '../src/config/index.js';
import {getDynamicConfig} from '../src/modules/config/config.service.js';
import {capturePolicySnapshot} from '../src/modules/config/services/process-policy.service.js';
import {outletComparisonPolicy} from '../src/modules/outlets/services/outlet-comparison-policy.service.js';
import {searchGoogleOutlet} from '../src/modules/outlets/services/google-outlet-search.service.js';
import {evaluateDigitalOutlet,durableDigitalResult} from '../src/modules/outlets/services/outlet-digital-evaluator.service.js';
assert.ok(process.argv.includes('--live'),'--live required for billable Google calls');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local budget ledger only');
const report={at:new Date().toISOString(),maximumCalls:12,actualCalls:0,results:[]};
try{
 const values=(await capturePolicySnapshot()).values,key=await getDynamicConfig('MAPS_API_KEY','')||config.googleMapsApiKey;
 assert.ok(key,'Google server key unavailable');
 const {providerLimits}=await outletComparisonPolicy();
 const person=await prisma.outlet.findFirst({where:{name:{equals:'Pak Yadi',mode:'insensitive'},deletedAt:null},select:{name:true,address:true,latitude:true,longitude:true,source:true,locationEvidence:true,cluster:{select:{region:true}}}});
 const branch={name:'INDOMARET FRESH GUNUNG BATU',address:'Sukaraja Cicendo Kota Bandung Jawa Barat',latitude:-6.889808,longitude:107.569918,source:'IMPORT',cluster:{region:'Bandung'}};
 for(const input of [branch,person].filter(Boolean)){
  const fetcher=async(url,options)=>{assert.equal(new URL(url).hostname==='places.googleapis.com'||new URL(url).hostname==='maps.googleapis.com',true);assert.ok(report.actualCalls<12);report.actualCalls++;return fetch(url,options);};
  const search=await searchGoogleOutlet(input,key,{...values,OUTLET_REVIEW_MAX_CALLS:6,OUTLET_REVIEW_EXPAND_SEARCH:true},providerLimits,fetcher);
  const r=evaluateDigitalOutlet(input,search.candidates,search.steps,values);
  assert.notEqual(r.code,'STRONG','Weak identity must not be accepted by standard decision');
  report.results.push({inputName:input.name,...durableDigitalResult(r)});
  console.log(`${input.name}: ${r.code}; ${r.candidates.length} candidates; identityResolved=${r.identityReview.resolved}; ${r.technical}; ${r.calls} calls`);
 }
 writeFileSync('../docs/OUTLET_IDENTITY_LIVE_20261011.json',JSON.stringify(report,null,2)+'\n');
 console.log(`Live provider exercised: ${report.actualCalls}/12 calls; no master/review changes; not an independent accuracy benchmark.`);
}finally{await prisma.$disconnect();}
