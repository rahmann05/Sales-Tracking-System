import {test} from 'node:test';
import assert from 'node:assert/strict';
import {locationExpired} from '../../shared/location-retention.mjs';
import {routeLocation} from '../../shared/delivery-operations.mjs';
import {locationPresentation} from '../../client/src/pages/TeamTracking/locationPresentation.js';
const now=Date.parse('2026-10-09T10:00:00Z');
test('zero retention preserves telemetry; positive retention follows observed time and handles unknown capture time',()=>{
 const point={observedAt:new Date(now-2*3600000),receivedAt:new Date(now)};
 assert.equal(locationExpired(point,0,now),false);assert.equal(locationExpired(point,1,now),true);
 assert.equal(locationExpired({...point,observedAt:null},1,now),false);
 assert.equal(locationExpired({receivedAt:new Date(now-3600000)},1,now),false);
 assert.equal(locationExpired(null,1,now),false);
});
test('expired Driver telemetry falls back to actual attendance without removing the attendance evidence',()=>{
 const route={position:{latitude:1,longitude:1,observedAt:new Date(now-7200000),receivedAt:new Date(now-7200000)},stops:[{attendances:[{latitude:0,longitude:0,timestamp:new Date(now-8000000)}]}]};
 const before=structuredClone(route),location=routeLocation(route,now,{retentionHours:1});
 assert.equal(location.source,'ATTENDANCE');assert.equal(location.latitude,0);assert.equal(location.isLive,false);assert.deepEqual(route,before);
 assert.equal(routeLocation({...route,stops:[]},now,{retentionHours:1}),null);
});
test('Sales location presentation never labels an unknown device capture time as current GPS',()=>{
 const row={latitude:0,longitude:0,locationSource:'LIVE_GPS_PING',lastUpdated:new Date(now).toISOString(),isOnline:true};
 assert.equal(locationPresentation(row,now).tone,'neutral');
 assert.equal(locationPresentation({...row,observedAt:row.lastUpdated},now).tone,'live');
 assert.equal(locationPresentation({...row,latitude:null},now).hasPosition,false);
 assert.equal(locationPresentation({...row,locationSource:'CLUSTER_CENTER'},now).hasPosition,false);
});
