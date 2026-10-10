export const OUTLET_RESULT_LABELS={UNEXAMINED:'Belum diperiksa',STRONG:'Identitas dan lokasi kuat',REVIEW:'Kandidat perlu ditinjau',ADDRESS_ONLY:'Hanya alamat ditemukan',AMBIGUOUS:'Kandidat ambigu',NOT_FOUND:'Tidak ditemukan di Google',INCOMPLETE:'Petunjuk belum cukup',ERROR:'Layanan belum berhasil'};
export const OUTLET_STAGE_LABELS={OPEN:'Belum diperiksa',REVIEW:'Siap ditinjau',NEEDS_FIELD:'Perlu lapangan',WAITING_FIELD:'Tugas lapangan berjalan',SUBMITTED:'Bukti menunggu pemeriksaan',COMPLETED:'Selesai',CANCELLED:'Dibatalkan'};
export const knownPoint=p=>Number.isFinite(p?.latitude)&&Number.isFinite(p?.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180;
export const outletNameUnusable=name=>!name?.trim()||/^(toko|warung|outlet|customer|pelanggan|unknown|[-?.\d\s]+)$/i.test(name.trim());
export function outletIssues(o){
 const q=o.validationDetails?.qualityConfirmed,confirmed=q?.source==='FIELD'&&q.name===o.name&&q.address===o.address&&!o.validationDetails?.stale;
 const issues=[];if(!knownPoint(o))issues.push('MISSING_POINT');
 if(!confirmed&&(!o.name?.trim()||/^\S+$/.test(o.name.trim())||/^(toko|warung|outlet|customer|pelanggan|unknown|[-?.\d\s]+)$/i.test(o.name.trim())))issues.push('UNCLEAR_NAME');
 const address=o.address?.trim()||'',parts=address.split(/\s+/),specific=/\b(jl\.?|jalan|gg\.?|gang|kp\.?|kampung|komplek|kompleks|perum|pasar|ruko|rt|rw|no\.?|nomor|dusun|blok|depan|belakang|sebelah|dekat|patokan)\b/i.test(address);
 if(!confirmed&&(!address||address.length<8||parts.length<3||!specific&&(parts.length<4||/\b(kabupaten|kecamatan|kelurahan|provinsi|kota|jawa)\b/i.test(address))))issues.push('INCOMPLETE_ADDRESS');
 if(knownPoint(o)&&['IMPORT','MANUAL'].includes(o.locationEvidence?.source||o.source))issues.push('UNCONFIRMED_POINT');
 if(o.validationDetails?.stale)issues.push('CHANGED');return issues;
}
export const OUTLET_ISSUE_LABELS={MISSING_POINT:'Titik kosong',UNCLEAR_NAME:'Nama belum jelas',INCOMPLETE_ADDRESS:'Alamat kurang lengkap',UNCONFIRMED_POINT:'Titik perlu diperiksa',CHANGED:'Data berubah'};
export function outletEvidenceCurrent(run,outlet,now=Date.now()){
 if(!run)return false;
 return ['name','address','latitude','longitude','clusterId','phone'].every(k=>(run.snapshot?.[k]??null)===(outlet?.[k]??null))&&(!run.result?.expiresAt||Date.parse(run.result.expiresAt)>now);
}
export function fieldTaskGaps(tasks,people){
 return tasks.flatMap(t=>{
  const owner=people.find(p=>p.id===t.ownerId),reviewer=people.find(p=>p.id===t.reviewerId);
  const issues=[];
  const supervisorId=t.review?.outlet?.cluster?.supervisorId;
  if(!owner||owner.deletedAt||owner.role!=='SALES'||owner.permissions.can_submit_outlet_field!==true||supervisorId&&owner.supervisorId!==supervisorId)issues.push({key:`OUTLET_FIELD:${t.id}:OWNER`,message:'Alihkan tugas validasi outlet sebelum mencabut akses atau memindahkan tim Sales.'});
  if(!reviewer||reviewer.deletedAt||!['ADMIN','SUPERVISOR'].includes(reviewer.role)||reviewer.permissions.can_review_outlet_field!==true||reviewer.id===owner?.id||reviewer.role==='SUPERVISOR'&&owner?.supervisorId!==reviewer.id)issues.push({key:`OUTLET_FIELD:${t.id}:REVIEWER`,message:'Siapkan pemeriksa berizin untuk tugas validasi outlet.'});
  return issues;
 });
}
