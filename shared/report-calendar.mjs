export const calendarKey = month => `_REPORT_CALENDAR:${month}`;
export const calendarDayLabel = value => value === true ? 'Kerja' : value === false ? 'Libur' : 'Kalender belum ditetapkan';
export const validMonth = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '');
export function validCalendarDate(value, month) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value || '')||!value.startsWith(`${month}-`))return false;
  const date=new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function calendarWorkingDay(calendar, dateKey) {
  if(!calendar||!validCalendarDate(dateKey,calendar.month))return null;
  const exception=(calendar.exceptions||[]).find(row=>row.date===dateKey);
  return exception?exception.working:calendar.weekdays.includes(new Date(`${dateKey}T12:00:00Z`).getUTCDay());
}
export function calendarMonthMetrics(month, calendar, todayKey) {
  if(!calendar)return {known:false,total:null,elapsed:null,rate:'—'};
  const [year,number]=month.split('-').map(Number);
  let total=0,elapsed=0;
  for(let day=1;day<=new Date(Date.UTC(year,number,0)).getUTCDate();day++){
    const key=`${month}-${String(day).padStart(2,'0')}`;
    if(!calendarWorkingDay(calendar,key))continue;
    total++;if(key<=todayKey)elapsed++;
  }
  return {known:true,total,elapsed,rate:total>0?`${Math.round(elapsed/total*100)}%`:'—'};
}
export function calendarBasis(months, calendars) {
  return {calendar:'EXPLICIT_MONTH_CALENDAR',calendarMonths:months.map(month=>({month,revision:calendars.get(month)?.revision||null})),
    calendarNote:'Hari kerja laporan mengikuti kalender bulanan yang ditetapkan Admin, termasuk pengecualian tanggal kerja/libur. Kalender yang belum ditetapkan ditandai belum terverifikasi; jumlah/progres hari kerja dan rata-rata per hari belum dinilai. Perubahan kalender operasional tidak mengubah kalender laporan tersimpan. Revisi kalender laporan memerlukan alasan dan tetap dapat mengubah hasil periode tersebut; kalender ini tidak membuat atau menghapus jadwal PJP.'};
}
