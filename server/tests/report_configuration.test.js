import {test} from 'node:test';
import assert from 'node:assert/strict';
import {REPORT_PRESENTATION,reportSelection,selectedReportItems,reportExportAllowed} from '../../shared/report-presentation.mjs';
import {CONFIG_PARAMS,parseConfigValue} from '../../shared/config.mjs';
import {reportProvenance,REPORT_FORMULA_VERSION} from '../src/modules/reports/services/report-provenance.service.js';
import {weeklyCsv,dailyCallCsv,measuredVisitMinutes,attendanceAuditCsv,durationStatus,distanceStatus} from '../../shared/report-semantics.mjs';
import {prisma} from '../src/config/prisma.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {getWeeklyReport} from '../src/modules/reports/services/get-weekly-report.service.js';
import {getDailyCallReport} from '../src/modules/daily-calls/services/get-daily-call-report.service.js';
test('presentation accepts hiding every optional field, ordered widgets and only unique known choices',()=>{
 for(const [key,allowed] of Object.entries(REPORT_PRESENTATION)){
  assert.deepEqual(selectedReportItems({},key),allowed);assert.deepEqual(reportSelection(key,''),[]);
  const param=CONFIG_PARAMS.find(p=>p.key===key);assert.equal(parseConfigValue(param,' '+allowed[1]+', '+allowed[0]),allowed[1]+','+allowed[0]);
  for(const raw of ['unknown',allowed[0]+','+allowed[0],allowed[0]+',',null])assert.throws(()=>parseConfigValue(param,raw));
 }
});
test('report display choices cannot grant export permission or override a paused or disabled export feature',()=>{
 const user={permissions:{can_export_reports:true}},values={FEATURE_EXPORT_MODE:'ACTIVE',REPORT_EXPORT_ENABLED:true,REPORT_WEEKLY_COLUMNS:''};
 assert.equal(reportExportAllowed(user,values),true);
 for(const FEATURE_EXPORT_MODE of ['PAUSED','OFF'])assert.equal(reportExportAllowed(user,{...values,FEATURE_EXPORT_MODE}),false);
 assert.equal(reportExportAllowed(user,{...values,REPORT_EXPORT_ENABLED:false}),false);
 assert.equal(reportExportAllowed({permissions:{can_export_reports:false}},values),false);assert.equal(reportExportAllowed(null,values),false);
});
test('report policy provenance groups equivalent snapshots, retains formula/rules and explicitly counts unknown legacy data',()=>{
 const snapshot={values:{SALES_ATTENDANCE_MODE:'IN_ONLY'},versions:[{scope:'TEAM:spv',revision:2},{scope:'GLOBAL',revision:4}]};
 const report=reportProvenance({manualSalesMode:'NOTES_ONLY'},{rawRecords:[{stops:[{policySnapshot:snapshot,orders:[{policySnapshot:{values:{TAX_RATE_PERCENT:11},versions:[]}}]},{policySnapshot:{...snapshot,versions:[...snapshot.versions].reverse()}},{}]}]});
 assert.equal(report.formulaVersion,REPORT_FORMULA_VERSION);assert.deepEqual(report.calculationRules,{manualSalesMode:'NOTES_ONLY'});
 assert.equal(report.processPolicies.length,2);assert.equal(report.processPolicies.find(g=>g.kind==='VISIT').records,2);
 assert.equal(report.legacyPolicyRecords,1);assert.equal(report.processPolicies.find(g=>g.kind==='ORDER').rules.TAX_RATE_PERCENT,11);
 assert.equal(report.processPolicies.find(g=>g.kind==='VISIT').rules.MINIMUM_VISIT_DURATION_MINUTES,null);
 const exported={basis:report,salesmen:[{salesmanName:'Fixture',weeklyTotal:{}}],rows:[{salesmanName:'Fixture'}]};
 for(const csv of [weeklyCsv(exported),dailyCallCsv(exported)])assert.match(csv,new RegExp(REPORT_FORMULA_VERSION.replaceAll('.','\\.')));
});
test('weekly report never reports zero duration when no measured duration exists',async t=>{
 const replace=(model,key,fn)=>{const previous=model[key];model[key]=fn;t.after(()=>{model[key]=previous;invalidateConfigCache();});};
 replace(prisma.systemConfig,'findMany',async()=>[]);invalidateConfigCache();
 replace(prisma.user,'findMany',async()=>[{id:'sales',name:'Fixture'}]);replace(prisma.offPjpAttendance,'findMany',async()=>[]);
 const stop={status:'VISITED',visitSession:{state:'FINISHED',finishedAt:'2026-10-05T03:00:00Z'},policySnapshot:{values:{SALES_ATTENDANCE_MODE:'OPTIONAL'},versions:[]},attendances:[],orders:[]};
 replace(prisma.pjp,'findMany',async()=>[{userId:'sales',date:new Date('2026-10-05T00:00:00Z'),stops:[stop]}]);
 const report=await getWeeklyReport({startDate:'2026-10-05'});
 assert.equal(report.summary.avgDurationMinutes,null);assert.equal(report.summary.durationSamples,0);
 assert.equal(report.salesmen[0].weeklyTotal.avgDuration,null);assert.equal(report.daysSummary[0].durationMinutes,null);
 assert.equal(report.basis.formulaVersion,REPORT_FORMULA_VERSION);
});
test('measured duration rejects missing, reversed and nonrequired pairs but preserves a genuine zero',()=>{
 const entered={type:'IN',timestamp:'2026-10-10T00:00:00Z'},exited={type:'OUT',timestamp:'2026-10-10T00:10:00Z'};
 assert.equal(measuredVisitMinutes({attendances:[entered,exited]}),10);
 assert.equal(measuredVisitMinutes({attendances:[entered,{...exited,timestamp:entered.timestamp}]}),0);
 for(const attendances of [[],[entered],[exited],[entered,{...exited,timestamp:'2026-10-09T00:00:00Z'}]])assert.equal(measuredVisitMinutes({attendances}),null);
 for(const mode of ['IN_ONLY','OPTIONAL'])assert.equal(measuredVisitMinutes({attendances:[entered,exited],policySnapshot:{values:{SALES_ATTENDANCE_MODE:mode}}}),null);
});
test('daily audit never fabricates duration, distance or a travel anomaly from missing evidence; PJP compliance excludes extra calls',async t=>{
 const replace=(model,key,fn)=>{const previous=model[key];model[key]=fn;t.after(()=>{model[key]=previous;invalidateConfigCache();});};
 replace(prisma.systemConfig,'findMany',async()=>[]);invalidateConfigCache();
 const user={id:'sales',name:'Fixture',role:'SALES'},entered=timestamp=>({type:'IN',timestamp:new Date(timestamp)});
 let stops=[{id:'first',sequence:1,status:'VISITED',outlet:{name:'First'},attendances:[entered('2026-10-10T01:00:00Z')],orders:[]},{id:'next',sequence:2,status:'VISITED',outlet:{name:'Next'},attendances:[entered('2026-10-10T04:00:00Z')],orders:[]}];
 replace(prisma.pjp,'findMany',async()=>[{userId:user.id,user,date:new Date('2026-10-10'),stops}]);
 replace(prisma.offPjpAttendance,'findMany',async()=>[{id:'extra',userId:user.id,user,createdAt:new Date('2026-10-10T06:00:00Z'),status:'APPROVED',outletName:'Extra'}]);
 let report=await getDailyCallReport({date:'2026-10-10'});
 assert.equal(report.summary.avgDurationMinutes,null);assert.equal(report.summary.durationSamples,0);
 assert.equal(report.summary.totalPlannedActualCalls,2);assert.equal(report.summary.totalActualCalls,3);assert.equal(report.summary.callComplianceRate,'100%');
 const next=report.rows.find(row=>row.id==='next'),extra=report.rows.find(row=>row.id==='extra');
 assert.equal(next.travelDurationMinutes,null);assert.equal(next.travelDistanceKm,null);assert.equal(next.isTravelAnomaly,false);
 assert.equal(extra.deviationMeters,null);assert.equal(extra.distanceWarning,'UNAVAILABLE');assert.equal(extra.customerLat,null);
 stops=[{...stops[0],outlet:{latitude:0,longitude:0},attendances:[{...entered('2026-10-10T01:00:00Z'),latitude:1,longitude:1},{type:'OUT',timestamp:new Date('2026-10-10T01:00:00Z')}]},{...stops[1],outlet:{latitude:0,longitude:0}}];
 report=await getDailyCallReport({date:'2026-10-10'});
 assert.equal(report.summary.avgDurationMinutes,0);assert.equal(report.summary.durationSamples,1);
 assert.equal(report.summary.totalDurationAnomalies,1);assert.equal(report.summary.totalDistanceAnomalies,1);assert.equal(report.summary.totalTravelAnomalies,1);
 assert.equal(report.summary.totalAnomalies,2,'a stop with both duration and distance issues counts once');
 assert.equal(report.rows.find(row=>row.id==='next').travelDistanceKm,0,'zero coordinates are valid');
});
test('attendance audit export preserves unknown evidence, real zeros, actual thresholds and neutralizes spreadsheet formulas',()=>{
 const row={salesmanName:'=CMD()',customerName:'Toko,"A"',durationMinutes:null,deviationMeters:null,minimumDuration:12,radiusMeters:200,policyVersions:[{scope:'GLOBAL',revision:2}]};
 assert.equal(durationStatus(row),'Tidak tersedia');assert.equal(distanceStatus(row),'Tidak tersedia');
 const csv=attendanceAuditCsv([row]);assert.match(csv,/'=CMD\(\)/);assert.match(csv,/Toko,""A""/);assert.match(csv,/"12"/);assert.match(csv,/"200"/);
 assert.equal(durationStatus({...row,durationMinutes:0,isDurationAnomaly:true}),'Di bawah batas aturan');
 assert.equal(distanceStatus({...row,deviationMeters:0}),'Dalam radius');
 assert.equal(durationStatus({...row,durationMinutes:10,durationCheckEnabled:false}),'Tidak diwajibkan');
});
