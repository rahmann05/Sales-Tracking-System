import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prisma} from '../src/config/prisma.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {getWeeklyReport} from '../src/modules/reports/services/get-weekly-report.service.js';
import {getMtdReport} from '../src/modules/reports/services/get-mtd-report.service.js';
test('Reports batch 100 sales without multiplying queries by sales or days',async t=>{
 const sales=Array.from({length:100},(_,i)=>({id:`sales-${i}`,name:`Sales ${i}`,cluster:null}));
 let pjpCalls=0,offCalls=0;
 const replace=(model,method,fn)=>{const original=model[method];model[method]=fn;t.after(()=>{model[method]=original;invalidateConfigCache();});};
 replace(prisma.systemConfig,'findMany',async()=>[]);invalidateConfigCache();
 replace(prisma.user,'findMany',async args=>{assert.equal(args.where.supervisorId,'supervisor');return sales;});
 replace(prisma.pjp,'findMany',async args=>{
  pjpCalls++;assert.equal(args.where.OR[0].reportSupervisorId,'supervisor');assert.equal(args.where.OR[1].user.supervisorId,'supervisor');
  const date=new Date('2026-10-06T17:00:00Z');
  if(date<args.where.date.gte || date>args.where.date.lte)return [];
  return sales.map(user=>({userId:user.id,date,stops:[{status:'PENDING',attendances:[],orders:[],outlet:{type:'GENERAL_TRADE'}}]}));
 });
 replace(prisma.offPjpAttendance,'findMany',async args=>{offCalls++;assert.equal(args.where.status,'APPROVED');assert.equal(args.where.OR[0].reportSupervisorId,'supervisor');return [];});
 const weekly=await getWeeklyReport({startDate:'2026-10-05',supervisorId:'supervisor'});
 assert.equal(weekly.summary.totalPlanCalls,100);assert.equal(weekly.summary.totalOrderAmount,0);assert.equal(pjpCalls,1);assert.equal(offCalls,1);
 pjpCalls=0;offCalls=0;
 const mtd=await getMtdReport({month:10,year:2026,supervisorId:'supervisor'});
 assert.equal(mtd.summary.totalMtdPlanCalls,100);assert.equal(mtd.summary.mtdActualAmount,0);assert.equal(pjpCalls,2);assert.equal(offCalls,2);
});
