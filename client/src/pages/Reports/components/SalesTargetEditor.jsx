import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { collectPages, reportsApi, usersApi } from '../../../services/api';
import { formatTarget, targetPeriodError } from '../../../../../shared/sales-targets.mjs';

export function SalesTargetEditor({ sales, kind, period, onSaved }) {
  const { user } = useApp();
  const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false);
  const [error,setError]=useState(''),[target,setTarget]=useState(null),[history,setHistory]=useState([]),[supervisors,setSupervisors]=useState([]);
  const [loaded,setLoaded]=useState(false);
  const [amount,setAmount]=useState(''),[supervisorId,setSupervisorId]=useState(''),[reason,setReason]=useState('');
  useEffect(()=>{
    if(!open)return;
    let active=true;setLoading(true);setLoaded(false);setError('');
    Promise.all([reportsApi.getTarget({kind,period,userId:sales.salesmanId}),collectPages(usersApi.getAll,{role:'SUPERVISOR'})])
      .then(([response,people])=>{if(!active)return;const saved=response.data.target;setTarget(saved);setHistory(response.data.history||[]);setSupervisors(people.data||[]);
        setAmount(saved?String(saved.amount):'');setSupervisorId(saved?.supervisorId||'');setReason('');setLoaded(true);})
      .catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[open,kind,period,sales.salesmanId]);
  if(user?.role!=='ADMIN'||user.permissions?.can_view_reports===false)return null;
  const periodError=targetPeriodError(kind,period);
  const submit=async event=>{
    event.preventDefault();setSaving(true);setError('');
    try {await reportsApi.saveTarget({kind,period,userId:sales.salesmanId,amount:Number(amount),supervisorId:supervisorId||null,reason,revision:target?.revision||0});setOpen(false);onSaved?.();}
    catch(err){setError(`${err.message}${err.status===409?' Tutup dan buka kembali form untuk memuat versi terbaru.':''}`);}
    finally{setSaving(false);}
  };
  return <>
    <button type="button" className="app-button text-xs" disabled={Boolean(periodError)} title={periodError||'Tetapkan atau revisi target periode'} onClick={()=>setOpen(true)}>Atur target</button>
    {open&&<div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`Target ${sales.salesmanName}`}>
      <div className="bg-surface rounded-xl p-5 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-3 text-left whitespace-normal">
        <h3 className="font-bold">Target {sales.salesmanName} · {period}</h3>
        <p className="text-xs">Nilai order disetujui dalam rupiah. Nol berarti sales ditetapkan tanpa target. Perubahan berlaku pada laporan periode ini dan tercatat dalam riwayat.</p>
        {error&&<p role="alert" className="app-error">{error}</p>}
        {loading?<p role="status">Memuat target dan riwayat…</p>:loaded&&<form onSubmit={submit} className="space-y-3">
          <label className="block">Target (Rp)<input className="app-input w-full" type="number" min="0" max="1000000000000" step="1" required value={amount} onChange={e=>setAmount(e.target.value)} disabled={saving}/></label>
          <label className="block">Penanggung jawab target tim<select className="app-input w-full" value={supervisorId} onChange={e=>setSupervisorId(e.target.value)} disabled={saving}>
            <option value="">Perusahaan saja (tidak masuk target tim SPV)</option>
            {target?.supervisorId&&!supervisors.some(spv=>spv.id===target.supervisorId)&&<option value={target.supervisorId}>SPV riwayat tersimpan</option>}
            {supervisors.map(spv=><option key={spv.id} value={spv.id}>{spv.name}</option>)}
          </select></label>
          <p className="text-xs">Pilih SPV yang bertanggung jawab atas target periode ini. Perpindahan tim tidak membagi target otomatis.</p>
          <label className="block">Alasan penetapan/perubahan<textarea className="app-input w-full" minLength={5} maxLength={1000} required value={reason} onChange={e=>setReason(e.target.value)} disabled={saving}/></label>
          <button type="submit" className="app-button" disabled={saving}>{saving?'Menyimpan…':'Simpan target'}</button>
        </form>}
        <button type="button" className="app-button" disabled={saving} onClick={()=>setOpen(false)}>Tutup</button>
        <details><summary>Riwayat perubahan (30 terakhir)</summary>{history.length?history.map(event=><p key={event.id} className="text-xs border-b py-2">{new Date(event.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB · {event.actorName||'Admin'} · {formatTarget(event.before?.amount)} → {formatTarget(event.after?.amount)} · {event.after?.reason}</p>):<p>Belum ada penetapan target.</p>}</details>
      </div>
    </div>}
  </>;
}
