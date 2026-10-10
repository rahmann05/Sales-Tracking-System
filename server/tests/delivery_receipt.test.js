import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deliveryReceiptError,validReceiptSignature} from '../../shared/delivery-receipt.mjs';
import {policyConflicts} from '../../shared/operational-policy.mjs';
import {CONFIG_DEFAULTS} from '../../shared/config.mjs';
test('Receipt policy distinguishes rejection, optional, required and disabled fields',()=>{
 assert.equal(deliveryReceiptError('DELIVERED',{},{}),null);
 const policy={DELIVERY_RECIPIENT_MODE:'REQUIRED',DELIVERY_SIGNATURE_MODE:'REQUIRED'};
 assert.equal(deliveryReceiptError('REJECTED',{},policy),null);
 assert.match(deliveryReceiptError('PARTIAL_REJECT',{},policy),/nama/i);
 assert.match(deliveryReceiptError('DELIVERED',{recipientName:'Ibu Sari'},policy),/tanda tangan/i);
 assert.match(deliveryReceiptError('DELIVERED',{recipientName:'Ibu Sari'},{DELIVERY_RECIPIENT_MODE:'DISABLED'}),/dinonaktifkan/);
 assert.equal(validReceiptSignature('data:image/svg+xml;base64,abc'),false);
 assert.equal(validReceiptSignature('https://example.com/sign.png'),false);
 assert.equal(policyConflicts({...CONFIG_DEFAULTS,DELIVERY_RECIPIENT_MODE:'DISABLED',DELIVERY_SIGNATURE_MODE:'REQUIRED'}).some(v=>v.includes('Tanda tangan')),true);
});
