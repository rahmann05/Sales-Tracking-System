const DAY=86400000;
export const validPlanDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
export function planDates(start,end,maxDays=62){
 if(!validPlanDate(start)||!validPlanDate(end))throw new Error('Tanggal rencana tidak valid');
 const count=Math.round((Date.parse(end)-Date.parse(start))/DAY)+1;
 if(count<1||count>maxDays)throw new Error(`Periode rencana harus 1–${maxDays} hari`);
 return Array.from({length:count},(_,i)=>new Date(Date.parse(start)+i*DAY).toISOString().slice(0,10));
}
export const frequencyWeeks=code=>({F1:1,F2:2,F4:4})[code]||null;
export const allowedVisitIntervals=values=>String(values?.PJP_ALLOWED_INTERVALS||'1,2,4').split(',').map(Number).filter(n=>[1,2,4].includes(n));
export const ruleDue=(rule,date)=>validPlanDate(rule.anchorDate)&&Date.parse(date)>=Date.parse(rule.anchorDate)&&Math.round((Date.parse(date)-Date.parse(rule.anchorDate))/DAY)%(Number(rule.intervalWeeks)*7)===0;
export function buildPlanCalendar({startsOn,endsOn,rules},sales,outlets,workingDays=[1,2,3,4,5,6],policy={}){
 const dates=planDates(startsOn,endsOn,policy.PJP_MAX_PLAN_DAYS||62),people=new Map(sales.map(s=>[s.id,s])),shops=new Map(outlets.map(o=>[o.id,o])),problems=[],days=[];
 const add=(code,message,extra={})=>problems.push({code,message,...extra});
 const warnings=[],isWorking=date=>policy.workingDates?policy.workingDates.includes(date):workingDays.includes(new Date(date).getUTCDay());
 rules.forEach((r,index)=>{
  const person=people.get(r.userId),outlet=shops.get(r.outletId);
  if(!person)add('SALES_UNAVAILABLE',`Aturan ${index+1}: Sales tidak tersedia dalam tim.`);
  if(!outlet)add('OUTLET_UNAVAILABLE',`Aturan ${index+1}: outlet tidak tersedia dalam wilayah tim.`);
  if(!validPlanDate(r.anchorDate)||![1,2,4].includes(Number(r.intervalWeeks)))add('INVALID_RULE',`Aturan ${index+1}: tanggal acuan atau interval tidak valid.`);
  if(!allowedVisitIntervals(policy).includes(Number(r.intervalWeeks)))add('INTERVAL_DISABLED',`${outlet?.name||'Outlet'}: interval F${r.intervalWeeks} dinonaktifkan oleh Admin.`);
  if(validPlanDate(r.anchorDate)&&!policy.workingDates&&!isWorking(r.anchorDate))add('NON_WORKING_DAY',`${outlet?.name||'Outlet'}: tanggal acuan bukan hari kerja.`);
  if(person&&outlet?.cluster?.supervisorId!==person.supervisorId)add('TEAM_MISMATCH',`${outlet?.name||'Outlet'} berada di luar tim Sales.`);
  if(policy.PJP_ALLOW_OWNER_OVERRIDE===false&&outlet?.cluster?.assignedSalesId&&outlet.cluster.assignedSalesId!==r.userId)add('OWNER_OVERRIDE_DISABLED',`${outlet.name}: penggantian Sales dinonaktifkan.`);
  if(policy.PJP_ALLOW_FREQUENCY_OVERRIDE===false&&frequencyWeeks(outlet?.itineraryCode)&&frequencyWeeks(outlet.itineraryCode)!==Number(r.intervalWeeks))add('FREQUENCY_OVERRIDE_DISABLED',`${outlet.name}: perubahan interval dinonaktifkan.`);
  if(outlet?.cluster?.assignedSalesId&&outlet.cluster.assignedSalesId!==r.userId&&!r.reason?.trim())add('OWNER_REASON',`${outlet.name}: isi alasan penugasan ke Sales pengganti.`);
  if(frequencyWeeks(outlet?.itineraryCode)&&frequencyWeeks(outlet.itineraryCode)!==Number(r.intervalWeeks)&&!r.reason?.trim())add('FREQUENCY_REASON',`${outlet.name}: isi alasan perubahan interval dari ${outlet.itineraryCode}.`);
 });
 for(const date of dates){
  if(!isWorking(date)){
   const due=rules.filter(r=>ruleDue(r,date));
   if(due.length){const issue={code:'HOLIDAY_VISIT',date,message:`${due.length} kunjungan jatuh pada hari libur ${date}. Interval tetap mengikuti tanggal acuan.`};(policy.PJP_HOLIDAY_POLICY==='BLOCK'?problems:warnings).push(issue);}
   continue;
  }
  const seen=new Map();
  for(const person of sales){
   const ids=rules.filter(r=>r.userId===person.id&&ruleDue(r,date)).map(r=>r.outletId);
   for(const id of ids){if(seen.has(id))add('DUPLICATE_VISIT',`${shops.get(id)?.name||id} dijadwalkan lebih dari sekali pada ${date}.`,{date,outletId:id});seen.set(id,person.id);}
   days.push({date,userId:person.id,salesName:person.name,outletIds:ids,state:ids.length?'SCHEDULED':rules.some(r=>r.userId===person.id)?'NOT_DUE':'UNPLANNED'});
  }
 }
 const covered=new Set(rules.map(r=>r.outletId));
 const uncovered=outlets.filter(o=>!covered.has(o.id));
 warnings.push(...rules.flatMap(r=>{const o=shops.get(r.outletId),standard=frequencyWeeks(o?.itineraryCode);return standard&&standard!==Number(r.intervalWeeks)?[{code:'FREQUENCY_OVERRIDE',message:`${o.name}: interval rencana ${r.intervalWeeks} minggu berbeda dari ${o.itineraryCode}.`}]:[];}));
 for(const day of days)if(day.outletIds.length>(policy.PJP_MAX_VISITS_PER_DAY||50)){const issue={code:'OVERLOAD',message:`${day.salesName}: ${day.outletIds.length} outlet pada ${day.date} melebihi batas harian.`};(policy.PJP_OVERLOAD_POLICY==='BLOCK'?problems:warnings).push(issue);}
 return {days,problems,warnings,uncovered:uncovered.map(o=>({id:o.id,name:o.name,clusterName:o.cluster?.name})),summary:{visits:days.reduce((n,d)=>n+d.outletIds.length,0),sales:sales.length,covered:covered.size,uncovered:uncovered.length,workingDates:new Set(days.map(d=>d.date)).size}};
}
