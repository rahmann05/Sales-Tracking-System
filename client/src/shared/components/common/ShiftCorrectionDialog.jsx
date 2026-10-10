import React,{useState} from 'react';
import {NativeDialog} from './NativeDialog';
import {staffAttendanceApi} from '../../../services/api';
import {useApp} from '../../../context/AppContext';
import {shiftTimeView} from '../../../../../shared/shift-policy.mjs';

const localInput=value=>value?new Date(+new Date(value)+7*3600000).toISOString().slice(0,16):'';
const shown=value=>value?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB':'Tidak tersedia';
export function ShiftCorrectionDialog({row,onClose,onSaved}){
 const {user}=useApp(),times=shiftTimeView(row),pending=row.timeCorrection?.pending;
 const [entered,setEntered]=useState(localInput(times.reportedIn||times.actualIn)),[out,setOut]=useState(localInput(times.reportedOut||times.actualOut)),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const propose=user.permissions?.can_propose_shift_correction===true,review=user.permissions?.can_review_shift_correction===true;
 const send=async action=>{
  if(busy)return;setBusy(true);setError('');
  try{await staffAttendanceApi.correctShiftTime(row.id,{action,revision:row.timeCorrection?.revision||0,reason,...(action==='PROPOSE'?{checkInAt:new Date(entered+'+07:00').toISOString(),checkOutAt:out?new Date(out+'+07:00').toISOString():null}:{})});await onSaved();onClose();}catch(e){setError(e.message);}finally{setBusy(false);}
 };
 return <NativeDialog open title={`Koreksi shift · ${row.user?.name||'Staf'}`} onClose={onClose} busy={busy}>
  <div className="grid gap-4">
   <p className="text-sm">Tanggal kerja: {row.dateKey}. Waktu server asli dipertahankan. Koreksi merupakan waktu yang dilaporkan dan disetujui secara administratif; tidak membuat bukti OUT atau menutup shift aktif.</p>
   <dl className="grid gap-2 text-sm"><div><dt className="font-semibold">Masuk asli</dt><dd>{shown(times.actualIn)}</dd></div><div><dt className="font-semibold">Keluar asli</dt><dd>{shown(times.actualOut)}</dd></div>{times.corrected&&<div><dt className="font-semibold">Koreksi terakhir diterima</dt><dd>{shown(times.reportedIn)} → {shown(times.reportedOut)}</dd></div>}</dl>
   <fieldset disabled={busy} className="grid gap-4">
    {pending?<div className="grid gap-2 border rounded-xl p-3 text-sm"><strong>Usulan menunggu keputusan</strong><p>{shown(pending.checkInAt)} → {shown(pending.checkOutAt)}</p><p>Pengusul: {pending.proposedByName}</p><p>Alasan: {pending.reason}</p></div>:<div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm">Masuk dilaporkan (WIB)<input className="form-input" type="datetime-local" required value={entered} onChange={e=>setEntered(e.target.value)}/></label><label className="grid gap-2 text-sm">Keluar dilaporkan (WIB)<input className="form-input" type="datetime-local" value={out} disabled={row.policySnapshot?.values?.SHIFT_ATTENDANCE_MODE==='IN_ONLY'} onChange={e=>setOut(e.target.value)}/></label></div>}
    <label className="grid gap-2 text-sm">Alasan dan referensi pemeriksaan<textarea className="form-input" rows={3} minLength={5} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)}/></label>
    <div className="app-actions">{pending?<>{review&&pending.proposedBy!==user.id&&row.userId!==user.id&&<><button type="button" className="app-button" disabled={reason.trim().length<5} onClick={()=>send('ACCEPT')}>Terima koreksi</button><button type="button" className="app-button" disabled={reason.trim().length<5} onClick={()=>send('REJECT')}>Tolak usulan</button></>}{propose&&pending.proposedBy===user.id&&<button type="button" className="app-button" disabled={reason.trim().length<5} onClick={()=>send('CANCEL')}>Batalkan usulan</button>}</>:propose&&<button type="button" className="app-button" disabled={!entered||reason.trim().length<5} onClick={()=>send('PROPOSE')}>Simpan usulan / keputusan sesuai aturan</button>}</div>
   </fieldset>
   {row.timeCorrection?.history?.length>0&&<details><summary className="min-h-11 cursor-pointer">Riwayat keputusan ({row.timeCorrection.history.length})</summary><ol className="grid gap-3 text-sm">{row.timeCorrection.history.map((h,i)=><li key={i}>{shown(h.at)} · {h.actorName} · {{PROPOSE:'Mengusulkan',ACCEPT_DIRECT:'Keputusan langsung',ACCEPT:'Menerima',REJECT:'Menolak',CANCEL:'Membatalkan'}[h.action]}<p>{h.reason}</p></li>)}</ol></details>}
   {busy&&<p role="status">Menyimpan…</p>}{error&&<p role="alert" className="app-error">{error}</p>}
  </div>
 </NativeDialog>;
}
