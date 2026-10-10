import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSpreadsheetCsv,readSpreadsheetRecords} from '../../client/src/services/spreadsheetImportService.js';
import {rjpImportAction,previewRjpImport} from '../src/modules/clusters/services/rjp-import-preview.service.js';

test('mapped CSV preserves quoted addresses, stable identity and optional frequency',()=>{
 const csv='Kode,Nama,Alamat,Kawasan,Wilayah,Y,X\nO1,Toko,"Jalan, 12",Cimahi,Barat,-6.9,107.6';
 const mapping={OutletCode:'Kode',CustomerName:'Nama',Address:'Alamat',ClusterName:'Wilayah',Area:'Kawasan',Lat:'Y',Lng:'X',Frequency:'',ClusterCode:''};
 const [row]=parseSpreadsheetCsv(csv,mapping);
 assert.equal(row.outletCode,'O1');assert.equal(row.address,'Jalan, 12');assert.equal(row.callFrequency,undefined);
 assert.throws(()=>parseSpreadsheetCsv(csv,{...mapping,Area:'Alamat'}),/beberapa field/);
 assert.throws(()=>readSpreadsheetRecords('\uFEFFKode, Kode\n1,2'),/duplikat/);
 assert.throws(()=>parseSpreadsheetCsv(csv,{...mapping,Lat:''}),/Header CSV wajib/);
});

test('import dispositions never convert update-only into new master creation',()=>{
 assert.equal(rjpImportAction({importAction:'UPDATE_ONLY'},null).action,'SKIP');
 assert.equal(rjpImportAction({importAction:'CREATE_ONLY'},{id:'old'}).action,'SKIP');
 assert.equal(rjpImportAction({importAction:'SKIP'},{id:'old'}).action,'SKIP');
 assert.equal(rjpImportAction({importAction:'UPSERT'},{id:'old'}).action,'UPDATE');
 assert.equal(rjpImportAction({importAction:'CREATE_ONLY'},null).action,'CREATE');
});

test('preview excludes skipped outlets from impacts and binds token to disposition',async()=>{
 const existing={id:'outlet',outletCode:'O1',clusterId:'old',cluster:{name:'Lama',supervisorId:'s'},latitude:0,longitude:0,updatedAt:new Date('2026-01-01')};
 const row={clusterName:'Baru',outletCode:'O1',customerName:'Toko',address:'Jalan',area:'Kota',latitude:-6.9,longitude:107.6,importAction:'CREATE_ONLY'};
 const references=[];
 const db={outlet:{findMany:async()=>[existing]},cluster:{findMany:async()=>[]},pjpPlan:{findMany:async()=>[]},pjpStop:{findMany:async()=>[]},pjpTemplateStop:{findMany:async({where})=>{references.push(where.outletId.in);return [];}}};
 const skipped=await previewRjpImport([row],{role:'ADMIN'},db);
 assert.equal(skipped.summary.skipped,1);assert.equal(skipped.summary.moved,0);assert.equal(skipped.summary.coordinatesChanged,0);assert.deepEqual(references[0],[]);
 const updated=await previewRjpImport([{...row,importAction:'UPSERT'}],{role:'ADMIN'},db);
 assert.notEqual(updated.token,skipped.token);assert.deepEqual(references[1],['outlet']);
 await assert.rejects(()=>previewRjpImport([row,row],{role:'ADMIN'},db),/duplikat/);
 await assert.rejects(()=>previewRjpImport([row],{role:'SUPERVISOR',id:'foreign'},db),/luar wilayah/);
});
