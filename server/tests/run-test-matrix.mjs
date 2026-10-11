// Runs local automated evidence only. Never includes billable Google or production tests.
import 'dotenv/config';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

assert.ok(process.argv.includes('--local'),'Explicit --local required');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local database only');
const server=fileURLToPath(new URL('../',import.meta.url)),root=path.dirname(server);
const logs=path.join(root,'.backups','test-matrix-final');fs.mkdirSync(logs,{recursive:true});
const integrations=fs.readdirSync(path.join(server,'tests')).filter(name=>name.endsWith('.integration.mjs')).sort().map(name=>'tests/'+name);
const extra=['verify-report-archives','verify-operational-workflows','verify-delivery-control','verify-order-integrity','verify-invoice-reconciliation','verify-logistics-ui','verify-sales-ui','verify-supervisor-ui','verify-admin-navigation'].map(name=>'scripts/'+name+'.mjs');
let scripts=[...integrations,...extra];
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):/\.(js|jsx|mjs)$/.test(e.name)?[path.join(dir,e.name)]:[]);
const sourceHash=createHash('sha256');
for(const file of ['shared','server/src','client/src','server/tests','server/scripts'].flatMap(dir=>walk(path.join(root,dir))).sort())sourceHash.update(path.relative(root,file).replaceAll('\\','/')).update('\0').update(fs.readFileSync(file)).update('\0');
const reportPath=path.join(root,'docs','SYSTEM_TEST_EXECUTION_20261011.json');
const fingerprint=sourceHash.digest('hex'),retry=process.argv.includes('--retry-failed');
const dependenciesSha256=createHash('sha256').update(fs.readFileSync(path.join(server,'package-lock.json'))).update(fs.readFileSync(path.join(root,'client/package-lock.json'))).digest('hex');
const previous=retry?JSON.parse(fs.readFileSync(reportPath,'utf8')):null;
if(retry){assert.equal(previous.environment,'LOCAL');scripts=scripts.filter(script=>previous.results.some(r=>r.script===script&&r.status==='FAIL'));}
const report=previous?{...previous,results:previous.results.map(r=>({...r,sourceSha256:r.sourceSha256||previous.sourceSha256})),lastRetryAt:new Date().toISOString(),lastRetrySourceSha256:fingerprint}:{startedAt:new Date().toISOString(),environment:'LOCAL',sourceSha256:fingerprint,scope:'Automated integration / SSR / mock adapters; not browser, device, field truth or production UAT',results:[]};
report.dependenciesSha256=dependenciesSha256;
for(const script of scripts){
 const started=Date.now(),logPath=path.join(logs,path.basename(script,'.mjs')+'.log'),output=fs.openSync(logPath,'w');
 const result=await new Promise(resolve=>{
  const child=spawn(process.execPath,[script],{cwd:server,env:process.env,stdio:['ignore',output,output],windowsHide:true});
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;child.kill();},180000);
  child.once('error',error=>{clearTimeout(timer);resolve({exitCode:null,error:error.message,timedOut});});
  child.once('close',(exitCode,signal)=>{clearTimeout(timer);resolve({exitCode,signal,timedOut});});
 });
 fs.closeSync(output);
 const lines=fs.readFileSync(logPath,'utf8').split(/\r?\n/).filter(Boolean);
 const proof=lines.filter(line=>/passed|PASS \d/i.test(line)).at(-1)||null;
 const status=result.exitCode===0&&!result.timedOut?'PASS':'FAIL';
 const entry={script,status,...result,sourceSha256:fingerprint,durationMs:Date.now()-started,proof,log:path.relative(root,logPath).replaceAll('\\','/')};
 const previousIndex=report.results.findIndex(r=>r.script===script);
 if(previousIndex>=0){entry.previousAttempts=[...(report.results[previousIndex].previousAttempts||[]),report.results[previousIndex]];report.results[previousIndex]=entry;}else report.results.push(entry);
 fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
 console.log(`${retry?'[RETRY]':`[${report.results.length}/${scripts.length}]`} ${status} ${script}${proof?' — '+proof:''}`);
 if(status==='FAIL')console.log(lines.slice(-14).join('\n'));
}
report.completedAt=new Date().toISOString();report.passed=report.results.filter(r=>r.status==='PASS').length;report.failed=report.results.length-report.passed;
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(`Local matrix: ${report.passed}/${report.results.length} PASS, ${report.failed} FAIL; browser/device/production remain separate.`);
process.exitCode=report.failed?1:0;
