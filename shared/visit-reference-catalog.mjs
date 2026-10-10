import {parseReferenceCatalog} from './reference-catalog.mjs';
export const VISIT_REFERENCE_CATALOGS={
 VISIT_PURPOSE_CATALOG:[['ORDER','Penawaran / order'],['COLLECTION','Penagihan order sebelumnya'],['BOTH','Order dan penagihan'],['OTHER','Kunjungan lainnya']],
 COLLECTION_RESULT_CATALOG:[['DISCUSSED','Tagihan disampaikan'],['PROMISED','Janji pembayaran'],['REPORTED_PAID','Sales melaporkan pembayaran di luar aplikasi'],['UNAVAILABLE','Pihak yang ditagih tidak ditemui'],['DISPUTED','Ada kendala / keberatan tagihan']],
 VISIT_OBSTACLE_CATALOG:[['NONE','Tidak ada kendala'],['OWNER_UNAVAILABLE','Pemilik tidak ditemui'],['NO_DEMAND','Belum membutuhkan order'],['OTHER','Kendala lainnya']],
};
export const defaultVisitCatalog=key=>VISIT_REFERENCE_CATALOGS[key].map(([code,label])=>({code,label,active:true}));
export function visitCatalog(key,values={}){
 const codes=VISIT_REFERENCE_CATALOGS[key].map(([code])=>code),rows=parseReferenceCatalog(values[key]??defaultVisitCatalog(key),codes);
 if(key!=='VISIT_OBSTACLE_CATALOG'&&rows.some(r=>!codes.includes(r.code)))throw new Error('Kode tujuan/hasil mempunyai perilaku bisnis tetap. Ubah label, urutan atau status aktif; tidak menambah kode baru.');
 return rows;
}
export function visitReferenceLabels(value,values={}){
 const labels={};
 for(const [field,key] of [['purpose','VISIT_PURPOSE_CATALOG'],['result','COLLECTION_RESULT_CATALOG'],['obstacleCode','VISIT_OBSTACLE_CATALOG']]){
  if(!value?.[field])continue;
  const row=visitCatalog(key,values).find(r=>r.code===value[field]);
  if(!row?.active)throw new Error(`Pilihan ${field} tidak tersedia pada aturan kunjungan ini. Pilih kembali.`);
  labels[field]=row.label;
 }
 return labels;
}
