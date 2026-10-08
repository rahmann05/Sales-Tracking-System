import {test} from 'node:test';
import assert from 'node:assert/strict';
import {invoiceReconciliation,invoiceMappingErrors,reconciliationFingerprint} from '../../shared/invoice-reconciliation.mjs';
import {reconcileInvoiceReceipt} from '../src/modules/delivery/services/invoice-reconciliation.service.js';
import {prisma} from '../src/config/prisma.js';
const fixture=()=>({id:'p',revision:1,history:[],items:[{lineId:'a',name:'A',quantity:10}],totalCartons:2,invoices:[{id:'i',invoiceNumber:'I',totalAmount:1110,totalCartons:2,taxIncluded:false,taxRatePercent:11,items:[{lineId:'a',quantity:10,unitPrice:100}]}],deliveryStops:[{id:'s',status:'PARTIAL_REJECT',allocatedCartons:2,allocatedItems:[{lineId:'a',quantity:10}],allocatedInvoices:[{invoiceId:'i',cartons:2}],rejectedCartons:1,rejectedItems:[{lineId:'a',quantity:2}],rejectedInvoices:[{invoiceId:'i',cartons:1}],returnInspection:{note:'Damaged'},reusableItems:[],reusableCartons:0,returnReceivedAt:'2026-10-08'}]});
test('invoice values use accepted item quantities instead of the ratio of cartons',()=>{
  const state=invoiceReconciliation(fixture());assert.equal(state.status,'RECONCILED');assert.equal(state.invoices[0].acceptedValue,888);assert.equal(state.invoices[0].unacceptedValue,222);
});
test('unknown prices and historic unmapped invoices never become a verified zero',()=>{
  const p=fixture();delete p.invoices[0].items[0].unitPrice;assert.equal(invoiceReconciliation(p).status,'UNPRICED');assert.equal(invoiceReconciliation(p).invoices[0].expectedValue,null);
  p.invoices[0].items=[];assert.equal(invoiceReconciliation(p).status,'UNMAPPED');
});
test('mapping rejects unknown, duplicate, excess and missing quantities',()=>{
  for(const items of [[{lineId:'a',quantity:11}],[{lineId:'x',quantity:10}],[{lineId:'a',quantity:5},{lineId:'a',quantity:5}],[]]){const p=fixture();p.invoices[0].items=items;assert.ok(invoiceMappingErrors(p).length);}
});
test('declared invoice nominal mismatch stays visible',()=>{
  const p=fixture();p.invoices[0].totalAmount=1000;const state=invoiceReconciliation(p);assert.equal(state.status,'AMOUNT_DIFFERENCE');assert.equal(state.invoices[0].difference,-110);
});
test('inconsistent historic receipts cannot produce a verified negative remaining value',()=>{
  const p=fixture();p.deliveryStops.push({id:'duplicate',status:'DELIVERED',allocatedItems:[{lineId:'a',quantity:10}]});const state=invoiceReconciliation(p);assert.equal(state.status,'RECEIPT_DIFFERENCE');assert.equal(state.invoices[0].acceptedValue,null);assert.equal(state.invoices[0].unacceptedValue,null);
});
test('open visits and reusable returns prevent final reconciliation',()=>{
  const p=fixture();p.deliveryStops[0].status='PENDING';assert.equal(invoiceReconciliation(p).status,'IN_PROGRESS');p.deliveryStops[0].status='PARTIAL_REJECT';p.deliveryStops[0].reusableItems=[{lineId:'a',quantity:2}];assert.equal(invoiceReconciliation(p).status,'IN_PROGRESS');
});
test('a SKU split across invoices requires explicit attribution and invalidates after result changes',()=>{
  const p=fixture();p.invoices[0].items[0].quantity=5;p.invoices[0].totalAmount=555;p.invoices.push({...p.invoices[0],id:'j',items:[{lineId:'a',quantity:5,unitPrice:100}]});
  assert.equal(invoiceReconciliation(p).status,'NEEDS_ALLOCATION');assert.equal(invoiceReconciliation(p).invoices[0].acceptedValue,null);
  p.commercialReconciliation={fingerprint:reconciliationFingerprint(p),at:'2026-10-08',invoices:[{invoiceId:'i',items:[{lineId:'a',quantity:5}]},{invoiceId:'j',items:[{lineId:'a',quantity:3}]}]};
  assert.equal(invoiceReconciliation(p).status,'RECONCILED');assert.equal(invoiceReconciliation(p).invoices[1].acceptedValue,333);
  p.deliveryStops[0].rejectedItems[0].quantity=1;assert.equal(invoiceReconciliation(p).status,'STALE');assert.equal(invoiceReconciliation(p).invoices[0].acceptedValue,null);
});
test('confirmation rejects over-attribution, stale results, and non-admin actors without writing',async t=>{
  const p=fixture();let writes=0;const original=prisma.$transaction;prisma.$transaction=async work=>work({$executeRaw:async()=>{},packingList:{findUnique:async()=>p,update:async()=>{writes++;}}});t.after(()=>{prisma.$transaction=original;});
  const data={fingerprint:reconciliationFingerprint(p),note:'Evidence checked',invoices:[{invoiceId:'i',items:[{lineId:'a',quantity:9}]}]};
  await assert.rejects(()=>reconcileInvoiceReceipt('p',data,{role:'ADMIN'}),e=>e.statusCode===409);
  await assert.rejects(()=>reconcileInvoiceReceipt('p',{...data,fingerprint:'old'},{role:'ADMIN'}),e=>e.statusCode===409);
  await assert.rejects(()=>reconcileInvoiceReceipt('p',data,{role:'KEPALA_GUDANG'}),e=>e.statusCode===403);assert.equal(writes,0);
});
