export const REPORT_PRESENTATION={
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
