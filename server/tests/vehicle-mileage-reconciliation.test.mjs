import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcilePendingMileage,reconcilePendingRoadPlans} from '../src/modules/delivery/services/reconcile-pending-mileage.service.js';

test('a closed trip gets its pending road leg later without duplicating the physical odometer',async()=>{
 const event={action:'MILEAGE_CHECKPOINT',kind:'IN',at:'2026-10-11T01:00:00.000Z',stopId:'stop',attendanceId:'attendance',previousOutletId:null,targetOutletId:'shop',distanceKm:null,source:'ROAD_PENDING'};
 const route={id:'trip',vehicleId:'truck',updatedAt:new Date(),closedAt:new Date(),odometerPostedAt:new Date(),odometerEnd:1010,history:[event],estimatedTravelKm:0,mileagePendingCount:1,mileagePlan:{version:1,source:'GOOGLE_ROAD',depot:{latitude:-6.9,longitude:107.6},actualDeparture:{latitude:-6.901,longitude:107.601},returnDepot:{latitude:-6.9,longitude:107.6},points:[{outletId:'shop',latitude:-6.91,longitude:107.61}],legs:[{from:'DEPOT',to:'shop',distanceKm:2.1},{from:'shop',to:'DEPOT',distanceKm:3.4}]}};
 const vehicle={id:'truck',totalKm:1010,estimatedKm:1010},audit=[],attendance={};
 const tx={
  $executeRaw:async()=>{},
  deliveryRoute:{findUnique:async()=>route,update:async({data})=>Object.assign(route,data)},
  vehicle:{findUnique:async()=>vehicle,update:async({data})=>Object.assign(vehicle,data)},
  auditEvent:{findFirst:async()=>null,create:async({data})=>audit.push(data)},
  deliveryAttendance:{update:async({data})=>Object.assign(attendance,data)},
 };
 const db={deliveryRoute:{findMany:async()=>[{id:route.id,updatedAt:route.updatedAt,mileagePlan:route.mileagePlan,history:route.history}]},$transaction:async work=>work(tx)};
 const result=await reconcilePendingMileage({db,roadResolver:async()=>({provider:'google',legs:[{distanceKm:2.2}]})});
 assert.equal(result.resolved,1);
 assert.equal(route.estimatedTravelKm,2.2);
 assert.equal(route.mileagePendingCount,0);
 assert.equal(route.history[0].source,'GOOGLE_ROAD');
 assert.equal(attendance.mileageEvidence.distanceKm,2.2);
 assert.equal(vehicle.estimatedKm,1010);
 assert.equal(audit[0].after.appliedToVehicle,false);
});

test('delayed road calculation retains the driver attendance point even when the store target differs',async()=>{
 const gps={latitude:-6.915,longitude:107.615};
 const event={action:'MILEAGE_CHECKPOINT',kind:'IN',at:'2026-10-11T01:00:00.000Z',stopId:'stop',attendanceId:'attendance',previousOutletId:null,targetOutletId:'shop',fromPoint:{latitude:-6.9,longitude:107.6},toPoint:gps,gps,distanceKm:null,source:'ROAD_PENDING'};
 const route={id:'trip',vehicleId:'truck',updatedAt:new Date(),history:[event],estimatedTravelKm:0,mileagePendingCount:1,mileagePlan:{version:1,depot:{latitude:-6.9,longitude:107.6},points:[{outletId:'shop',latitude:-6.91,longitude:107.61}],legs:[{from:'DEPOT',to:'shop',distanceKm:2.1}]}};
 const vehicle={id:'truck',totalKm:1000,estimatedKm:1000};
 const tx={$executeRaw:async()=>{},deliveryRoute:{findUnique:async()=>route,update:async({data})=>Object.assign(route,data)},vehicle:{findUnique:async()=>vehicle,update:async({data})=>Object.assign(vehicle,data)},auditEvent:{findFirst:async()=>null,create:async()=>{}},deliveryAttendance:{update:async()=>{}}};
 const db={deliveryRoute:{findMany:async()=>[{id:route.id,updatedAt:route.updatedAt,mileagePlan:route.mileagePlan,history:route.history}]},$transaction:async work=>work(tx)};
 const result=await reconcilePendingMileage({db,roadResolver:async points=>{assert.equal(points[1].lat,gps.latitude);return {provider:'google',legs:[{distanceKm:3.6}]};}});
 assert.equal(result.resolved,1);
 assert.equal(route.history[0].distanceKm,3.6);
 assert.equal(route.history[0].toPoint.latitude,gps.latitude);
 assert.equal(vehicle.estimatedKm,1003.6);
});

test('a closed trip receives its planned directed road legs after the map service recovers',async()=>{
 const route={id:'trip',updatedAt:new Date(),closedAt:new Date(),totalDistanceKm:null,mileagePlan:{version:1,source:'ROAD_PENDING',depot:{latitude:-6.9,longitude:107.6},returnDepot:{latitude:-6.89,longitude:107.59},points:[{sequence:1,outletId:'shop',latitude:-6.91,longitude:107.61}],actualDeparture:{latitude:-6.901,longitude:107.601},actualLegs:[{key:'actual',distanceKm:3.6}]},vehicle:{fuelKmPerLiter:10}};
 const audit=[];
 const tx={$executeRaw:async()=>{},deliveryRoute:{findUnique:async()=>route,update:async({data})=>Object.assign(route,data)},auditEvent:{create:async({data})=>audit.push(data)}};
 const db={deliveryRoute:{findMany:async()=>[{id:route.id,updatedAt:route.updatedAt,mileagePlan:route.mileagePlan}],updateMany:async()=>{}},$transaction:async work=>work(tx)};
 const result=await reconcilePendingRoadPlans({db,roadResolver:async()=>({provider:'google',legs:[{distanceKm:2.1},{distanceKm:3.4}]})});
 assert.equal(result.resolved,1);
 assert.equal(route.totalDistanceKm,5.5);
 assert.equal(route.fuelConsumedLiters,0.55);
 assert.equal(route.mileagePlan.actualDeparture.latitude,-6.901);
 assert.equal(route.mileagePlan.actualLegs.length,1);
 assert.equal(audit[0].after.closedAt.toISOString(),route.closedAt.toISOString());
});
