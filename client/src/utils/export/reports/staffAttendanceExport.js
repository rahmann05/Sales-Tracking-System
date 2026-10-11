import {createDocumentExporters} from '../core/createDocumentExporters';
import {attendanceKind,attendanceStages,attendancePhotos,attendanceTime,attendanceStatus,attendanceMap,attendanceAudit,attendanceMode} from '../../../../../shared/staff-attendance-report.mjs';
import {shiftTimeView} from '../../../../../shared/shift-policy.mjs';

export function buildStaffAttendanceBlueprint(rows=[],{date,pendingOnly=false,includePhotos=true}={}){
 const scope=pendingOnly?'Usulan koreksi lintas tanggal (maksimal 100 baris yang ditampilkan)':`Tanggal kerja ${date}`;
 const sections=[{title:'Rekap absensi staf',headers:['ID catatan','Tanggal kerja','Nama','Peran','Aktivitas','Toko','Masuk asli','Keluar asli','Status'],rows:rows.map(row=>{const t=shiftTimeView(row);return [row.id,row.dateKey,row.user?.name||'Tidak tercatat',row.user?.role||'',attendanceKind[row.kind]||row.kind,row.outletName||'Tidak berlaku',attendanceTime(t.actualIn),attendanceTime(t.actualOut),attendanceStatus(row)];})}];
 for(const row of rows){
  const values=row.policySnapshot?.values||{};
  const detail=[['ID catatan',row.id],['Tanggal kerja',row.dateKey],['Mode absensi',attendanceMode[values[row.kind==='SHIFT'?'SHIFT_ATTENDANCE_MODE':'SPV_ATTENDANCE_MODE']]||'Tidak tercatat']];
  if(row.kind==='SHIFT')detail.push(['Jadwal tersimpan',values.SHIFT_START_TIME&&values.SHIFT_END_TIME?`${values.SHIFT_START_TIME} - ${values.SHIFT_END_TIME} WIB`:'Tidak tercatat']);
  for(const e of attendanceStages(row))detail.push([`${e.label} - presensi asli`,attendanceTime(e.at)],[`${e.label} - waktu kegiatan (bukan presensi)`,attendanceTime(e.activityAt)],[`${e.label} - catatan`,e.notes||'Tidak ada'],[`${e.label} - koordinat`,attendanceMap(e)?`${e.latitude}, ${e.longitude}`:'Tidak tercatat'],[`${e.label} - Google Maps`,attendanceMap(e)||'Tidak tersedia'],[`${e.label} - akurasi GPS`,e.gpsEvidence?.accuracy==null?'Tidak tercatat':`${e.gpsEvidence.accuracy} m`],[`${e.label} - GPS diambil`,attendanceTime(e.gpsEvidence?.observedAt)],[`${e.label} - GPS diterima`,attendanceTime(e.gpsEvidence?.receivedAt)],[`${e.label} - foto`,e.photoUrl?(includePhotos?'Terlampir di bagian foto':'Tersimpan; lihat rincian absensi di aplikasi. CSV tidak memuat gambar.'):'Tidak tersimpan']);
  for(const item of attendanceAudit(row))detail.push([`Supervisi - ${item.label}`,`${item.value}${item.reason?` | ${item.reason}`:''}${item.photoUrl?' | Foto tersimpan':''}`]);
  for(const flag of row.flags||[])detail.push(['Penanda pemeriksaan',`${flag.kind} | ${flag.status} | ${attendanceTime(flag.createdAt)}`]);
  for(const [key,label] of [['accepted','Koreksi diterima'],['pending','Usulan koreksi']]){const c=row.timeCorrection?.[key];if(c)detail.push([label,`${attendanceTime(c.checkInAt)} - ${attendanceTime(c.checkOutAt)} | ${c.reason||''} | Pengusul: ${c.proposedByName||'Tidak tercatat'} | Pemeriksa: ${c.decidedByName||'Belum ada'}`]);}
  for(const h of row.timeCorrection?.history||[])detail.push(['Riwayat koreksi',`${attendanceTime(h.at)} | ${h.actorName||''} | ${h.action} | ${h.reason||''}`]);
  sections.push({title:`${row.user?.name||'Staf'} - ${attendanceKind[row.kind]||row.kind} - ${row.dateKey}`,headers:['Informasi','Rincian'],rows:detail,columnWidths:[25,75]});
 }
 return {domain:'REPORTS',title:'RIWAYAT ABSENSI STAF DAN SUPERVISI',subtitle:scope,filename:`Absensi_Staf_${pendingOnly?'Koreksi_Lintas_Tanggal':date}`,sheetName:'ABSENSI_STAF',orientation:'landscape',compact:true,metaItems:[{label:'Lingkup',value:scope},{label:'Jumlah catatan',value:rows.length}],sections,images:includePhotos?rows.flatMap(attendancePhotos):[],notes:['Waktu menggunakan WIB. Waktu kegiatan tanpa presensi bukan bukti masuk/keluar. Koreksi administratif tidak mengganti bukti asli.', 'Laporan ini mencakup tabel shift dan supervisi sesuai filter dan hak akses; rekap PJP validasi outlet terpisah.',includePhotos?'Foto tersimpan disertakan sebagai lampiran berlabel nama, tanggal dan ID catatan.':'CSV berisi status foto dan ID catatan; buka rincian di aplikasi untuk melihat gambar.']};
}
export const staffAttendanceExporters=createDocumentExporters(buildStaffAttendanceBlueprint);
