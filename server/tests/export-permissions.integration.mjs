import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../../client/package.json',import.meta.url));
const {build}=require('esbuild');
const client=fileURLToPath(new URL('../../client/',import.meta.url));
const result=await build({absWorkingDir:client,bundle:true,platform:'node',format:'cjs',write:false,
 plugins:[{name:'controlled-api',setup(build){
  build.onResolve({filter:/httpClient$/},()=>({path:'api',namespace:'mock'}));
  build.onResolve({filter:/notificationService$/},()=>({path:'notices',namespace:'mock'}));
  build.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path==='api'?'export const request=(path)=>globalThis.exportRequest(path);':'export const notifyError=message=>globalThis.notices.push(message);'}));
 }}],stdin:{resolveDir:client,contents:`
import assert from 'node:assert/strict';
import {downloadOperationalFile,printOperationalDocument} from './src/services/operationalExportService';
module.exports=(async()=>{
 let clicks=0,prints=0,creates=0;
 globalThis.notices=[];
 globalThis.window={print(){prints++;}};
 let token='fixture';globalThis.localStorage={getItem:()=>token};
 globalThis.document={body:{appendChild(){}},createElement:()=>({click(){clicks++;},remove(){}})};
 URL.createObjectURL=()=>{creates++;return 'blob:fixture';};URL.revokeObjectURL=()=>{};
 for(const problem of [Object.assign(new Error('Forbidden'),{status:403}),Object.assign(new Error('Expired'),{status:401}),new Error('Offline')]){
  globalThis.exportRequest=async()=>{throw problem;};
  await assert.rejects(()=>downloadOperationalFile('secret','test.csv'));
  await printOperationalDocument();
 }
 globalThis.exportRequest=async()=>({data:{allowed:false}});
 await assert.rejects(()=>downloadOperationalFile('secret','test.csv'));
 globalThis.exportRequest=async()=>({});
 await assert.rejects(()=>downloadOperationalFile('secret','test.csv'));
 token='';await assert.rejects(()=>downloadOperationalFile('secret','test.csv'));
 assert.equal(clicks,0);assert.equal(creates,0);assert.equal(prints,0);
 token='fixture';
 let release;
 globalThis.exportRequest=path=>{assert.match(path,/domain=REPORTS/);return new Promise(resolve=>{release=resolve;});};
 const pending=downloadOperationalFile('allowed','test.csv','text/csv','REPORT');
 await Promise.resolve();assert.equal(clicks,0);assert.equal(creates,0);
 release({data:{allowed:true}});await pending;assert.equal(clicks,1);assert.equal(creates,1);
 globalThis.exportRequest=async()=>({data:{allowed:true}});
 await printOperationalDocument();assert.equal(prints,1);
 console.log('PASS: export waits for authorization; 403, expired session, offline, invalid response and no session produce no download or print.');
})();
`}});
const mod={exports:{}};
await new Function('require','module','exports',result.outputFiles[0].text+'\nreturn module.exports;')(require,mod,mod.exports);
