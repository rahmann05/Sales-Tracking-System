import {OUTLET_DIGITAL_VERSION} from './outlet-validation.mjs';

const fields = {name:'nama outlet',address:'alamat',latitude:'titik koordinat',longitude:'titik koordinat',clusterId:'wilayah penugasan',phone:'nomor telepon'};
const recheck = 'Klik “Periksa dengan Google” untuk memeriksa data outlet saat ini.';
const time = value => new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(value))+' WIB';
const timestamp = value => value == null ? NaN : new Date(value).getTime();
const serviceErrors = {
 MAP_TIMEOUT:'Google tidak merespons dalam batas waktu pemeriksaan.',
 MAP_HTTP_ERROR:'Google mengembalikan kegagalan HTTP; penyebab lebih rinci tidak tersedia pada hasil ini.',
 MAP_AUTHORIZATION_ERROR:'Google menolak akses API. Periksa kunci server, izin Places API dan pembatasan kuncinya.',
 MAP_QUOTA_EXCEEDED:'Kuota atau batas laju layanan Google tercapai. Coba lagi setelah kuota tersedia.',
 MAP_PLACE_NOT_FOUND:'Profil kandidat tidak tersedia lagi pada Google.',
 MAP_PLACE_ID_MISMATCH:'Identitas balasan Google berbeda dari kandidat yang diminta; hasil tidak digunakan.',
 MAP_INVALID_RESPONSE:'Format respons Google tidak dapat digunakan.',
 MAP_LOCAL_QUOTA_LIMIT:'Batas panggilan aplikasi atau kuota layanan Google tercapai.',
 MAP_PROVIDER_ERROR:'Layanan Google gagal memberikan hasil yang dapat digunakan.',
 'Kunci Google pada server belum tersedia':'Kunci Google pada server belum tersedia.',
 'Respons kandidat tidak valid':'Format daftar kandidat dari Google tidak valid.',
};

function outcomeDetails(result) {
 const details=Array.isArray(result.reasons)?result.reasons.filter(value=>typeof value==='string'):[];
 const candidates=Array.isArray(result.assessments)?result.assessments:Array.isArray(result.candidates)?result.candidates:[];
 const candidate=candidates.find(c=>c?.placeId===result.selectedPlaceId);
 for(const [field,policy,label] of [['nameScore','strongName','nama'],['addressScore','strongAddress','alamat']]) {
  const score=candidate?.[field],minimum=result.comparisonPolicy?.[policy];
  if(Number.isFinite(score)&&Number.isFinite(minimum)&&score<minimum) details.push(`Kemiripan ${label} ${score}%, di bawah batas konfirmasi ${minimum}% pada pemeriksaan ini.`);
 }
 for(const step of Array.isArray(result.steps)?result.steps:[]) {
  if(!step)continue;
  if(step.state==='ERROR') details.push(serviceErrors[step.error]||'Salah satu langkah Google gagal tanpa rincian penyebab yang tersimpan.');
  if(step.state==='SKIPPED'&&step.reason==='Batas panggilan tercapai') details.push('Sebagian langkah tidak dijalankan karena batas panggilan per pemeriksaan tercapai.');
 }
 return [...new Set(details)];
}

