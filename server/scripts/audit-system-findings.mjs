// Read-only audit reproduction: all Prisma reads below are replaced by synthetic fixtures.
// Regression expectations for the seven reproduced audit findings.
import assert from 'node:assert/strict';
import {prisma} from '../src/config/prisma.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {getMtdReport} from '../src/modules/reports/services/get-mtd-report.service.js';
import {getWeeklyReport} from '../src/modules/reports/services/get-weekly-report.service.js';
import {weeklyCsv,ratioPercent,reportChannel} from '../../shared/report-semantics.mjs';
import reportsRouter from '../src/modules/reports/reports.routes.js';
const original={config:prisma.systemConfig.findMany,users:prisma.user.findMany,pjps:prisma.pjp.findMany,off:prisma.offPjpAttendance.findMany};
const date=new Date('2026-10-11T03:00:00Z');
const outlet={channel:'MODERN_TRADE',subChannel:'CHAIN_MINIMARKET',type:'MODERN_TRADE'};
const completed={status:'VISITED',outlet,attendances:[{type:'IN'},{type:'OUT',durationMinutes:30}],orders:[{status:'APPROVED',totalValue:100,customerSnapshot:{...outlet},items:[{productId:'p'}]}]};
const active={status:'ARRIVED',outlet,attendances:[{type:'IN'}],orders:[]};
try{
  prisma.systemConfig.findMany=async()=>[{key:'SALES_BASELINE_LMA_AMOUNT',value:100},{key:'SALES_MONTHLY_TARGET_AMOUNT',value:1000},{key:'SALES_WEEKLY_TARGET_AMOUNT',value:250},{key:'PJP_WORKING_DAYS',value:'1,2,3,4,5,6'}];invalidateConfigCache();
  prisma.user.findMany=async()=>[{id:'audit-sales',name:'Synthetic Sales',cluster:null}];
  prisma.offPjpAttendance.findMany=async()=>[];
  prisma.pjp.findMany=async({where})=>date>=where.date.gte&&date<=where.date.lte?[{userId:'audit-sales',date,stops:[completed,active]}]:[];
  const mtd=await getMtdReport({month:'10',year:'2026'});
  assert.equal(mtd.channelBreakdown.find(c=>c.channelKey==='MODERN_TRADE').mtdOmzet,100);
  assert.equal(mtd.channelBreakdown.find(c=>c.channelKey==='RETAIL').mtdOmzet,0);
  assert.equal(reportChannel({subChannel:'GROSIR'}),'SEMI_WHOLESALE');
  assert.equal(reportChannel({subChannel:'unknown'}),'UNCLASSIFIED');
  assert.equal(mtd.summary.lastMonthActual,0);
  assert.equal(mtd.summary.mtdToLmaRate,'\u2014');
  assert.equal(ratioPercent(100,100),'100%');
  assert.equal(mtd.salesmen[0].clusterName,'Belum ditugaskan');
  const weekly=await getWeeklyReport({startDate:'2026-10-05'});
  assert.equal(weekly.summary.avgDurationMinutes,30);
  assert.equal(weekly.salesmen[0].days.minggu.omzet,100);
  const csv=weeklyCsv(weekly);
  assert.match(csv,/Minggu/i);
  const cells = row => row.match(/"(?:[^"]|"")*"/g) || [];
  assert.equal(cells(csv.split('\r\n')[0]).length,cells(csv.split('\r\n')[1]).length);
  for(const path of ['/weekly','/mtd']){
    const route=reportsRouter.stack.find(layer=>layer.route?.path===path).route;
    let called=false,error;
    route.stack[0].handle({user:{id:'audit-spv',role:'SUPERVISOR',permissions:{can_view_reports:false}}},{},err=>{called=true;error=err;});
    assert.equal(called,true);assert.equal(error.statusCode||error.status,403);
  }
  console.log('Audit regression: all seven corrected findings verified, no database writes or network calls.');
}finally{
  prisma.systemConfig.findMany=original.config;prisma.user.findMany=original.users;prisma.pjp.findMany=original.pjps;prisma.offPjpAttendance.findMany=original.off;invalidateConfigCache();await prisma.$disconnect();
}
