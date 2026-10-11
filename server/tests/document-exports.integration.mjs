import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../client/package.json',import.meta.url));
const {build}=require('esbuild');
const client=fileURLToPath(new URL('../../client/',import.meta.url));
const out=fileURLToPath(new URL('../../.backups/export-verification/',import.meta.url));
await mkdir(out,{recursive:true});
const result=await build({absWorkingDir:client,bundle:true,platform:'node',format:'cjs',packages:'external',supported:{'dynamic-import':false},write:false,define:{'import.meta.env':'{}'},stdin:{resolveDir:client,contents:`
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {buildNooDocumentBlueprint,exportNooDocument} from './src/utils/export/documents/nooDocumentExport';
import {exportPackingList} from './src/utils/export/documents/packingListExport';
import {exportWeeklyReport} from './src/utils/export/reports/weeklyReportExport';
import {exportMtdReport} from './src/utils/export/reports/mtdReportExport';
import {exportDailyCallReport} from './src/utils/export/reports/dailyCallReportExport';
import {exportSuspiciousAttendance} from './src/utils/export/reports/suspiciousAttendanceExport';
import {exportOutletMaster} from './src/utils/export/reports/outletMasterExport';
import {exportImportNik} from './src/utils/export/documents/importNikExport';
import {exportCustomerExcel} from './src/utils/customerExport';
import {deliveryGpsUnavailable} from '../shared/delivery-location-status.mjs';
import {buildDocumentPdf} from './src/utils/export/core/pdfBuilder';
import {buildDocumentCsv} from './src/utils/export/core/csvBuilder';
module.exports=(async()=>{
const captures=[];
globalThis.__EXPORT_CAPTURE__=d=>captures.push(d);
const fixture={id:'fixture',name:'Toko A & B <Utama>',registrationCode:'NOO-TEST',customerCode:'00001',taxNumber:'0012345678901234',createdAt:'2026-10-10T18:00:00Z',photoUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAIAAAD4YuoOAAAAJ0lEQVR4nGPkT6lgoCVgoqnpDKMWEAFG44AgGA0igmA0iAiCoR9EAPXMAQvV8BzPAAAAAElFTkSuQmCC'};
const missing=JSON.stringify(buildNooDocumentBlueprint({name:'Test'}));
for(const invented of ['CIMAHI','BELFOODS','CMH','Sesuai prosedur','PHOTO-REG-LIVE','Lat: 0'])assert.ok(!missing.includes(invented),invented);
assert.equal(deliveryGpsUnavailable({departedAt:'date',locationPolicy:{enabled:false}}),false);
assert.equal(deliveryGpsUnavailable({departedAt:'date',location:null}),true);
assert.equal(deliveryGpsUnavailable({departedAt:'date',returnedAt:'date'}),false);
assert.match(buildDocumentCsv({sections:[{headers:['Nama','Nomor'],rows:[['=HYPERLINK("bad")','00123'],['A,"B"\\nC',-6.9]]}]}),/"'=HYPERLINK/);
const sales={salesmanName:'Sales Test',clusterName:'Bandung',weeklyTotal:{plan:2,actual:1,ec:1,omzet:null},mtdActualAmount:null};
const visit={no:1,salesmanName:'Sales Test',customerName:fixture.name,planCall:'Y',actualCall:'Y',effectiveCall:'N',orderAmount:null};
const multiLoad={code:'PL-MULTI',loadPlanVersion:2,createdAt:fixture.createdAt,totalCartons:5,items:[{lineId:'a',destinationId:'one',sourceOrderId:'so-a',sourceOrderCode:'SO-A',name:'Nugget',sku:'SKU-A',quantity:10,unit:'pak'},{lineId:'b',destinationId:'two',sourceOrderId:'so-b',sourceOrderCode:'SO-B',name:'Sosis',sku:'SKU-B',quantity:20,unit:'pak'}],destinations:[{id:'one',outletId:'toko-a',outlet:{name:'Toko Satu',address:'Alamat Satu'},sourceOrderIds:['so-a'],totalCartons:2,totalWeight:10,point:{latitude:-6.88,longitude:107.48}},{id:'two',outletId:'toko-b',outlet:{name:'Toko Dua',address:'Alamat Dua'},sourceOrderIds:['so-b'],totalCartons:3,totalWeight:null,point:{latitude:-6.89,longitude:107.49}}],invoices:[{id:'inv-a',invoiceNumber:'INV-A',destinationId:'one',sourceOrderIds:['so-a'],items:[{lineId:'a',quantity:10}],totalCartons:2},{id:'inv-b',invoiceNumber:'INV-B',destinationId:'two',sourceOrderIds:['so-b'],items:[{lineId:'b',quantity:20}],totalCartons:3}]};
const suites=[['noo',exportNooDocument(fixture)],['packing',exportPackingList({code:'PL-TEST',items:[{name:fixture.name,quantity:2,unit:'pak'}]})],['weekly',exportWeeklyReport({salesmen:[sales],daysSummary:[],period:{}})],['mtd',exportMtdReport({salesmen:[sales],period:{}})],['daily',exportDailyCallReport({rows:[visit],period:{},summary:{totalOrderAmount:null}})],['outlet',exportOutletMaster([fixture])],['nik',exportImportNik([fixture])],['audit',exportSuspiciousAttendance([visit])]];
for(const [name,exporters] of suites){
 for(const [ext,method] of [['docx','toDocx'],['xlsx','toExcel'],['csv','toCsv'],['pdf','toPdf']]){
  const value=await exporters[method]();
  const bytes=typeof value==='string'?Buffer.from(value):Buffer.from(value instanceof Blob?await value.arrayBuffer():value);
  assert.ok(bytes.length>50,name+ext);
  if(ext==='csv'&&['weekly','mtd','daily','audit'].includes(name))assert.match(bytes.toString(),/Sales Test/);
  if(ext==='pdf')assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
  if(ext==='docx'){
   const zip=await JSZip.loadAsync(bytes);assert.ok(zip.file('word/document.xml'));
   if(name==='noo'){assert.ok(Object.keys(zip.files).some(p=>p.startsWith('word/media/')&&!zip.files[p].dir));assert.match(await zip.file('word/document.xml').async('string'),/Toko A &amp; B/);}
  }
  if(ext==='xlsx'){
   const wb=new ExcelJS.Workbook();await wb.xlsx.load(bytes);assert.ok(wb.worksheets.length);
   if(name==='noo')assert.ok(wb.worksheets[0].getImages().length===1);
   if(name==='nik')assert.equal(wb.worksheets[0].getCell('C2').value,'0012345678901234');
  }
  writeFileSync(${JSON.stringify(out)}+'/'+name+'.'+ext,bytes);
 }
}
for(const [ext,method] of [['docx','toDocx'],['xlsx','toExcel'],['csv','toCsv'],['pdf','toPdf']]){
 const value=await exportPackingList(multiLoad)[method]();
 const bytes=Buffer.from(typeof value==='string'?value:value instanceof Blob?await value.arrayBuffer():value);
 if(ext==='csv')for(const expected of ['Toko Satu','Toko Dua','INV-A','INV-B','SO-A','SO-B','belum diketahui'])assert.ok(bytes.toString().includes(expected),expected);
 if(ext==='docx'){const zip=await JSZip.loadAsync(bytes);const xml=await zip.file('word/document.xml').async('string');for(const expected of ['Toko Satu','Toko Dua','INV-A','INV-B','SO-A','SO-B'])assert.ok(xml.includes(expected),expected);}
 if(ext==='xlsx'){const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(bytes);const content=JSON.stringify(workbook.worksheets.map(sheet=>sheet.getSheetValues()));for(const expected of ['Toko Satu','Toko Dua','INV-A','INV-B','SO-A','SO-B'])assert.ok(content.includes(expected),expected);}
 if(ext==='pdf')assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
 writeFileSync(${JSON.stringify(out)}+'/packing-multi.'+ext,bytes);
}
const jpeg=exportNooDocument({...fixture,photoUrl:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDjaKKK+dPbCiiigD//2Q=='});
for (const method of ['toDocx','toExcel','toPdf']) await jpeg[method]();
const legacy=await exportCustomerExcel([fixture]);
const wb=new ExcelJS.Workbook();await wb.xlsx.load(legacy);
assert.deepEqual(wb.worksheets.map(s=>s.name),['IMPORT_ND6_CUSTOMER','REKAP_REGISTRASI_LENGKAP']);
assert.equal(wb.worksheets[0].getCell('B1').value,'DocumentStart');
assert.equal(wb.worksheets[0].getCell('F6').value,'00001');
await assert.rejects(()=>exportNooDocument({...fixture,photoUrl:'data:image/png;base64,bad'}).toPdf(),/Foto/);
const longPdf=await buildDocumentPdf({title:'Uji halaman panjang',sections:[{headers:['No','Nama'],rows:Array.from({length:200},(_,i)=>[i,'Toko panjang '.repeat(15)])}],notes:['Catatan '.repeat(3000)]});
writeFileSync(${JSON.stringify(out)}+'/multipage.pdf',Buffer.from(longPdf));
assert.equal(captures.length,40);
console.log('PASS: 36 files across eight templates including multi-store packing, actual OOXML/XLSX reopening, embedded photos, leading-zero NIK, CSV escaping, pending GPS policy, multipage PDF and legacy XLSX.');
})();
`,loader:'js'}});
const mod={exports:{}};
await new Function('require','module','exports',result.outputFiles[0].text+'\nreturn module.exports;')(require,mod,mod.exports);
