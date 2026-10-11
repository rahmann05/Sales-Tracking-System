export const REPORT_PRESENTATION={
 ATTENTION_WIDGETS:['total','overdue','awaitingReview','missingOwner','missingDeadline'],
 REPORT_SPV_WIDGETS:['totalPlanCalls','totalActualCalls','totalEffectiveCalls','totalAnomalies'],
 REPORT_WEEKLY_WIDGETS:['calls','ec','revenue','anomalies'],
 REPORT_MTD_WIDGETS:['calendar','target','comparison','calls'],
 REPORT_WEEKLY_COLUMNS:['cluster','days','calls','callRate','ecRate','revenue'],
 REPORT_MTD_COLUMNS:['cluster','target','revenue','achievement','lastMonth','comparison','calls','callRate','ecRate','sku'],
};
export function reportSelection(key,raw){
 const allowed=REPORT_PRESENTATION[key];if(!allowed)throw new Error('Daftar tampilan laporan tidak dikenal.');
 if(typeof raw!=='string')throw new Error('Daftar tampilan harus berupa kode dipisahkan koma.');
 const items=raw.trim()?raw.split(',').map(item=>item.trim()):[];
 if(items.some(item=>!allowed.includes(item))||new Set(items).size!==items.length)throw new Error(`Gunakan kode unik: ${allowed.join(', ')}. Identitas Sales selalu tampil.`);
 return items;
}
export const selectedReportItems=(values,key)=>reportSelection(key,values?.[key]??REPORT_PRESENTATION[key].join(','));
export const reportExportAllowed=(user,values={})=>Boolean(user)&&(!values.FEATURE_EXPORT_MODE||values.FEATURE_EXPORT_MODE==='ACTIVE')&&values.REPORT_EXPORT_ENABLED!==false&&user.permissions?.can_export_reports!==false;

// Report rows carry the process snapshot mode; never infer a missing OUT from
// today's settings or from an outlet which has not been visited yet.
export function reportVisitAttendance(row={}){
 const valid=value=>Boolean(value&&value!=='-'&&value!=='—');
 const mode=row.attendanceMode||'IN_OUT',state=row.visitSession?.state;
 if(row.validationOnly||mode==='VALIDATION')return {entry:row.validationResult?.submittedAt?'Bukti validasi dikirim':'Validasi belum dikerjakan',exit:'Bukti foto dan GPS terpisah dari IN/OUT',duration:null};
 const entry=valid(row.timeIn)?`Masuk ${row.timeIn}`:mode==='NONE'?state==='FINISHED'?'Kegiatan selesai':state==='ACTIVE'?'Kegiatan berlangsung':'Kegiatan belum dimulai':'Belum ada presensi masuk';
 const exit=valid(row.timeOut)?`Keluar ${row.timeOut}`:mode!=='IN_OUT'?'OUT tidak diwajibkan':state==='INCOMPLETE'?'OUT terlewat · perlu ditinjau SPV':valid(row.timeIn)?'Keluar belum tercatat':null;
 return {entry,exit,duration:mode==='IN_OUT'&&valid(row.timeIn)&&valid(row.timeOut)&&valid(row.durationFormatted)?row.durationFormatted:null};
}
