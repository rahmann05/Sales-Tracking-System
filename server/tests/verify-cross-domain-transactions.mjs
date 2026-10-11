// Pair coverage is measured over these explicit workflow dimensions, not all 459 parameters.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pairwiseCases,assertPairwiseCoverage} from './helpers/pairwise.mjs';
assert.ok(process.argv.includes('--local'));
const dimensions={approval:['NONE','ADMIN','SUPERVISOR','BOTH','SEQUENTIAL'],sales:['IN_OUT','IN_ONLY','OPTIONAL'],warehouse:['ALL','LOAD_ONLY','NONE'],supervision:['IN_OUT','IN_ONLY','OPTIONAL'],followUpReview:[true,false],returnInspection:[true,false]};
const cases=pairwiseCases(dimensions);assertPairwiseCoverage(assert,dimensions,cases);
const directory='../.backups/cross-domain-transactions';fs.mkdirSync(directory,{recursive:true});
const file='../docs/SYSTEM_CROSS_DOMAIN_TRANSACTIONS_20261011.json';
const prior=process.argv.includes('--retry-failed')&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
const report=prior||{at:new Date().toISOString(),environment:'LOCAL',dimensions,cases:[],scope:'Full HTTP order/packing/two delivery trips/return/supervision/follow-up/outlet field validation across a measured pairwise covering array; synthetic field evidence'};
for(const [index,combination] of cases.entries()){
 if(prior&&report.cases[index]?.status==='PASS')continue;
 const values={ORDER_APPROVAL_MODE:combination.approval,ORDER_APPROVAL_AMOUNT_THRESHOLD:0,SALES_ATTENDANCE_MODE:combination.sales,SPV_ATTENDANCE_MODE:combination.supervision,WAREHOUSE_REQUIRE_PICK:combination.warehouse==='ALL',WAREHOUSE_REQUIRE_CHECK:combination.warehouse==='ALL',WAREHOUSE_REQUIRE_LOAD:combination.warehouse!=='NONE',FOLLOW_UP_REQUIRE_REVIEW:combination.followUpReview,TRIP_REQUIRE_RETURN_INSPECTION:combination.returnInspection,FEATURE_NOTIFICATIONS_MODE:'OFF'};
 const reportPath=directory+'/case-'+index+'.json',input=directory+'/input-'+index+'.json';fs.writeFileSync(input,JSON.stringify({values,combination,reportPath}));
 const run=spawnSync(process.execPath,['tests/verify-transaction-runtime.mjs','--local','--case='+input],{encoding:'utf8',timeout:120000,windowsHide:true});
 fs.writeFileSync(directory+'/case-'+index+'.log',run.stdout+'\n'+run.stderr);
 const result=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath)):{};
 const entry={combination,status:run.status===0&&result.status==='PASS'&&result.cleanup==='PASS'?'PASS':'FAIL',checks:result.checks?.length||0,cleanup:result.cleanup,error:result.error||run.error?.message,report:reportPath};
 if(report.cases[index])entry.previousAttempts=[...(report.cases[index].previousAttempts||[]),report.cases[index]];
 report.cases[index]=entry;fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(`${index+1}/${cases.length} ${entry.status} ${JSON.stringify(combination)} ${entry.error||''}`);
}
report.passed=report.cases.filter(c=>c.status==='PASS').length;report.failed=report.cases.length-report.passed;report.checks=report.cases.reduce((n,c)=>n+c.checks,0);report.pairCoverageComplete=report.failed===0;report.completedAt=new Date().toISOString();
fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:cases.length,passed:report.passed,failed:report.failed,checks:report.checks}));process.exitCode=report.failed?1:0;
