import test from 'node:test';
import assert from 'node:assert/strict';
import {recordMileageCheckpoint,recordMileageReturn} from '../src/modules/delivery/services/vehicle-mileage-ledger.service.js';

test('arrival at a closed shop counts once, checkout adds zero, return counts the depot leg',async()=>{
 const plan={version:1,source:'GOOGLE_ROAD',depot:{latitude:-6.9,longitude:107.6},points:[{outletId:'shop',latitude:-6.91,longitude:107.61}],legs:[{from:'DEPOT',to:'shop',distanceKm:2.1},{from:'shop',to:'DEPOT',distanceKm:3.4}]};
 const route={id:'trip',vehicleId:'truck',history:[],estimatedTravelKm:0,mileagePlan:plan};
 const vehicle={id:'truck',totalKm:1000,estimatedKm:1000};
 const attendances=new Map(),audit=[];
 const tx={
  $executeRaw:async()=>{},
  deliveryRoute:{findUnique:async()=>route,update:async({data})=>Object.assign(route,data)},
  deliveryStop:{findUnique:async()=>({id:'stop',outletId:'shop'})},
  vehicle:{findUnique:async()=>vehicle,update:async({data})=>Object.assign(vehicle,data)},
  user:{findUnique:async()=>({name:'Supir Uji'})},
  deliveryAttendance:{update:async({where,data})=>attendances.set(where.id,data.mileageEvidence)},
  auditEvent:{create:async({data})=>audit.push(data)},
 };
 const arrival=await recordMileageCheckpoint(tx,{routeId:'trip',stopId:'stop',attendanceId:'in',kind:'IN',driverId:'driver'});
 assert.equal(arrival.distanceKm,2.1);
 assert.equal(attendances.get('in').distanceKm,2.1);
 assert.equal(vehicle.estimatedKm,1002.1);
 const checkout=await recordMileageCheckpoint(tx,{routeId:'trip',stopId:'stop',attendanceId:'out',kind:'OUT',driverId:'driver'});
 assert.equal(checkout.distanceKm,0);
 assert.equal(vehicle.estimatedKm,1002.1);
 assert.equal(route.estimatedTravelKm,2.1);
 const returned=await recordMileageReturn(tx,route,'driver');
 assert.equal(returned.evidence.distanceKm,3.4);
 assert.equal(returned.estimatedTravelKm,5.5);
 assert.equal(vehicle.estimatedKm,1005.5);
 assert.equal(audit.length,3);
 assert.ok(audit.every(event=>event.actorName==='Supir Uji'));
});
