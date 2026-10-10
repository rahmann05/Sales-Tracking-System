import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visitOutcomeSchema} from '../src/modules/absensi/visit-outcome.schema.js';
import {checkOutSchema} from '../src/modules/absensi/absensi.schema.js';
import {createOffPjpAttendanceSchema} from '../src/modules/absensi/off-pjp.schema.js';
import {visitOutcomeText,visitResultPolicyError,validVisitAttachment} from '../../shared/visit-outcome.mjs';
import {visitSalesResult,offPjpSalesResult} from '../../shared/visit-metrics.mjs';
const outcome={purpose:'COLLECTION',reference:'INV-EXTERNAL-7',result:'PROMISED',promiseDate:'2026-10-12',note:'Pemilik berjanji transfer Senin'};
test('collection visits retain external document references and promises',()=>{
 assert.deepEqual(visitOutcomeSchema.parse(outcome),outcome);assert.match(visitOutcomeText(outcome),/INV-EXTERNAL-7/);assert.match(visitOutcomeText(outcome),/2026-10-12/);
});
test('collection requires reference, result, note and valid promise date',()=>{
 for(const key of ['reference','result','note','promiseDate']){const value={...outcome};delete value[key];assert.equal(visitOutcomeSchema.safeParse(value).success,false,key);}
 assert.equal(visitOutcomeSchema.safeParse({...outcome,promiseDate:'2026-02-30'}).success,false);
});
test('order purpose discards stale collection fields and refuses payment ledger fields',()=>{
 assert.deepEqual(visitOutcomeSchema.parse({...outcome,purpose:'ORDER'}),{purpose:'ORDER',note:outcome.note});
 assert.equal(visitOutcomeSchema.safeParse({...outcome,paidAmount:1000}).success,false);
});
test('generic results retain notes, offers, obstacles and safe image attachments',()=>{
 const data={purpose:'OTHER',note:'Pemilik tidak berada di toko',offer:'Katalog Belfoods disampaikan',obstacle:'Minta kunjungan ulang',attachments:[{name:'foto.png',dataUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII='}]};
 assert.deepEqual(visitOutcomeSchema.parse(data),data);assert.match(visitOutcomeText(data),/Katalog Belfoods/);
 assert.equal(validVisitAttachment('data:image/svg+xml;base64,PHN2Zz4='),false);
 assert.equal(visitOutcomeSchema.safeParse({...data,attachments:[{name:'fake.png',dataUrl:'data:image/png;base64,PHN2Zz4='}]}).success,false);
 assert.equal(visitOutcomeSchema.safeParse({...data,attachments:Array(4).fill(data.attachments[0])}).success,false);
});
test('required result fields imply purpose; disabled fields cannot be silently submitted',()=>{
 assert.match(visitResultPolicyError(null,{VISIT_RESULT_OFFER_MODE:'REQUIRED'}),/tujuan/);
 assert.match(visitResultPolicyError({purpose:'ORDER'},{VISIT_RESULT_OFFER_MODE:'REQUIRED'}),/penawaran/);
 assert.match(visitResultPolicyError({purpose:'OTHER',obstacle:'Jalan ditutup'},{VISIT_RESULT_OBSTACLE_MODE:'DISABLED'}),/dinonaktifkan/);
 assert.match(visitResultPolicyError({purpose:'OTHER'},{VISIT_RESULT_ATTACHMENT_MODE:'REQUIRED'}),/Lampiran/);
 assert.equal(visitResultPolicyError({purpose:'ORDER',offer:'Katalog baru'},{VISIT_RESULT_OFFER_MODE:'REQUIRED'}),null);
});
test('outside payment report is never counted as a new sale or automatic effective call',()=>{
 const visitOutcome={...outcome,result:'REPORTED_PAID'};
 const pjp=visitSalesResult({attendances:[{type:'IN'},{type:'OUT',visitOutcome}],orders:[]});
 assert.equal(pjp.actual,true);assert.equal(pjp.effective,false);assert.equal(pjp.orderAmount,0);
 const off=offPjpSalesResult({status:'APPROVED',visitOutcome});assert.equal(off.actual,true);assert.equal(off.effective,false);assert.equal(off.orderAmount,0);
});
test('PJP and off-PJP request contracts both preserve structured outcomes',()=>{
 const id='10000000-0000-4000-8000-000000000001';
 assert.deepEqual(checkOutSchema.parse({params:{pjpStopId:id},body:{latitude:0,longitude:0,visitOutcome:outcome}}).body.visitOutcome,outcome);
 assert.deepEqual(createOffPjpAttendanceSchema.parse({body:{outletName:'Toko Lama',address:'Alamat toko',reason:'Menagih nota',latitude:0,longitude:0,visitOutcome:outcome}}).body.visitOutcome,outcome);
});
