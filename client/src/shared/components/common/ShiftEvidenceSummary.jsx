import React,{useEffect,useState} from 'react';
import {staffAttendanceApi} from '../../../services/api';
import {attendanceStages,attendanceTime,attendanceMap,attendanceMode,attendanceAudit} from '../../../../../shared/staff-attendance-report.mjs';
import {NativeDialog} from './NativeDialog';

function EvidencePhoto({url,label}){
 const [failed,setFailed]=useState(false),[expanded,setExpanded]=useState(false);
 return !url?<p className="text-on-surface-variant">Foto tidak tersimpan pada catatan ini.</p>:failed?<p role="alert">Foto gagal dimuat. Coba buka ulang rincian.</p>:<><button type="button" className="text-left" onClick={()=>setExpanded(true)} aria-label={`Perbesar foto ${label}`}><img src={url} alt={`Foto ${label}`} loading="lazy" onError={()=>setFailed(true)} className="max-w-full w-48 max-h-56 object-contain rounded-xl border border-border-glass"/><span className="block text-xs text-primary mt-1">Perbesar foto</span></button>{expanded&&<NativeDialog open title={`Foto ${label}`} onClose={()=>setExpanded(false)}><img src={url} alt={`Foto ${label} diperbesar`} className="w-full max-h-[70vh] object-contain"/></NativeDialog>}</>;
}
export function ShiftEvidenceSummary({row}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let active=true;setData(null);setError('');
  staffAttendanceApi.evidence(row.id).then(res=>{if(active)setData(res.data);}).catch(e=>{if(active)setError(e.message);});
  return()=>{active=false;};
 },[row.id,retry]);
 const values=data?.policySnapshot?.values||{},audit=data?attendanceAudit(data):[];
 const mode=values[data?.kind==='SHIFT'?'SHIFT_ATTENDANCE_MODE':'SPV_ATTENDANCE_MODE'];
 return <div className="staff-attendance-evidence grid gap-4 text-sm min-w-0">
   {error?<div role="alert"><p>{error}</p><button type="button" className="app-button mt-2" onClick={()=>setRetry(n=>n+1)}>Coba lagi</button></div>:!data?<p role="status">Memuat bukti absensi…</p>:<>
    <div className="grid gap-1"><p>Tanggal kerja: <strong>{data.dateKey}</strong> · Mode: {attendanceMode[mode]||'Tidak tercatat'}</p>
     {data.kind==='SHIFT'&&<p>Jadwal saat pencatatan: {values.SHIFT_START_TIME&&values.SHIFT_END_TIME?`${values.SHIFT_START_TIME}–${values.SHIFT_END_TIME} WIB`:'Tidak tersimpan pada data lama'}</p>}
     {data.visitMode&&<p>Jenis supervisi: {{JOINT_VISIT:'Pendampingan Sales',PRIORITY_AUDIT:'Pemeriksaan toko'}[data.visitMode]||data.visitMode}</p>}
     <p className="text-xs break-all text-on-surface-variant">ID catatan: {data.id}</p></div>
    <div className="staff-attendance-stages">{attendanceStages(data).map(e=><section key={e.key} className="border border-border-glass rounded-xl p-3 grid content-start gap-2 min-w-0">
     <strong>{e.label}</strong><p>Presensi asli: {attendanceTime(e.at)}</p>
     {!e.at&&e.activityAt&&<p>Waktu kegiatan: {attendanceTime(e.activityAt)}. Bukan bukti presensi.</p>}
     {e.exception&&<p>{{EARLY_FINISH:'Selesai sebelum jadwal',NON_WORKDAY:'Mulai di luar hari kerja'}[e.exception]||e.exception}</p>}
     <p className="whitespace-pre-wrap break-words">Catatan: {e.notes||'Tidak ada catatan'}</p>
     {attendanceMap(e)?<><a className="text-primary underline break-all" target="_blank" rel="noopener noreferrer" href={attendanceMap(e)}>GPS: {e.latitude}, {e.longitude} · Buka Google Maps</a><p>Akurasi: {e.gpsEvidence?.accuracy==null?'Tidak tercatat':`${e.gpsEvidence.accuracy} m`}</p><p>GPS diambil: {attendanceTime(e.gpsEvidence?.observedAt)}<br/>Diterima server: {attendanceTime(e.gpsEvidence?.receivedAt)}</p></>:<p>Lokasi GPS tidak tersimpan.</p>}
     <EvidencePhoto url={e.photoUrl} label={e.label.toLowerCase()}/>
    </section>)}</div>
    {audit.length>0&&<section className="grid gap-3"><strong>Hasil pemeriksaan supervisi</strong>{audit.map(item=><div key={item.key}><p>{item.label}: {item.value}</p>{item.reason&&<p>Alasan: {item.reason}</p>}{item.photoUrl&&<EvidencePhoto url={item.photoUrl} label={item.label}/>}</div>)}</section>}
    {data.flags?.length>0&&<section><strong>Penanda pemeriksaan</strong>{data.flags.map((flag,i)=><p key={i}>{{UNCLOSED_SHIFT:'Shift tanpa absen keluar',SHIFT_TIME_RANGE:'Durasi shift perlu diperiksa',OPEN_SPV_VISIT:'Kunjungan belum ditutup'}[flag.kind]||flag.kind} · {flag.status==='OPEN'?'Belum ditangani':'Sudah ditangani'} · {attendanceTime(flag.createdAt)}{flag.details?.elapsedMinutes!=null&&` · Durasi ${flag.details.elapsedMinutes} menit`}{flag.details?.overnight&&' · Melewati pergantian hari'}{flag.details?.pastScheduledEnd&&' · Melewati jadwal selesai'}</p>)}</section>}
    {(data.timeCorrection?.accepted||data.timeCorrection?.pending||data.timeCorrection?.history?.length>0)&&<section className="border-t border-border-glass pt-3 grid gap-2"><strong>Koreksi administratif</strong><p>Koreksi tidak mengganti foto, lokasi, atau waktu presensi asli.</p>{data.timeCorrection.accepted&&<p>Diterima: {attendanceTime(data.timeCorrection.accepted.checkInAt)} → {attendanceTime(data.timeCorrection.accepted.checkOutAt)}<br/>Oleh: {data.timeCorrection.accepted.decidedByName||'Tidak tercatat'} · {attendanceTime(data.timeCorrection.accepted.decidedAt)}<br/>Alasan: {data.timeCorrection.accepted.decisionReason||data.timeCorrection.accepted.reason}</p>}{data.timeCorrection.pending&&<p>Usulan menunggu keputusan: {attendanceTime(data.timeCorrection.pending.checkInAt)} → {attendanceTime(data.timeCorrection.pending.checkOutAt)}<br/>Pengusul: {data.timeCorrection.pending.proposedByName||'Tidak tercatat'}<br/>Alasan: {data.timeCorrection.pending.reason}</p>}{data.timeCorrection.history?.map((h,i)=><p key={i}>{attendanceTime(h.at)} · {h.actorName} · {{PROPOSE:'Mengusulkan',ACCEPT_DIRECT:'Menerima langsung',ACCEPT:'Menerima',REJECT:'Menolak',CANCEL:'Membatalkan'}[h.action]||h.action}<br/>{h.reason}</p>)}</section>}
   </>}
  </div>;
}
