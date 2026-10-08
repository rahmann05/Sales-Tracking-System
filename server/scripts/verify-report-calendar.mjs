// Use unused far-future periods; never replace an existing operational/report calendar.
import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {prisma} from '../src/config/prisma.js';
import {saveReportCalendar,getReportCalendar,loadReportCalendars} from '../src/modules/reports/services/report-calendar.service.js';
import {getMtdReport} from '../src/modules/reports/services/get-mtd-report.service.js';
import {calendarKey,calendarMonthMetrics,calendarWorkingDay} from '../../shared/report-calendar.mjs';
assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname),'Local database only');
const keys=[],users=[];let checks=0;
const check=(value,expected)=>{assert.deepEqual(value,expected);checks++;};
const rejects=async(work,status)=>{await assert.rejects(work,e=>e.statusCode===status);checks++;};
try{
  const admin=await prisma.user.create({data:{name:`calendar-test-${randomUUID()}`,email:`${randomUUID()}@example.invalid`,password:'fixture',role:'ADMIN'}});users.push(admin.id);
  let month;
  for(let year=9000;year<9100;year++){
    const candidate=`${year}-10`;
    if(!await prisma.systemConfig.findUnique({where:{key:calendarKey(candidate)}})){month=candidate;break;}
  }
  assert.ok(month,'Unused fixture month required');keys.push(calendarKey(month));
  const input={month,weekdays:[1,2,3,4,5],exceptions:[{date:`${month}-01`,working:false}],revision:0,reason:'Fixture calendar definition'};
  await rejects(()=>saveReportCalendar(input,{role:'SUPERVISOR'}),403);
  const first=await saveReportCalendar(input,admin);check(first.revision,1);
  check(calendarWorkingDay(first,`${month}-01`),false);
  const race=await Promise.allSettled([
    saveReportCalendar({...input,revision:1,weekdays:[1,2,3,4,5,6],reason:'First competing calendar revision'},admin),
    saveReportCalendar({...input,revision:1,weekdays:[0,1,2,3,4,5,6],reason:'Second competing calendar revision'},admin),
  ]);
  check(race.filter(row=>row.status==='fulfilled').length,1);check(race.find(row=>row.status==='rejected').reason.statusCode,409);
  const loaded=await getReportCalendar({month},admin);check(loaded.calendar.revision,2);check(loaded.history.length,2);
  const revised=loaded.history.find(row=>row.action==='REVISE_CALENDAR');check(revised.before.revision,1);check(revised.after.revision,2);check(revised.actorId,admin.id);
  const calendars=await loadReportCalendars([month,month]);check(calendars.size,1);
  const report=await getMtdReport({year:Number(month.slice(0,4)),month:10,userId:admin.id});
  check(report.period.calendarKnown,true);check(report.period.totalWorkingDays,calendarMonthMetrics(month,loaded.calendar,'2026-10-08').total);
  check(report.period.workingDaysElapsed,0);check(report.summary.avgDailyRevenue,null);check(report.basis.calendarMonths,[{month,revision:2}]);
  await rejects(()=>saveReportCalendar({...input,revision:2,exceptions:[{date:`${month}-32`,working:false}]},admin),400);
  check((await getReportCalendar({month},admin)).history.length,2);
  console.log(`Report calendar integration passed: ${checks} checks (real SQL concurrency, audit, exceptions, future reports and invalid-date rejection).`);
}finally{
  await prisma.auditEvent.deleteMany({where:{entityType:'REPORT_CALENDAR',entityId:{in:keys}}});
  await prisma.systemConfig.deleteMany({where:{key:{in:keys}}});
  await prisma.user.deleteMany({where:{id:{in:users}}});
  await prisma.$disconnect();
}
