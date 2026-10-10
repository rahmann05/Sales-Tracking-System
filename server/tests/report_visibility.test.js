import test from 'node:test';
import assert from 'node:assert/strict';
import {redactReport,reportMoney,REPORT_VISIBILITY_KEYS} from '../../shared/report-visibility.mjs';
import {weeklyCsv} from '../../shared/report-semantics.mjs';
test('Report restrictions redact nested summaries, rows, targets and archive payload without mutating evidence',()=>{
 const report={basis:{formulaVersion:'retained'},summary:{totalOrderAmount:987654},rows:[{customerName:'Toko Uji',customerLat:-6.9,customerLng:107.6,photoIn:'secret-image',customerAddress:'secret-address',orderAmount:12345,actualCall:'Y',visitOutcome:{attachments:['secret-attachment']}}],salesmen:[{target:{amount:54321,achievement:'12%',status:'SET'},weeklyTotal:{target:54321,omzet:12345}}]};
 const values=Object.fromEntries(REPORT_VISIBILITY_KEYS.map(key=>[key,false]));
 const result=redactReport({payload:report},values);
 for(const secret of ['987654','12345','54321','-6.9','107.6','secret-image','secret-address','secret-attachment'])assert.ok(!JSON.stringify(result).includes(secret),secret);
 assert.equal(result.payload.rows[0].actualCall,'Y');assert.equal(result.payload.rows[0].customerName,'Toko Uji');
 assert.equal(result.payload.salesmen[0].target.status,'RESTRICTED');
 assert.ok(result.payload.basis.restrictionNote);assert.equal(report.summary.totalOrderAmount,987654);
 assert.deepEqual(redactReport(report,{}),report);
 assert.equal(redactReport(report,{REPORT_SHOW_CONTACT:false}).summary.totalOrderAmount,987654);
});
test('Masked monetary values are never exported or rendered as measured zero',()=>{
 assert.match(reportMoney(null),/Dibatasi/);assert.equal(reportMoney(0),'Rp 0');
 const csv=weeklyCsv({period:{weekDays:[{dayName:'Senin',dateStr:'12'}]},salesmen:[{days:{senin:{omzet:null}}}]});
 assert.match(csv,/Dibatasi aturan laporan/);
});
