import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reportFilterDefaults,reportDateRange} from '../../shared/report-filter-defaults.mjs';
test('Report defaults use WIB and preserve previous-month year rollover',()=>{
 const now=Date.parse('2026-12-31T18:00:00Z');
 assert.deepEqual(reportFilterDefaults({},now),{day:'2027-01-01',filterType:'ALL',weekStart:'2026-12-28',month:1,year:2027});
 assert.deepEqual(reportFilterDefaults({REPORT_DAILY_DEFAULT_DAYS_AGO:1,REPORT_DAILY_DEFAULT_TYPE:'ALL_ANOMALIES',REPORT_WEEKLY_DEFAULT_PERIOD:'PREVIOUS',REPORT_MTD_DEFAULT_PERIOD:'PREVIOUS'},now),{day:'2026-12-31',filterType:'ALL_ANOMALIES',weekStart:'2026-12-21',month:12,year:2026});
 assert.equal(reportFilterDefaults({},Date.parse('2026-10-11T18:00:00Z')).weekStart,'2026-10-12');
});
test('registration report ranges include today WIB and previous month correctly across leap/year boundaries',()=>{
 const now=Date.parse('2026-12-31T18:00:00Z');
 assert.deepEqual(reportDateRange('ALL',now),{startDate:'',endDate:''});
 assert.deepEqual(reportDateRange('CURRENT_MONTH',now),{startDate:'2027-01-01',endDate:'2027-01-01'});
 assert.deepEqual(reportDateRange('PREVIOUS_MONTH',now),{startDate:'2026-12-01',endDate:'2026-12-31'});
 assert.deepEqual(reportDateRange('LAST_7',now),{startDate:'2026-12-26',endDate:'2027-01-01'});
 assert.deepEqual(reportDateRange('PREVIOUS_MONTH',Date.parse('2028-03-01T00:00:00Z')),{startDate:'2028-02-01',endDate:'2028-02-29'});
 assert.throws(()=>reportDateRange('UNKNOWN',now),/tidak valid/);
});
