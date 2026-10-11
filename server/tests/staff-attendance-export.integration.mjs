import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
const require=createRequire(new URL('../../client/package.json',import.meta.url));
const {build}=require('esbuild');
const client=fileURLToPath(new URL('../../client/',import.meta.url));
const out=fileURLToPath(new URL('../../.backups/attendance-export/',import.meta.url));
await mkdir(out,{recursive:true});
const result=await build({absWorkingDir:client,bundle:true,platform:'node',format:'cjs',packages:'external',supported:{'dynamic-import':false},write:false,define:{'import.meta.env':'{}'},stdin:{resolveDir:client,loader:'js',contents:`
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {buildStaffAttendanceBlueprint,staffAttendanceExporters} from './src/utils/export/reports/staffAttendanceExport';
module.exports=(async()=>{
 const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAIAAAD4YuoOAAAAJ0lEQVR4nGPkT6lgoCVgoqnpDKMWEAFG44AgGA0igmA0iAiCoR9EAPXMAQvV8BzPAAAAAElFTkSuQmCC';
 const row={id:'QA-ATTENDANCE-001',dateKey:'2026-10-11',kind:'SHIFT',user:{name:'Staf Uji Foto',role:'SUPIR'},checkInAt:'2026-10-11T01:05:00Z',checkOutAt:null,photoUrl:photo,latitude:-6.885,longitude:107.489,notes:'Masuk, catatan asli',gpsEvidence:{accuracy:12,observedAt:'2026-10-11T01:04:55Z',receivedAt:'2026-10-11T01:05:00Z'},policySnapshot:{values:{SHIFT_ATTENDANCE_MODE:'IN_OUT',SHIFT_START_TIME:'08:00',SHIFT_END_TIME:'17:00'}},checklist:{state:'FINISHED',finishedAt:'2026-10-11T10:00:00Z',finishEvidence:{photoUrl:photo,latitude:-6.896,longitude:107.548,notes:'Foto selesai'}},timeCorrection:{accepted:{checkInAt:'2026-10-11T01:00:00Z',checkOutAt:'2026-10-11T10:00:00Z',reason:'Koreksi administratif',decidedByName:'Admin Uji'}}};
 const rows=[row,{id:'QA-ATTENDANCE-002',dateKey:row.dateKey,kind:'VISIT',user:{name:'SPV Uji',role:'SUPERVISOR'},checkInAt:'2026-10-11T02:00:00Z',outletName:'Toko Uji',checklist:{salesGreeting:false,_evidence:{salesGreeting:{photoUrl:photo,reason:'Perlu diperiksa'}}}}];
 const captures=[];globalThis.__EXPORT_CAPTURE__=file=>captures.push(file);
 assert.equal(buildStaffAttendanceBlueprint(rows,{date:row.dateKey}).images.length,3);
 assert.equal(buildStaffAttendanceBlueprint(rows,{date:row.dateKey,includePhotos:false}).images.length,0);
 for(const [ext,method] of [['docx','exportDocx'],['xlsx','exportExcel'],['csv','exportCsv'],['pdf','exportPdf']]){
  const output=await staffAttendanceExporters[method](rows,{date:row.dateKey,includePhotos:ext!=='csv'});
  const bytes=Buffer.from(typeof output==='string'?output:output instanceof Blob?await output.arrayBuffer():output);
  if(ext==='docx'){const zip=await JSZip.loadAsync(bytes);const xml=await zip.file('word/document.xml').async('string');assert.match(xml,/Koreksi administratif/);assert.match(xml,/Perlu diperiksa/);assert.ok(Object.keys(zip.files).some(p=>p.startsWith('word/media/')&&!zip.files[p].dir));assert.equal((xml.match(/<w:drawing>/g)||[]).length,3);}
  if(ext==='xlsx'){const wb=new ExcelJS.Workbook();await wb.xlsx.load(bytes);assert.equal(wb.worksheets[0].getImages().length,3);assert.match(JSON.stringify(wb.worksheets[0].getSheetValues()),/Koreksi administratif/);}
  if(ext==='csv'){const csv=bytes.toString();assert.match(csv,/CSV tidak memuat gambar/);assert.match(csv,/QA-ATTENDANCE-001/);assert.match(csv,/google.com/);assert.match(csv,/Tidak tersimpan/);assert.ok(!csv.includes('data:image'));}
  if(ext==='pdf')assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
  writeFileSync(${JSON.stringify(out)}+'/staff-attendance.'+ext,bytes);
 }
 assert.equal(captures.length,4);
 await assert.rejects(()=>staffAttendanceExporters.exportPdf([{...row,photoUrl:'data:image/png;base64,bad'}],{date:row.dateKey}),/Foto/);
 console.log('PASS: attendance DOCX, XLSX, CSV, PDF; 3 embedded photos, correction separation, missing evidence, GPS references and invalid-photo rejection.');
})();`}});
const mod={exports:{}};
await new Function('require','module','exports',result.outputFiles[0].text+'\nreturn module.exports;')(require,mod,mod.exports);
