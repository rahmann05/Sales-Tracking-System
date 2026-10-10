import {createHash} from 'node:crypto';
export const REPORT_FORMULA_VERSION='2026-10-10.1';
const keys=['SALES_ATTENDANCE_MODE','ATTENDANCE_ENFORCE_MIN_DURATION','MINIMUM_VISIT_DURATION_MINUTES','MANUAL_SALES_REPORT_MODE'];
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function reportProvenance(values,...datasets){
 const entities=datasets.flatMap(data=>(data?.rawRecords||[]).flatMap(row=>row.stops?row.stops.flatMap(stop=>[{kind:'VISIT',record:stop},...(stop.orders||[]).map(record=>({kind:'ORDER',record}))]):[{kind:'OFF_PJP',record:row}]));
 const groups=new Map();let unknown=0;
 for(const {kind,record} of entities){
  const snapshot=record.policySnapshot;if(!snapshot){unknown++;continue;}
  const relevant=kind==='ORDER'?['ORDER_APPROVAL_MODE','ORDER_PRICES_INCLUDE_TAX','TAX_RATE_PERCENT']:keys;
  const rules=Object.fromEntries(relevant.map(key=>[key,snapshot.values?.[key]??null]));
  const versions=(snapshot.versions||[]).map(({scope,revision,effectiveAt})=>({scope,revision,effectiveAt})).sort((a,b)=>String(a.scope||'').localeCompare(String(b.scope||'')));
  const id=digest({kind,rules,versions}),group=groups.get(id)||{digest:id,kind,rules,versions,records:0};group.records++;groups.set(id,group);
 }
 return {formulaVersion:REPORT_FORMULA_VERSION,calculationRules:values,processPolicies:[...groups.values()].sort((a,b)=>a.digest.localeCompare(b.digest)),legacyPolicyRecords:unknown,
  policyNote:'Versi formula dan aturan perhitungan dicatat saat laporan dibuat. Snapshot proses ditampilkan bila tersedia; data lama tanpa snapshot tetap ditandai, bukan diberi versi rekaan.'};
}
