import {shiftTimeView} from './shift-policy.mjs';
import {DEFAULT_AUDIT_ITEMS} from './supervision-checklist.mjs';

export const attendanceKind = {SHIFT:'Shift',VISIT:'Supervisi toko',OFF_PJP:'Kunjungan di luar PJP'};
export const attendanceMode = {IN_OUT:'Masuk dan keluar',IN_ONLY:'Masuk saja',OPTIONAL:'Tanpa presensi wajib'};
export function attendanceTime(value) {
 if (!value || !Number.isFinite(+new Date(value))) return 'Tidak tercatat';
 return new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})+' WIB';
}
export function attendanceMap(evidence={}) {
 const {latitude:lat,longitude:lng}=evidence;
 return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180
  ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;
}
export function attendanceStatus(row) {
 const t=shiftTimeView(row);
 if(row.kind!=='SHIFT')return row.checkOutAt||row.checklist?.state==='FINISHED'?'Kegiatan selesai':'Kunjungan belum selesai';
 const mode=row.policySnapshot?.values?.SHIFT_ATTENDANCE_MODE;
 const punctuality=t.lateMinutes==null?(t.actualIn?'Keterlambatan tidak tercatat':'Presensi tidak diwajibkan'):t.lateMinutes>0?`Terlambat ${t.lateMinutes} menit`:'Tepat waktu';
 const closure=row.checkOutAt?'Keluar tercatat':row.checklist?.state==='FINISHED'?(mode==='IN_OUT'?'Shift berakhir tanpa bukti keluar':'Kegiatan selesai'):mode==='IN_OUT'?'Belum absen keluar':'Belum diakhiri';
 return `${punctuality} · ${closure}${t.corrected?' · Ada koreksi diterima':''}`;
}
export function attendanceStages(row) {
 const finish=row.checklist?.finishEvidence||{};
 return [
  {...row,key:'IN',label:'Masuk / mulai',at:shiftTimeView(row).actualIn,activityAt:row.checkInAt,exception:row.checklist?.scheduleException},
  {...finish,key:'OUT',label:'Keluar / selesai',at:row.checkOutAt,activityAt:row.checklist?.finishedAt,applicable:row.kind!=='OFF_PJP'},
 ].filter(e=>e.applicable!==false);
}
export function attendanceAudit(row) {
 let items=row.policySnapshot?.values?.SPV_AUDIT_ITEMS??DEFAULT_AUDIT_ITEMS;
 if(typeof items==='string')try{items=JSON.parse(items);}catch{items=[];}
 return (Array.isArray(items)?items:[]).filter(item=>Object.hasOwn(row.checklist||{},item.key)).map(item=>({key:item.key,label:item.label,value:typeof row.checklist[item.key]==='boolean'?(row.checklist[item.key]?'Ya':'Tidak'):String(row.checklist[item.key]),...row.checklist?._evidence?.[item.key]}));
}
export function attendancePhotos(row) {
 return [...attendanceStages(row).filter(e=>e.photoUrl).map(e=>({url:e.photoUrl,caption:`${row.user?.name||'Staf'} | ${row.dateKey} | ${attendanceKind[row.kind]||row.kind} | Foto ${e.label.toLowerCase()} | ID ${row.id}`})),
 ...attendanceAudit(row).filter(e=>e.photoUrl).map(e=>({url:e.photoUrl,caption:`${row.user?.name||'Staf'} | ${row.dateKey} | ${e.label} | ID ${row.id}`}))];
}
