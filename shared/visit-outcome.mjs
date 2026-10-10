export const visitPurposes={ORDER:'Penawaran / order',COLLECTION:'Penagihan order sebelumnya',BOTH:'Order dan penagihan',OTHER:'Kunjungan lainnya'};
export const collectionResults={DISCUSSED:'Tagihan disampaikan',PROMISED:'Janji pembayaran',REPORTED_PAID:'Sales melaporkan pembayaran di luar aplikasi',UNAVAILABLE:'Pihak yang ditagih tidak ditemui',DISPUTED:'Ada kendala / keberatan tagihan'};
export const includesCollection=purpose=>['COLLECTION','BOTH'].includes(purpose);
export const VISIT_ATTACHMENT_LIMIT=700000;
export function validVisitAttachment(value){
 if(typeof value!=='string'||value.length>VISIT_ATTACHMENT_LIMIT)return false;
 return /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)&&
  (value.startsWith('data:image/jpeg;base64,/9j/')||value.startsWith('data:image/png;base64,iVBORw0KGgo'));
}
export function visitResultPolicyError(value,values={},notes=''){
 const mandatory=['VISIT_RESULT_OFFER_MODE','VISIT_RESULT_OBSTACLE_MODE','VISIT_RESULT_ATTACHMENT_MODE'].some(k=>values[k]==='REQUIRED');
 if((values.SALES_REQUIRE_VISIT_RESULT||mandatory)&&!value?.purpose)return 'Pilih tujuan dan hasil kunjungan.';
 if(values.VISIT_RESULT_REQUIRE_NOTE&&!(value?.note||notes)?.trim())return 'Catatan hasil kunjungan wajib diisi.';
 for(const [key,param,label] of [['offer','VISIT_RESULT_OFFER_MODE','Rincian penawaran'],['obstacle','VISIT_RESULT_OBSTACLE_MODE','Kendala kunjungan'],['attachments','VISIT_RESULT_ATTACHMENT_MODE','Lampiran hasil kunjungan']]){
  const filled=key==='attachments'?value?.attachments?.length>0:Boolean(value?.[key]?.trim());
  if(values[param]==='DISABLED'&&filled)return `${label} dinonaktifkan oleh aturan kunjungan ini. Hapus isi field tersebut sebelum mengirim.`;
  if(values[param]==='REQUIRED'&&!filled)return `${label} wajib diisi.`;
 }
 return value?visitOutcomeError(value):null;
}
export function visitOutcomeError(value) {
  if(!value)return null;
  if(!visitPurposes[value.purpose])return 'Tujuan kunjungan tidak valid';
  if(!includesCollection(value.purpose))return null;
  if(!value.reference?.trim())return 'Referensi order / faktur yang ditagih wajib diisi';
  if(!collectionResults[value.result])return 'Hasil penagihan wajib dipilih';
  if(!value.note?.trim())return 'Catatan hasil penagihan wajib diisi';
  if(value.result==='PROMISED'&&!value.promiseDate)return 'Tanggal janji pembayaran wajib diisi';
  if(value.promiseDate){const date=new Date(`${value.promiseDate}T00:00:00Z`);if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==value.promiseDate)return 'Tanggal janji pembayaran tidak valid';}
  return null;
}
export function visitOutcomeText(value) {
  if(!value)return '';
  return [visitPurposes[value.purpose],includesCollection(value.purpose)?`Referensi: ${value.reference}`:null,collectionResults[value.result],value.promiseDate?`Janji: ${value.promiseDate}`:null,value.note,value.offer?`Penawaran: ${value.offer}`:null,value.obstacle?`Kendala: ${value.obstacle}`:null,value.attachments?.length?`${value.attachments.length} lampiran`:null].filter(Boolean).join(' · ');
}
