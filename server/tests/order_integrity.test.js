import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reportChannel,ratioPercent,weeklyCsv,dailyCompletion} from '../../shared/report-semantics.mjs';
import {orderPricing} from '../../shared/order-pricing.mjs';
import {orderTerms} from '../../shared/order-terms.mjs';

test('TOP defaults apply when changing CASH to TOP and explicit zero-day TOP remains valid',()=>{
 assert.equal(orderTerms('TOP',{paymentType:'CASH',termOfPaymentDays:0},14),14);
 assert.equal(orderTerms('TOP',{paymentType:'TOP',termOfPaymentDays:0},14),0);
 assert.equal(orderTerms('TOP',{paymentType:'TOP',termOfPaymentDays:7},14),7);
 assert.equal(orderTerms('CASH',{paymentType:'TOP',termOfPaymentDays:7},14),0);
});
import {orderSnapshot} from '../../shared/order-snapshot.mjs';
import {fulfillment} from '../../shared/delivery-operations.mjs';
import {prisma} from '../src/config/prisma.js';
import {listFollowUps} from '../src/modules/staff-attendance/follow-up.service.js';
import {saveConfigs} from '../src/modules/config/services/save-configs.service.js';

test('report channel recognizes actual outlet enums and leaves unknown channels explicit',()=>{
  for(const subChannel of ['HYPERMARKET','DRUGSTORE','NAT_SUPERMARKET','LOKAL_SUPERMARKET','CHAIN_MINIMARKET','LOKAL_MINIMARKET','OTHER_MT'])assert.equal(reportChannel({subChannel}),'MODERN_TRADE');
  for(const subChannel of ['GROSIR','SEMI_GROSIR','PERKULAKAN'])assert.equal(reportChannel({channel:'GENERAL_TRADE',subChannel}),'SEMI_WHOLESALE');
  assert.equal(reportChannel({subChannel:'WARUNG'}),'RETAIL');assert.equal(reportChannel({}),'UNCLASSIFIED');
});
test('ratios do not invent a baseline or label equal values as growth',()=>{
  assert.equal(ratioPercent(50,0),'\u2014');assert.equal(ratioPercent(0,100),'0%');assert.equal(ratioPercent(100,100),'100%');
});
test('CSV includes Sunday and neutralizes master names interpreted as formulas',()=>{
  const csv=weeklyCsv({period:{weekDays:[{dayName:'Minggu',dateStr:'11/10'}]},salesmen:[{salesmanName:'=CMD()',clusterName:'A, B',days:{minggu:{plan:1,actual:1,ec:1,omzet:999}},weeklyTotal:{omzet:999}}]});
  assert.match(csv,/Minggu 11\/10/);assert.match(csv,/"'=CMD\(\)"/);assert.match(csv,/"A, B"/);assert.match(csv,/"999"/);
});
test('daily completion requires OUT even when actual calls already reach plan',()=>{
  assert.equal(dailyCompletion([{planCall:'Y',actualCall:'Y',rawTimeOut:null}]).status,'Sedang Kunjungan');
  assert.equal(dailyCompletion([{planCall:'Y',actualCall:'N',isSkipped:true}]).status,'Tuntas dengan pengecualian');
  assert.equal(dailyCompletion([{planCall:'Y',actualCall:'Y',rawTimeOut:'2026-10-08'}]).status,'Selesai');
});
test('order pricing consistently computes included and excluded tax',()=>{
  const items=[{quantity:2,unitPrice:10000}];
  assert.equal(orderPricing(items,11,true).totalValue,20000);assert.equal(orderPricing(items,11,false).totalValue,22200);
  assert.equal(orderPricing(items,0,false).taxAmount,0);
});
test('order display retains names and customer address after master edits',()=>{
  const original={customerSnapshot:{name:'Customer at sale',address:'Old address'},pjpStop:{outlet:{name:'Renamed customer',address:'New address'}},items:[{productName:'Original SKU',productSku:'A',product:{name:'Renamed',sku:'B'}}]};
  const shown=orderSnapshot(original);assert.equal(shown.items[0].product.name,'Original SKU');assert.equal(shown.pjpStop.outlet.address,'Old address');assert.equal(original.items[0].product.name,'Renamed');
});
test('cancelled remainder closes demand explicitly without inflating accepted delivery',()=>{
  const o={id:'o',items:[{id:'i',quantity:10,cancelledQuantity:4}]};
  const p={sourceOrderId:'o',items:[{lineId:'i',quantity:6}],deliveryStops:[{status:'DELIVERED',allocatedItems:[{lineId:'i',quantity:6}]}]};
  const state=fulfillment(o,[p]);assert.equal(state.fulfillmentStatus,'CLOSED_WITH_CANCELLATION');assert.equal(state.fulfillmentLines[0].accepted,6);assert.equal(state.fulfillmentLines[0].remaining,0);
});
test('open follow-ups are filtered before pagination so finished tasks cannot hide old work',async t=>{
  const original=prisma.staffActivity.findMany;prisma.staffActivity.findMany=async query=>query;t.after(()=>{prisma.staffActivity.findMany=original;});
  const query=await listFollowUps({id:'u',role:'ADMIN'},{status:'OPEN',page:3,limit:50});assert.equal(query.skip,100);assert.equal(query.take,50);assert.deepEqual(query.where.AND[1],{followUp:{path:['status'],equals:'OPEN'}});assert.equal(query.orderBy[0].checkInAt,'asc');
});
test('config updates store actor and before/after values in the same transaction',async t=>{
  const records=[{key:'TAX_RATE_PERCENT',value:11}],events=[];
  const original=prisma.$transaction;prisma.$transaction=async work=>work({...Object.fromEntries(['pjpStop','order','customerRegistration','deliveryRoute','packingList','staffActivity'].map(name=>[name,{findMany:async()=>[]}])), $executeRaw:async()=>{},systemConfig:{findMany:async()=>records,upsert:async({where,update})=>{records.find(r=>r.key===where.key).value=update.value;}},auditEvent:{create:async({data})=>events.push(data)}});t.after(()=>{prisma.$transaction=original;});
  assert.equal((await saveConfigs({TAX_RATE_PERCENT:12},{id:'admin',name:'Admin'})).TAX_RATE_PERCENT,12);
  assert.equal(events.length,1);assert.equal(events[0].actorId,'admin');assert.equal(events[0].before.value,11);assert.equal(events[0].after.value,12);
  await saveConfigs({TAX_RATE_PERCENT:12},{id:'admin'});assert.equal(events.length,1);
});
test('config history redacts API credentials and invalid relationships write nothing',async t=>{
  const records=[{key:'MAPS_API_KEY',value:'old-secret'}],events=[];let writes=0;
  const original=prisma.$transaction;prisma.$transaction=async work=>work({...Object.fromEntries(['pjpStop','order','customerRegistration','deliveryRoute','packingList','staffActivity'].map(name=>[name,{findMany:async()=>[]}])), $executeRaw:async()=>{},systemConfig:{findMany:async()=>records,upsert:async()=>{writes++;}},auditEvent:{create:async({data})=>events.push(data)}});t.after(()=>{prisma.$transaction=original;});
  await saveConfigs({MAPS_API_KEY:'new-secret'},{id:'admin'});assert.equal(events[0].before.value,'[REDACTED]');assert.equal(events[0].after.value,'[REDACTED]');assert.equal(JSON.stringify(events).includes('secret'),false);
  await assert.rejects(()=>saveConfigs({VALIDATION_DISTANCE_WARNING:200,VALIDATION_DISTANCE_SUSPECT:100}),e=>e.statusCode===400);assert.equal(writes,1);
});
import {useDefaultPolicy} from './helpers/config-fixture.js';
useDefaultPolicy();
