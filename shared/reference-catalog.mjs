export const DEFAULT_SERVICE_CATALOG=[
 {code:'GANTI_OLI',label:'Ganti oli mesin',active:true},
 {code:'GANTI_FILTER_OLI',label:'Ganti filter oli',active:true},
 {code:'GANTI_KANVAS_REM',label:'Ganti kanvas rem',active:true},
 {code:'LAINNYA',label:'Lainnya',active:true},
];
export function parseReferenceCatalog(raw,required=DEFAULT_SERVICE_CATALOG.map(r=>r.code)){
 const rows=typeof raw==='string'?JSON.parse(raw):raw;
 if(!Array.isArray(rows)||!rows.length||rows.length>50)throw new Error('Referensi harus memuat 1–50 pilihan');
 const seen=new Set();
 const result=rows.map(row=>{
  if(!row||typeof row!=='object'||!/^[A-Z][A-Z0-9_]{0,47}$/.test(row.code)||typeof row.label!=='string'||!row.label.trim()||row.label.length>100||typeof row.active!=='boolean')throw new Error('Kode huruf besar/angka/garis bawah, label 1–100 karakter, dan status aktif wajib valid');
  if(seen.has(row.code))throw new Error(`Kode referensi duplikat: ${row.code}`);seen.add(row.code);
  return {code:row.code,label:row.label.trim(),active:row.active};
 });
 if(required.some(code=>!seen.has(code)))throw new Error('Kode referensi tersimpan tidak boleh dihapus. Nonaktifkan untuk input baru.');
 if(!result.some(r=>r.active))throw new Error('Minimal satu pilihan referensi harus aktif');
 return result;
}
export function serviceCatalog(values={}){
 return parseReferenceCatalog(values.VEHICLE_SERVICE_CATALOG??DEFAULT_SERVICE_CATALOG);
}
export function retainServiceCodes(next,previous={}){
 for(const key of ['VISIT_PURPOSE_CATALOG','COLLECTION_RESULT_CATALOG','VISIT_OBSTACLE_CATALOG'])if(next[key]!==undefined&&previous[key]!==undefined)parseReferenceCatalog(next[key],parseReferenceCatalog(previous[key],[]).map(r=>r.code));
 if(next.VEHICLE_SERVICE_CATALOG!==undefined)parseReferenceCatalog(next.VEHICLE_SERVICE_CATALOG,serviceCatalog(previous).map(r=>r.code));
}
export function serviceRecordLabel(record){
 const codes=record.serviceTypes?.length?record.serviceTypes:[record.serviceType],stored=[...(record.policySnapshot?.serviceReferences||[]),record.policySnapshot?.serviceReference].filter(Boolean);
 return codes.map(code=>stored.find(r=>r.code===code)?.label||DEFAULT_SERVICE_CATALOG.find(r=>r.code===code)?.label||code).join(', ');
}
