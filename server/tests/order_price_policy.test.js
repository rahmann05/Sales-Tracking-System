import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderPricing,priceOverrideError} from '../../shared/order-pricing.mjs';
import {mapInvoiceCommercial} from '../src/modules/delivery/services/invoice-mapping.service.js';
import {invoiceReconciliation,reconciliationFingerprint} from '../../shared/invoice-reconciliation.mjs';

test('price bounds never grant permission and cap increases and decreases independently',()=>{
 const values={SALES_ALLOW_PRICE_OVERRIDE:true,ORDER_PRICE_OVERRIDE_LIMIT_ENABLED:true,ORDER_PRICE_OVERRIDE_MAX_DISCOUNT_PERCENT:10,ORDER_PRICE_OVERRIDE_MAX_MARKUP_PERCENT:0};
 assert.equal(priceOverrideError(1000,900,values),null);
 assert.match(priceOverrideError(1000,899,values),/maksimal 10%/);
 assert.equal(priceOverrideError(1000,1000,values),null);
 assert.match(priceOverrideError(1000,1001,values),/maksimal 0%/);
 assert.match(priceOverrideError(1000,900,{...values,SALES_ALLOW_PRICE_OVERRIDE:false}),/tidak diizinkan/);
 assert.equal(priceOverrideError(1000,10000,{...values,ORDER_PRICE_OVERRIDE_LIMIT_ENABLED:false}),null);
 assert.match(priceOverrideError(0,1,values),/dasar/);
 for(const n of [0,-1,NaN,Infinity])assert.match(priceOverrideError(1000,n,values),/nol/);
});
test('rounding modes agree in order and invoice and survive policy changes',()=>{
 const items=[{lineId:'i',unitPrice:101,quantity:1}],order={items:[{id:'oi',unitPrice:101,subtotal:101}],taxIncluded:false,taxRatePercent:11,totalValue:113,taxAmount:12,policySnapshot:{values:{ORDER_TAX_ROUNDING_MODE:'UP'}}};
 assert.equal(orderPricing(items,11,false,'NEAREST').totalValue,112);
 assert.equal(orderPricing(items,11,false,'DOWN').totalValue,112);
 assert.equal(orderPricing(items,11,false,'UP').totalValue,113);
 const invoice=mapInvoiceCommercial({id:'inv',items,taxRoundingMode:'DOWN',totalAmount:113},[{lineId:'i',sourceOrderItemId:'oi'}],order);
 assert.equal(invoice.taxRoundingMode,'UP');assert.equal(invoice.items[0].unitPrice,101);
 const packing={items:[{lineId:'i',quantity:1}],invoices:[invoice],deliveryStops:[]};
 assert.equal(invoiceReconciliation(packing).invoices[0].difference,0);
 assert.notEqual(reconciliationFingerprint(packing),reconciliationFingerprint({...packing,invoices:[{...invoice,taxRoundingMode:'DOWN'}]}));
 assert.equal(orderPricing([{unitPrice:100,quantity:1}],11,false,'UP').taxAmount,11);
 assert.throws(()=>orderPricing(items,11,false,'INVALID'));
 assert.equal(orderPricing(items,11,true,'UP').totalValue,101);
});
