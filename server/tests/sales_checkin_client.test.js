import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('Sales check-in API preserves real GPS accuracy and acquisition timestamp',async()=>{
 const source=readFileSync(new URL('../../client/src/services/api/absensiApi.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export const absensiApi','const absensiApi');
 let sent;
 const context={request:async(url,options)=>{sent={url,...options};return {success:true};},queryString:()=>''};
 vm.runInNewContext(source+'\nglobalThis.api=absensiApi;',context);
 const payload={latitude:-6.9,longitude:107.6,accuracy:8.25,observedAt:'2026-10-10T10:00:00.000Z',photoUrl:null,notes:'Kunjungan uji'};
 await context.api.checkIn('test-stop',payload);
 assert.equal(sent.url,'/absensi/test-stop/in');assert.equal(sent.method,'POST');assert.deepEqual(JSON.parse(sent.body),payload);
});
