import test from 'node:test';
import assert from 'node:assert/strict';
import {createVehicleMileagePlan,mileageLeg,returnMileageLeg,mileagePoint,actualMileageLeg,actualMileageLegWithPoints} from '../src/modules/delivery/services/vehicle-mileage-plan.service.js';
import {DEFAULT_DELIVERY_DEPOTS,parseDeliveryDepots} from '../../shared/delivery-depots.mjs';

const depot={latitude:-6.9,longitude:107.6};
const first={sequence:1,outletId:'first',packingListId:'packing-one',point:{latitude:-6.91,longitude:107.61,source:'ORDER_SNAPSHOT'}};
const second={sequence:2,outletId:'second',packingListId:'packing-two',point:{latitude:-6.92,longitude:107.62,source:'GOOGLE_ORDER_ADMIN',googleMapsOnly:true}};

test('mileage plan stores each delivery leg and the return to depot',async()=>{
 const plan=await createVehicleMileagePlan([first,second],{office:depot,roadResolver:async()=>({provider:'google',legs:[{distanceKm:2.1},{distanceKm:1.7},{distanceKm:3.4}]})});
 assert.equal(plan.source,'GOOGLE_ROAD');
 assert.equal(plan.totalKm,7.2);
 assert.deepEqual(plan.legs.map(leg=>[leg.from,leg.to,leg.distanceKm]),[['DEPOT','first',2.1],['first','second',1.7],['second','DEPOT',3.4]]);
 assert.equal(mileageLeg(plan,null,'first').distanceKm,2.1);
 assert.equal(mileageLeg(plan,'first','second').distanceKm,1.7);
 assert.equal(returnMileageLeg(plan,'second').distanceKm,3.4);
});

test('road failure never substitutes straight-line kilometres',async()=>{
 const roadResolver=async()=>{throw new Error('provider down');};
 await assert.rejects(createVehicleMileagePlan([first],{office:depot,roadResolver}),/Rute jalan/);
 const pending=await createVehicleMileagePlan([first],{office:depot,roadResolver,allowPending:true});
 assert.equal(pending.source,'ROAD_PENDING');
 assert.equal(pending.totalKm,null);
 assert.ok(pending.legs.every(leg=>leg.distanceKm===null));
});

test('one shop retains distinct outward and return road distances',async()=>{
 const plan=await createVehicleMileagePlan([first],{office:depot,roadResolver:async()=>({provider:'google',legs:[{distanceKm:2.1},{distanceKm:3.4}]})});
 assert.equal(mileageLeg(plan,null,'first').distanceKm,2.1);
 assert.equal(returnMileageLeg(plan,'first').distanceKm,3.4);
 assert.equal(plan.totalKm,5.5);
});

test('different planned depots and actual driver GPS use distinct directed legs',async()=>{
 const [origin,returnPoint]=parseDeliveryDepots(DEFAULT_DELIVERY_DEPOTS);
 const plan=await createVehicleMileagePlan([first],{office:origin,returnOffice:returnPoint,roadResolver:async()=>({provider:'google',legs:[{distanceKm:4.1},{distanceKm:7.2}]})});
 assert.equal(plan.totalKm,11.3);
 assert.notDeepEqual(plan.depot,plan.returnDepot);
 const actual={...plan,actualDeparture:{latitude:-6.886,longitude:107.49},actualReturn:{latitude:-6.897,longitude:107.549}};
 const outbound=await actualMileageLeg(actual,null,'first',{roadResolver:async points=>{assert.equal(points[0].lat,-6.886);return {provider:'google',legs:[{distanceKm:4.7}]};}});
 const inbound=await actualMileageLeg(outbound.plan,'first',null,{roadResolver:async points=>{assert.equal(points[1].lat,-6.897);return {provider:'google',legs:[{distanceKm:7.8}]};}});
 assert.equal(outbound.leg.distanceKm,4.7);
 assert.equal(inbound.leg.distanceKm,7.8);
});

test('a driver visiting shops out of order resolves the actual directed leg',async()=>{
 const plan=await createVehicleMileagePlan([first,second],{office:depot,roadResolver:async()=>({provider:'google',legs:[{distanceKm:2.1},{distanceKm:1.7},{distanceKm:3.4}]})});
 let calls=0;
 const reverse=await actualMileageLeg(plan,'second','first',{roadResolver:async points=>{calls++;assert.deepEqual(points.map(point=>point.lat),[-6.92,-6.91]);return {provider:'osrm',legs:[{distanceKm:2.8}]};}});
 assert.equal(reverse.leg.distanceKm,2.8);
 assert.equal(reverse.leg.source,'OSRM_ROAD');
 const cached=await actualMileageLeg(reverse.plan,'second','first',{roadResolver:async()=>{throw new Error('Should use cached actual leg');}});
 assert.equal(cached.leg.distanceKm,2.8);
 assert.equal(calls,1);
});

test('order snapshot point takes precedence over later outlet master changes',()=>{
 const outlet={id:'first',latitude:-7,longitude:108};
 const point=mileagePoint(outlet,{outletId:'first',latitude:-6.91,longitude:107.61,source:'GOOGLE_ORDER_ADMIN'});
 assert.deepEqual([point.latitude,point.longitude,point.googleMapsOnly],[-6.91,107.61,true]);
});

test('a discrepant driver attendance uses its GPS road leg while keeping the store target intact',async()=>{
 const plan=await createVehicleMileagePlan([first],{office:depot,roadResolver:async()=>({provider:'google',legs:[{distanceKm:2.1},{distanceKm:3.4}]})});
 const attendance={latitude:-6.915,longitude:107.615};
 const outbound=await actualMileageLegWithPoints(plan,null,'first',{fromPoint:depot,toPoint:attendance,roadResolver:async points=>{
  assert.deepEqual(points.map(point=>[point.lat,point.lng]),[[-6.9,107.6],[-6.915,107.615]]);
  return {provider:'google',legs:[{distanceKm:3.6}]};
 }});
 assert.equal(outbound.leg.distanceKm,3.6);
 assert.equal(outbound.plan.points[0].latitude,-6.91);
 const inbound=await actualMileageLegWithPoints(outbound.plan,'first',null,{fromPoint:attendance,toPoint:depot,roadResolver:async points=>{
  assert.deepEqual(points.map(point=>[point.lat,point.lng]),[[-6.915,107.615],[-6.9,107.6]]);
  return {provider:'google',legs:[{distanceKm:4.4}]};
 }});
 assert.equal(inbound.leg.distanceKm,4.4);
 assert.equal(inbound.plan.totalKm,5.5);
});