// This assesses eligibility for a NEW digital decision, not the validity of an
// already completed review. Shared by the UI and the authoritative API gate.
export function outletDigitalReadiness(run,outlet,{now=Date.now(),placeId}={}) {
 const evidenceIssues=[];
 const add=(code,message,action=recheck,extra={})=>evidenceIssues.push({code,message,action,...extra});
 if(!run){
  add('GOOGLE_NOT_CHECKED','Belum ada hasil pemeriksaan Google yang dipilih untuk kasus ini.');
  return {current:false,canConfirm:false,evidenceIssues,issues:evidenceIssues};
 }
 const result=run.result||{};
 if(result.version!==OUTLET_DIGITAL_VERSION) add('EVALUATION_METHOD_CHANGED','Hasil ini belum memakai metode pencocokan nama, alamat, dan lokasi yang digunakan saat ini.');
 if(!run.snapshot||typeof run.snapshot!=='object'||Array.isArray(run.snapshot)) add('MASTER_SNAPSHOT_MISSING','Data outlet saat pemeriksaan sebelumnya tidak tersimpan, sehingga kesesuaiannya dengan master saat ini tidak dapat diperiksa.');
 else {
  const changedFields=Object.keys(fields).filter(key=>(run.snapshot[key]??null)!==(outlet?.[key]??null));
  if(changedFields.length) add('MASTER_CHANGED',`Data master berubah sejak pemeriksaan Google terakhir: ${[...new Set(changedFields.map(key=>fields[key]))].join(', ')}. Hasil lama belum menilai data yang sekarang.`,recheck,{fields:changedFields});
 }
 if(result.expiresAt!=null){
  const expiry=timestamp(result.expiresAt);
  if(!Number.isFinite(expiry)) add('ASSESSMENT_VALIDITY_UNKNOWN','Batas waktu penggunaan hasil penilaian tidak dapat dibaca.');
  else if(expiry<=now) add('ASSESSMENT_EXPIRED',`Batas waktu penggunaan hasil penilaian untuk persetujuan baru berakhir pada ${time(expiry)}.`,recheck,{expiredAt:new Date(expiry).toISOString()});
 }
 // A purge removes providerExpiresAt with the cache. The durable result still
 // records its original expiry, so explain an expired cache rather than guessing.
 const expiry=timestamp(run.providerExpiresAt ?? result.providerExpiresAt);
 if(Number.isFinite(expiry)&&expiry<=now) add('GOOGLE_CACHE_EXPIRED',`Cache hasil Google berakhir pada ${time(expiry)} dan tidak dapat dipakai untuk persetujuan baru.`,recheck,{expiredAt:new Date(expiry).toISOString()});
 else if(!run.providerContent) add('GOOGLE_CACHE_UNAVAILABLE','Detail kandidat Google tidak tersedia untuk diperiksa. Ini tidak berarti outlet ditolak.');
 else if(!run.providerExpiresAt||!Number.isFinite(timestamp(run.providerExpiresAt))) add('GOOGLE_CACHE_VALIDITY_UNKNOWN','Masa berlaku cache hasil Google belum tercatat dengan benar.');

 const issues=[...evidenceIssues];
 const reasons=outcomeDetails(result);
 if(result.code!=='STRONG') {
  const outcome={
   AMBIGUOUS:['CANDIDATES_AMBIGUOUS','Beberapa kandidat Google memiliki kecocokan yang hampir sama; outlet yang tepat belum dapat dipastikan.','Tinjau kandidat dan tambahkan nama jalan, nomor toko atau patokan, lalu periksa ulang. Gunakan bukti internal atau tugas Sales jika tetap ambigu.'],
   ADDRESS_ONLY:['ONLY_ADDRESS_FOUND','Google menemukan alamat, tetapi identitas toko belum terkonfirmasi.','Lengkapi nama toko dan petunjuk alamat, lalu periksa ulang. Gunakan bukti internal atau tugas Sales jika toko tetap tidak ditemukan.'],
   NOT_FOUND:['OUTLET_NOT_FOUND','Pencarian Google tidak menemukan kandidat toko yang sesuai.','Periksa nama dan alamat yang dicari. Jika tetap tidak ditemukan, gunakan bukti internal atau tugaskan Sales.'],
   ERROR:['GOOGLE_CHECK_FAILED','Pemeriksaan Google belum berhasil diselesaikan.','Lihat rincian langkah layanan dan perbaiki kendalanya, lalu periksa ulang. Kegagalan layanan bukan penolakan outlet.'],
   INCOMPLETE:['SEARCH_INFORMATION_INCOMPLETE','Petunjuk pencarian belum cukup untuk memeriksa outlet.','Lengkapi nama toko, jalan, wilayah atau patokan sebelum memeriksa ulang.'],
   REVIEW:['MATCH_NOT_STRONG','Kecocokan kandidat Google belum memenuhi syarat konfirmasi.','Tinjau alasan dan perbedaan data pada hasil pemeriksaan. Perjelas petunjuk lalu periksa ulang, atau gunakan bukti internal/lapangan.'],
  }[result.code]||['ASSESSMENT_INCOMPLETE','Hasil pemeriksaan belum memuat penilaian yang dapat dipakai untuk konfirmasi.',recheck];
  issues.push({code:outcome[0],message:outcome[1],action:outcome[2],...(reasons.length?{details:reasons}:{})});
 } else if(!result.selectedPlaceId) issues.push({code:'GOOGLE_CANDIDATE_MISSING',message:'Identitas kandidat Google yang dinilai belum tersimpan.',action:recheck});
 else if(placeId!=null&&placeId!==result.selectedPlaceId) issues.push({code:'GOOGLE_CANDIDATE_CHANGED',message:'Kandidat yang dipilih berbeda dari kandidat pada hasil penilaian. Kandidat ini belum disetujui oleh pemeriksaan tersebut.',action:'Klik “Periksa ulang kandidat ini” pada kandidat yang ingin digunakan, lalu tinjau hasilnya.'});
 return {current:evidenceIssues.length===0,canConfirm:issues.length===0,evidenceIssues,issues};
}

export function outletDigitalRejectionMessage(readiness) {
 return 'Konfirmasi melalui Google belum dapat disimpan. '+[
  ...readiness.issues.map(issue=>[issue.message,issue.details?.length?`Rincian: ${issue.details.join(' ')}`:''].filter(Boolean).join(' ')),
  ...new Set(readiness.issues.map(issue=>issue.action)),
 ].join(' ');
}
