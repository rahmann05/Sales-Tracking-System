import {wibDateKey} from './visit-metrics.mjs';
export function reportDateRange(period='ALL',now=Date.now()){
 const endDate=wibDateKey(now),anchor=new Date(`${endDate}T12:00:00Z`),year=anchor.getUTCFullYear(),month=anchor.getUTCMonth();
 if(period==='ALL')return {startDate:'',endDate:''};
 if(period==='CURRENT_MONTH')return {startDate:new Date(Date.UTC(year,month,1)).toISOString().slice(0,10),endDate};
 if(period==='PREVIOUS_MONTH')return {startDate:new Date(Date.UTC(year,month-1,1)).toISOString().slice(0,10),endDate:new Date(Date.UTC(year,month,0)).toISOString().slice(0,10)};
 if(['LAST_7','LAST_30'].includes(period))return {startDate:new Date(+anchor-(period==='LAST_7'?6:29)*86400000).toISOString().slice(0,10),endDate};
 throw new Error('Periode awal laporan tidak valid');
}
export function reportFilterDefaults(values={},now=Date.now()){
 const today=wibDateKey(now),anchor=new Date(`${today}T12:00:00Z`);
 const offset=Number(values.REPORT_DAILY_DEFAULT_DAYS_AGO)||0;
 const day=new Date(+anchor-Math.max(0,Math.min(31,offset))*86400000).toISOString().slice(0,10);
 const monday=new Date(+anchor-((anchor.getUTCDay()+6)%7+(values.REPORT_WEEKLY_DEFAULT_PERIOD==='PREVIOUS'?7:0))*86400000);
 const month=new Date(Date.UTC(anchor.getUTCFullYear(),anchor.getUTCMonth()-(values.REPORT_MTD_DEFAULT_PERIOD==='PREVIOUS'?1:0),1));
 return {day,filterType:values.REPORT_DAILY_DEFAULT_TYPE||'ALL',weekStart:monday.toISOString().slice(0,10),month:month.getUTCMonth()+1,year:month.getUTCFullYear()};
}
