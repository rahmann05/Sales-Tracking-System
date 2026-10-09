import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fulfillment, routeProgress, routeLocation } from '../../shared/delivery-operations.mjs';
import { packingBalance, validateAllocation } from '../../shared/packing.mjs';
import { prisma } from '../src/config/prisma.js';
import { routeAction } from '../src/modules/delivery/services/operations.service.js';
import { assertResources } from '../src/modules/delivery/services/resource-policy.service.js';
import { reportDriverLocation } from '../src/modules/delivery/services/driver-location.service.js';
import { receiveReturn } from '../src/modules/delivery/services/receive-return.service.js';
import { reconcilePackingInvoices } from '../src/modules/delivery/services/route-lifecycle.service.js';
import { returnSchema, locationSchema } from '../src/modules/delivery/delivery.schema.js';
const mockTx = (t,tx) => t.mock.method(prisma,'$transaction',async fn=>fn(tx));
const manager={id:'warehouse',name:'Gudang',role:'KEPALA_GUDANG'};
const trip = extra=>({id:'r',code:'R',driverId:'d',vehicleId:'v',date:new Date('2026-10-08'),status:'DRAFT',preparation:{},history:[],stops:[{id:'s',allocatedItems:[{lineId:'a',quantity:10}],status:'PENDING'}],totalCartons:2,...extra});

