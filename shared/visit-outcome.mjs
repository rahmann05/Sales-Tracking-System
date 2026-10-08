export const visitPurposes={ORDER:'Penawaran / order',COLLECTION:'Penagihan order sebelumnya',BOTH:'Order dan penagihan',OTHER:'Kunjungan lainnya'};
export const collectionResults={DISCUSSED:'Tagihan disampaikan',PROMISED:'Janji pembayaran',REPORTED_PAID:'Sales melaporkan pembayaran di luar aplikasi',UNAVAILABLE:'Pihak yang ditagih tidak ditemui',DISPUTED:'Ada kendala / keberatan tagihan'};
export const includesCollection=purpose=>['COLLECTION','BOTH'].includes(purpose);
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
  return [visitPurposes[value.purpose],includesCollection(value.purpose)?`Referensi: ${value.reference}`:null,collectionResults[value.result],value.promiseDate?`Janji: ${value.promiseDate}`:null,value.note].filter(Boolean).join(' · ');
}
