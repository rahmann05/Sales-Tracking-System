import {test} from 'node:test';
import assert from 'node:assert/strict';
import {outletOperationalPoint,outletLocationBasis,projectOperationalOutlet,projectOperationalData,googleLocationRefreshAt} from '../../shared/outlet-location.mjs';
import {outletIssues} from '../../shared/outlet-validation.mjs';
import {distanceToOutlet} from '../src/utils/geolocation.js';
import {evaluateDigitalOutlet} from '../src/modules/outlets/services/outlet-digital-evaluator.service.js';
import {cleanLegacyOutletEvidence,cleanProviderCache} from '../src/modules/outlets/services/outlet-legacy-content.service.js';
const now=Date.now(),base={id:'o',name:'Toko Melati',address:'Jl Melati No 12 Bandung',latitude:null,longitude:null,clusterId:'c',phone:null,source:'IMPORT'};
const google={...base,googleLocation:{source:'GOOGLE',status:'ACTIVE',placeId:'place',basis:outletLocationBasis(base),latitude:-6.9,longitude:107.6,cachedAt:new Date(now).toISOString(),expiresAt:new Date(now+86400000).toISOString()}};
test('approved Google point works without inventing native GPS and projections remain idempotent',()=>{
 assert.equal(outletOperationalPoint(google,now).latitude,-6.9);assert.equal(distanceToOutlet(-6.9,107.6,google),0);
 const reordered={...google,googleLocation:{...google.googleLocation,basis:Object.fromEntries(Object.entries(google.googleLocation.basis).reverse())}};
 assert.equal(outletOperationalPoint(reordered,now).latitude,-6.9);
 const projected=projectOperationalOutlet(google,now);assert.equal(projected.nativeLocation.latitude,null);
 assert.deepEqual(projectOperationalOutlet(projected,now),projected);
 assert.equal(projectOperationalData({stops:[{outlet:google}]}).stops[0].outlet.longitude,107.6);
 assert.equal(outletIssues(google).includes('MISSING_POINT'),false);assert.equal(google.latitude,null);
});
test('expired, changed and rejected points never silently fall back to suspect native coordinates',()=>{
 for(const status of ['EXPIRED','CONFLICT'])assert.equal(outletOperationalPoint({...google,googleLocation:{...google.googleLocation,status}}).latitude,null);
 assert.equal(outletOperationalPoint(google,now+86400000).latitude,null);
 assert.equal(outletOperationalPoint({...google,address:'Jl Mawar No 12 Bandung'}).status,'CHANGED');
 const wrong={...google,latitude:-6.2,longitude:106.8};assert.equal(outletOperationalPoint(wrong).latitude,null);
 const internal={...wrong,googleLocation:{status:'SUPERSEDED'},locationEvidence:{source:'FIELD'}};
 assert.equal(outletOperationalPoint(internal).latitude,-6.2);assert.equal(outletOperationalPoint(internal).googleMapsOnly,false);
});
test('weak identity, area-only address and missing candidate details cannot produce a strong match',()=>{
 const candidate={placeId:'p',name:base.name,address:base.address,latitude:-6.9,longitude:107.6,detailsConfirmed:true};
 const evaluate=(o,c)=>evaluateDigitalOutlet(o,[c],[{state:'SUCCESS',kind:'DETAILS'}]);
 assert.equal(evaluate(base,candidate).code,'STRONG');
 assert.equal(evaluate({...base,name:'Usman'},{...candidate,name:'Usman'}).code,'REVIEW');
 assert.equal(evaluate({...base,address:'Kota Cimahi Jawa Barat'},{...candidate,address:'Kota Cimahi Jawa Barat'}).code,'REVIEW');
 assert.equal(evaluate(base,{...candidate,detailsConfirmed:false}).code,'REVIEW');
 assert.equal(evaluate(base,{...candidate,address:'Jl Melati No 13 Bandung'}).code,'REVIEW');
});
test('refresh lead never causes hourly API calls when a one-day cache has a long lead setting',()=>{
 assert.equal(Date.parse(googleLocationRefreshAt(now,now+86400000,168)),now+43200000);
 assert.equal(Date.parse(googleLocationRefreshAt(now,now+7*86400000,24)),now+6*86400000);
});
test('legacy cleanup preserves internal identity, field GPS, scores, decisions and permitted Place IDs',()=>{
 const evidence={decisionSource:'FIELD',actor:{name:'Sales'},snapshot:base,field:{name:'Toko Melati',address:'Jl Melati No 12',latitude:-6.9,photoUrl:'field-proof',photos:['field-proof']},score:92,signals:{findPlace:{score:90,details:{googleAddress:'provider text',googleLat:-6.8,googleLng:107.7,googlePlaceName:'provider name',outletName:base.name,placeId:'keep'}},nearby:{details:{bestMatchName:'provider name',nearbyPlaceNames:['provider'],bestMatchSimilarity:.9}}},candidates:[{placeId:'keep',name:'provider',address:'provider',latitude:-6.9,nameScore:90}]};
 const clean=cleanLegacyOutletEvidence(evidence);assert.deepEqual(clean.field,evidence.field);assert.deepEqual(clean.snapshot,base);assert.equal(clean.score,92);assert.equal(clean.signals.findPlace.details.placeId,'keep');assert.equal(clean.signals.findPlace.details.googleAddress,undefined);assert.deepEqual(clean.signals.nearby.details,{bestMatchSimilarity:.9});assert.deepEqual(clean.candidates,[{placeId:'keep',nameScore:90}]);
 const cache={candidates:[{placeId:'keep',latitude:-6.9,longitude:107.6,name:'remove'}]};
 assert.equal(cleanProviderCache(cache,new Date(now-1),new Date(now-86400000),new Date(now)).providerContent,null);
 const allowed=cleanProviderCache(cache,new Date(now+40*86400000),new Date(now),new Date(now));assert.equal(+allowed.providerExpiresAt,now+30*86400000);assert.equal(allowed.providerContent.candidates[0].name,undefined);
 assert.deepEqual(cleanLegacyOutletEvidence(clean),clean);
});