test('fulfillment keeps outstanding demand across partial delivery and redelivery without stock',()=>{
  const o={id:'o',items:[{id:'a',quantity:100}]};
  const p={sourceOrderId:'o',items:[{lineId:'l',sourceOrderItemId:'a',quantity:80}],deliveryStops:[{status:'PARTIAL_REJECT',allocatedItems:[{lineId:'l',quantity:80}],rejectedItems:[{lineId:'l',quantity:20}]}]};
  let out=fulfillment(o,[p]);assert.equal(out.fulfillmentLines[0].remaining,40);assert.equal(out.fulfillmentLines[0].unpacked,20);
  p.deliveryStops.push({status:'DELIVERED',allocatedItems:[{lineId:'l',quantity:20}]});
  out=fulfillment(o,[p]);assert.equal(out.fulfillmentLines[0].accepted,80);assert.equal(out.fulfillmentStatus,'PARTIAL');
});
test('unusable inspected returns reopen replacement packing demand',()=>{
  const o={id:'o',items:[{id:'a',quantity:100}]};
  const p={sourceOrderId:'o',items:[{lineId:'a',quantity:100}],deliveryStops:[{status:'PARTIAL_REJECT',allocatedItems:[{lineId:'a',quantity:100}],rejectedItems:[{lineId:'a',quantity:20}],returnInspection:{},reusableItems:[{lineId:'a',quantity:5}]}]};
  assert.equal(fulfillment(o,[p]).fulfillmentLines[0].unpacked,15);
});
test('return receipt alone never makes rejected goods available for redelivery',()=>{
  const p={totalCartons:10,items:[{lineId:'a',quantity:100}],deliveryStops:[{allocatedCartons:10,allocatedItems:[{lineId:'a',quantity:100}],rejectedCartons:4,rejectedItems:[{lineId:'a',quantity:40}],returnReceivedAt:new Date()}]};
  assert.equal(packingBalance(p).remainingCartons,0);
  p.deliveryStops[0].reusableCartons=2;p.deliveryStops[0].reusableItems=[{lineId:'a',quantity:20}];
  assert.equal(packingBalance(p).remainingCartons,2);assert.equal(packingBalance(p).remainingItems[0].remaining,20);
});
test('invoice allocation cannot exceed balance or disagree with cartons',()=>{
  const p={status:'RELEASED',totalCartons:10,items:[{lineId:'a',quantity:10}],invoices:[{id:'i',totalCartons:10}],deliveryStops:[]};
  assert.throws(()=>validateAllocation(p,{allocatedCartons:4,allocatedItems:[{lineId:'a',quantity:4}],allocatedInvoices:[{invoiceId:'i',cartons:5}]},true));
  assert.equal(validateAllocation(p,{allocatedCartons:4,allocatedItems:[{lineId:'a',quantity:4}],allocatedInvoices:[{invoiceId:'i',cartons:4}]},true).allocatedInvoices[0].cartons,4);
});
test('completed visits and successful delivery are separate metrics',()=>{
  const progress=routeProgress({stops:[{status:'DELIVERED'},{status:'REJECTED'}]});assert.equal(progress.completionPercent,100);assert.equal(progress.successPercent,50);
});
test('GPS freshness uses observed timestamp and newer attendance wins',()=>{
  const now=Date.now();const r={position:{latitude:1,longitude:2,observedAt:new Date(now-180000)},stops:[]};
  assert.equal(routeLocation(r,now).isLive,false);
  r.stops=[{outlet:{name:'Toko'},attendances:[{latitude:3,longitude:4,timestamp:new Date(now-50000)}]}];
  assert.equal(routeLocation(r,now).source,'ATTENDANCE');
  r.position.observedAt=new Date(now-5000);assert.equal(routeLocation(r,now).isLive,true);
  r.returnedAt=new Date();assert.equal(routeLocation(r,now).isLive,false);
});
test('resource guard blocks overlapping routes but permits sequential trips',async()=>{
  let other={id:'other',code:'OTHER',plannedStartAt:'2026-10-08T01:00:00Z',plannedEndAt:'2026-10-08T04:00:00Z'};
  const tx={$executeRaw:async()=>{},vehicle:{findUnique:async()=>({isActive:true,condition:'AVAILABLE'})},user:{findUnique:async()=>({role:'SUPIR'})},deliveryRoute:{findMany:async()=>[other]}};
  const c=trip({plannedStartAt:'2026-10-08T02:00:00Z',plannedEndAt:'2026-10-08T05:00:00Z'});
  await assert.rejects(()=>assertResources(tx,c),/masih digunakan/);
  c.plannedStartAt='2026-10-08T04:00:00Z';await assertResources(tx,c);
  other.status='IN_TRANSIT';await assert.rejects(()=>assertResources(tx,c),/masih digunakan/);
});
test('preparation cannot skip checking or use mismatched actual quantities',async t=>{
  const r=trip();mockTx(t,{$executeRaw:async()=>{},deliveryRoute:{findUnique:async()=>r}});
  await assert.rejects(()=>routeAction('r',{action:'LOAD',note:'checked'},manager),/tahap sebelumnya/);
  await assert.rejects(()=>routeAction('r',{action:'PICK',note:'checked',cartons:2,quantities:{'s:a':9}},manager),/setiap barang/);
});
test('driver cannot operate another route or close a trip',async t=>{
  mockTx(t,{$executeRaw:async()=>{},deliveryRoute:{findUnique:async()=>trip()}});
  await assert.rejects(()=>routeAction('r',{action:'START',note:'go'},{id:'other',role:'SUPIR'}),{statusCode:403});
  await assert.rejects(()=>routeAction('r',{action:'CLOSE',note:'close'},{id:'d',role:'SUPIR'}),{statusCode:403});
});
test('legacy in-transit trip without departure timestamp cannot be cancelled or rescheduled',async t=>{
  mockTx(t,{$executeRaw:async()=>{},deliveryRoute:{findUnique:async()=>trip({status:'IN_TRANSIT'})}});
  await assert.rejects(()=>routeAction('r',{action:'CANCEL',note:'Legacy trip'},manager),/sudah berjalan/);
  await assert.rejects(()=>routeAction('r',{action:'RESCHEDULE',note:'Legacy trip'},manager),/sudah berjalan/);
});
test('trip close requires inspected returns, resolved issues and reconciled documents',async t=>{
  let r=trip({status:'PARTIAL',returnedAt:new Date(),stops:[{status:'REJECTED',rejectedCartons:2}]});
  let count=1;mockTx(t,{$executeRaw:async()=>{},deliveryRoute:{findUnique:async()=>r},deliveryIssue:{count:async()=>count}});
  await assert.rejects(()=>routeAction('r',{action:'CLOSE',note:'close',documentsReturned:true},manager),/pemeriksaan retur/);
  r.stops[0].returnInspection={};await assert.rejects(()=>routeAction('r',{action:'CLOSE',note:'close',documentsReturned:true},manager),/masalah trip/);
  count=0;await assert.rejects(()=>routeAction('r',{action:'CLOSE',note:'close'},manager),/dokumen/);
});
test('GPS rejects other driver and trips already returned, with no writes',async t=>{
  const r=trip({status:'IN_TRANSIT'});mockTx(t,{$executeRaw:async()=>{},deliveryRoute:{findUnique:async()=>r}});
  const p={latitude:-6,longitude:107,accuracy:10,observedAt:new Date().toISOString()};
  await assert.rejects(()=>reportDriverLocation('r',p,'other'),{statusCode:403});r.returnedAt=new Date();await assert.rejects(()=>reportDriverLocation('r',p,'d'),{statusCode:409});
  await assert.rejects(()=>reportDriverLocation('r',{...p,observedAt:new Date(Date.now()-180000).toISOString()},'d'),/terlalu lama/);
});
test('retur validates physical counts before persisting',async t=>{
  mockTx(t,{deliveryStop:{findUnique:async()=>({status:'REJECTED',rejectedCartons:2,rejectedItems:[{lineId:'a',quantity:5}]})}});
  await assert.rejects(()=>receiveReturn('s','warehouse',{note:'inspect',receivedCartons:3,reusableCartons:2,items:[]}),/fisik/);
  await assert.rejects(()=>receiveReturn('s','warehouse',{note:'inspect',receivedCartons:2,reusableCartons:2,items:[{lineId:'a',received:5,reusable:6}]}),/barang retur/);
  assert.equal(returnSchema.safeParse({body:{note:'inspect',receivedCartons:-1,reusableCartons:0,items:[]}}).success,false);
  assert.equal(locationSchema.safeParse({body:{latitude:91,longitude:100,accuracy:10,observedAt:new Date().toISOString()}}).success,false);
});
test('invoice reconciliation marks only the invoice actually delivered on split trips',async()=>{
  const writes=[];const packing={totalCartons:10,items:[{lineId:'a',quantity:10}],invoices:[{id:'i1',totalCartons:4},{id:'i2',totalCartons:6}],deliveryStops:[{status:'DELIVERED',allocatedCartons:4,allocatedItems:[{lineId:'a',quantity:4}],allocatedInvoices:[{invoiceId:'i1',cartons:4}]},{status:'PENDING',allocatedCartons:6,allocatedItems:[{lineId:'a',quantity:6}],allocatedInvoices:[{invoiceId:'i2',cartons:6}]}]};
  await reconcilePackingInvoices({packingList:{findUnique:async()=>packing},invoice:{update:async q=>writes.push(q)}},'p');
  assert.equal(writes[0].data.isDelivered,true);assert.equal(writes[1].data.isDelivered,false);
});
import {useDefaultPolicy} from './helpers/config-fixture.js';
useDefaultPolicy();
