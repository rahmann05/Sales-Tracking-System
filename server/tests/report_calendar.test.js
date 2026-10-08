import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calendarWorkingDay,calendarMonthMetrics,calendarKey,calendarBasis} from '../../shared/report-calendar.mjs';
import {saveReportCalendar,loadReportCalendars} from '../src/modules/reports/services/report-calendar.service.js';
import {prisma} from '../src/config/prisma.js';
import {invalidateConfigCache} from '../src/modules/config/services/dynamic-config.service.js';
import {getMtdReport} from '../src/modules/reports/services/get-mtd-report.service.js';
import {getWeeklyReport} from '../src/modules/reports/services/get-weekly-report.service.js';
import {mtdCsv} from '../../shared/report-semantics.mjs';
const admin={id:'admin',name:'Admin',role:'ADMIN'};
const input={month:'2026-10',weekdays:[1,2,3,4,5],exceptions:[{date:'2026-10-05',working:false},{date:'2026-10-04',working:true}],revision:0,reason:'Hari kerja dan libur Oktober'};
const replace=(t,model,method,fn)=>{const original=model[method];model[method]=fn;t.after(()=>{model[method]=original;invalidateConfigCache();});};

test('calendar exceptions override weekdays and respect WIB date keys',()=>{
  assert.equal(calendarWorkingDay(input,'2026-10-05'),false);
  assert.equal(calendarWorkingDay(input,'2026-10-04'),true);
  assert.equal(calendarWorkingDay(input,'2026-10-06'),true);
  assert.equal(calendarWorkingDay(input,'2026-10-03'),false);
  assert.equal(calendarWorkingDay(null,'2026-10-05'),null);
  assert.equal(calendarWorkingDay(input,'2026-11-05'),null);
  assert.deepEqual(calendarMonthMetrics(input.month,input,'2026-10-05'),{known:true,total:22,elapsed:3,rate:'14%'});
});
test('missing calendars are unknown while closed, future and leap months preserve zero correctly',()=>{
  assert.deepEqual(calendarMonthMetrics('2026-10',null,'2026-10-08'),{known:false,total:null,elapsed:null,rate:'—'});
  assert.deepEqual(calendarMonthMetrics('2026-10',{...input,weekdays:[],exceptions:[]},'2026-10-08'),{known:true,total:0,elapsed:0,rate:'—'});
  assert.equal(calendarMonthMetrics('2026-10',input,'2026-09-30').elapsed,0);
  assert.equal(calendarMonthMetrics('2028-02',{month:'2028-02',weekdays:[0,1,2,3,4,5,6],exceptions:[]},'2028-02-29').total,29);
});
test('calendar changes are version checked and audited atomically',async t=>{
  let saved=null,locks=0;const events=[];
  replace(t,prisma,'$transaction',async work=>work({$executeRaw:async()=>{locks++;},systemConfig:{findUnique:async()=>saved,upsert:async({update})=>{saved={value:update.value};}},auditEvent:{create:async({data})=>events.push(data)}}));
  const first=await saveReportCalendar(input,admin);assert.equal(first.revision,1);assert.equal(first.exceptions[0].date,'2026-10-04');
  await assert.rejects(()=>saveReportCalendar(input,admin),e=>e.statusCode===409);
  assert.equal(events.length,1);
  const second=await saveReportCalendar({...input,revision:1,weekdays:[1,2,3,4,5,6],reason:'Koreksi hari Sabtu bekerja'},admin);
  assert.equal(second.revision,2);assert.equal(locks,3);
  assert.deepEqual(events[1].before.weekdays,[1,2,3,4,5]);assert.deepEqual(events[1].after.weekdays,[1,2,3,4,5,6]);assert.equal(events[1].actorId,'admin');
});
test('invalid dates, duplicates and unauthorized calendar changes fail before writes',async()=>{
  for(const patch of [{month:'2026-13'},{weekdays:[1,1]},{weekdays:[7]},{exceptions:[{date:'2026-10-32',working:false}]},{exceptions:[{date:'2026-11-01',working:true}]},{exceptions:[{date:'2026-10-02',working:true},{date:'2026-10-02',working:false}]},{reason:'x'},{extra:'bypass'}])
    await assert.rejects(()=>saveReportCalendar({...input,...patch},admin),e=>e.statusCode===400);
  for(const actor of [{role:'SUPERVISOR'},{role:'SALES'},{...admin,permissions:{can_view_reports:false}}])await assert.rejects(()=>saveReportCalendar(input,actor),e=>e.statusCode===403);
});
test('calendar loader batches distinct months and excludes operational settings',async t=>{
  replace(t,prisma.systemConfig,'findMany',async query=>{assert.deepEqual(query.where.key.in,[calendarKey('2026-10'),calendarKey('2026-11')]);return [{key:calendarKey('2026-10'),value:{...input,revision:1}},{key:'PJP_WORKING_DAYS',value:'0'}];});
  const result=await loadReportCalendars(['2026-10','2026-11','2026-10']);assert.equal(result.size,1);assert.equal(result.get('2026-10').revision,1);
});
test('report calendars survive operational changes, span months and retain unknown months',async t=>{
  let operational='0',stored=true;
  replace(t,prisma.systemConfig,'findMany',async query=>query?.where?.key?.in
    ?stored&&query.where.key.in.includes(calendarKey('2026-10'))?[{key:calendarKey('2026-10'),value:{...input,revision:1}}]:[]
    :[{key:'PJP_WORKING_DAYS',value:operational}]);invalidateConfigCache();
  replace(t,prisma.user,'findMany',async()=>[{id:'sales',name:'Sales'}]);
  replace(t,prisma.pjp,'findMany',async()=>[]);replace(t,prisma.offPjpAttendance,'findMany',async()=>[]);
  const first=await getMtdReport({month:10,year:2026});
  operational='1';invalidateConfigCache();const second=await getMtdReport({month:10,year:2026});
  assert.equal(first.period.totalWorkingDays,22);assert.equal(second.period.totalWorkingDays,22);
  assert.equal(second.basis.calendarMonths[0].revision,1);
  const week=await getWeeklyReport({startDate:'2026-10-26'});
  assert.equal(week.period.weekDays.length,7);
  assert.equal(week.period.weekDays[0].isWorkingDay,true);
  assert.equal(week.period.weekDays[6].dateStr,'2026-11-01');assert.equal(week.period.weekDays[6].isWorkingDay,null);
  assert.deepEqual(week.basis.calendarMonths,[{month:'2026-10',revision:1},{month:'2026-11',revision:null}]);
  stored=false;const missing=await getMtdReport({month:10,year:2026});
  assert.equal(missing.period.totalWorkingDays,null);assert.equal(missing.period.workingDaysRate,'—');assert.equal(missing.summary.avgDailyRevenue,null);
  assert.match(mtdCsv(second),/Kalender 2026-10: versi 1/);
  assert.match(calendarBasis(['2026-10'],new Map()).calendarNote,/tidak membuat atau menghapus jadwal PJP/);
});
