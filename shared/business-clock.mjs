const DAY=86400000,WIB=7*3600000;
const minutes=value=>{const [h,m]=value.split(':').map(Number);return h*60+m;};
export const SLA_CALENDAR_KEYS=['SLA_CLOCK_MODE','SLA_WORKING_DAYS','SLA_WORK_START','SLA_WORK_END','SLA_HOLIDAYS'];
export function addSlaHours(start,hours,policy={}){
 const timestamp=+new Date(start);
 if(!Number.isFinite(timestamp)||!Number.isFinite(hours)||hours<0)throw new Error('Waktu awal dan durasi SLA tidak valid');
 if(policy.SLA_CLOCK_MODE!=='BUSINESS')return new Date(timestamp+hours*3600000);
 const days=new Set(String(policy.SLA_WORKING_DAYS||'1,2,3,4,5,6').split(',').map(Number));
 const holidays=new Set(String(policy.SLA_HOLIDAYS||'').split(',').filter(Boolean));
 const open=minutes(policy.SLA_WORK_START||'08:00'),close=minutes(policy.SLA_WORK_END||'17:00');
 if(!days.size||close<=open||!Number.isFinite(open+close))throw new Error('Kalender jam kerja SLA tidak valid');
 let remaining=hours*3600000,cursor=timestamp;
 for(let n=0;n<36600;n++){
  const local=new Date(cursor+WIB),midnight=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-WIB;
  if(days.has(local.getUTCDay())&&!holidays.has(local.toISOString().slice(0,10))){
   const begin=Math.max(cursor,midnight+open*60000),end=midnight+close*60000;
   if(begin<=end){const available=end-begin;if(remaining<=available)return new Date(begin+remaining);remaining-=available;}
  }
  cursor=midnight+DAY;
 }
 throw new Error('Kalender SLA tidak memiliki kapasitas dalam batas 100 tahun');
}
