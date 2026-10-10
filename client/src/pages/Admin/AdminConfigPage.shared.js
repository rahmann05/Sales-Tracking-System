import React from 'react';
import {POLICY_OPTION_LABELS,POLICY_SECRET_KEYS} from '../../../../shared/operational-policy.mjs';
import '../../styles/pages/AdminConfig.css';
import {parseReferenceCatalog} from '../../../../shared/reference-catalog.mjs';
const catalogDisplay=value=>{try{return parseReferenceCatalog(value).map(r=>`${r.label} (${r.code}${r.active?'':', nonaktif'})`).join('; ');}catch{return 'Referensi tidak valid';}};
export const optionLabels = {
  ...POLICY_OPTION_LABELS,
  DISABLED: 'Nonaktif',
  INCREMENT: 'Otomatis berurutan',
  PATTERN: 'Pola khusus',
  MANUAL: 'Manual (otomatis OFF)',
  DAILY: 'Setiap hari',
  MONTHLY: 'Setiap bulan',
  YEARLY: 'Setiap tahun'
};
export const optionLabel=(param,value)=>{
 if(param.optionLabels?.[value])return param.optionLabels[value];
 if(param.key==='PJP_ALLOWED_INTERVALS')return String(value).split(',').map(v=>`F${v}`).join(' · ')+' (minggu)';
 if(param.key==='PJP_DEFAULT_INTERVAL')return `Setiap ${value} minggu · F${value}`;
 if(param.key==='PJP_CALENDAR_SOURCE')return value==='WEEKDAYS'?'Hari kerja mingguan PJP':'Kalender bulanan Admin';
 if(param.key==='PJP_HOLIDAY_POLICY')return value==='SKIP'?'Lewati dengan peringatan':'Blokir penerbitan';
 if(value==='OPTIONAL'&&!param.key.endsWith('ATTENDANCE_MODE'))return 'Opsional';
 if(param.key==='PACKING_SOURCE_MODE')return {MANUAL:'Input manual',ORDER:'Dari order',BOTH:'Manual atau dari order'}[value]||value;
 if(value==='NONE'&&param.key.startsWith('CODE_'))return 'Tidak direset';
 return optionLabels[value]||value;
};
export const displayValue = (param, value) => POLICY_SECRET_KEYS.includes(param.key)&&value ? '••••••••' : param.type==='catalog'?catalogDisplay(value): param.type==='field-requirements' ? String(value||'').split(',').filter(Boolean).map(key=>param.optionLabels?.[key]||key).join(', ')||'Tidak ada data tambahan wajib' : param.type==='checklist'?Array.isArray(value)?value.map(item=>item.label+(item.required?' (wajib)':'')).join('; ')||'Tanpa pertanyaan':'Belum tersedia': param.type === 'boolean' ? String(value) === 'true' ? 'Aktif' : 'Nonaktif' : optionLabel(param,value) || String(value) || '(kosong)';
