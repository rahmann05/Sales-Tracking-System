import React,{useEffect,useState} from 'react';
import {useApp} from '../../../context/AppContext';
import {ordersApi} from '../../../services/api';
import {canOrderOperation} from '../../../../../shared/order-operation-permissions.mjs';
const wibInput=value=>value?new Date(Date.parse(value)+7*3600000).toISOString().slice(0,16):'';
export function OrderReviewAssignmentEditor({orderId,readOnly=false}){
  const {user}=useApp();const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[loaded,setLoaded]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const [data,setData]=useState(null),[ownerId,setOwnerId]=useState(''),[due,setDue]=useState(''),[reason,setReason]=useState('');
  useEffect(()=>{if(!open)return;let active=true;setLoading(true);setLoaded(false);setError('');
    ordersApi.getReviewAssignment(orderId).then(res=>{if(!active)return;setData(res.data);setOwnerId(res.data.assignment?.ownerId||'');setDue(wibInput(res.data.assignment?.dueAt));setReason('');setLoaded(true);})
      .catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};
  },[open,orderId]);
  if(!['ADMIN','SUPERVISOR'].includes(user?.role)||!readOnly&&!canOrderOperation(user,'ASSIGN_REVIEW'))return null;
  const save=async event=>{event.preventDefault();if(reason.trim().length<5){setError('Alasan wajib berisi setidaknya 5 karakter selain spasi.');return;}
    setSaving(true);setError('');try{
      await ordersApi.saveReviewAssignment(orderId,{ownerId:ownerId||null,dueAt:ownerId?new Date(`${due}:00+07:00`).toISOString():null,revision:data.assignment?.revision||0,reason:reason.trim()});
      setOpen(false);window.dispatchEvent(new CustomEvent('operational-data-changed'));
    }catch(err){setError(`${err.message}${err.status===409?' Tutup dan buka kembali untuk memuat versi terbaru.':''}`);}finally{setSaving(false);}
  };
  return <>
    <button type="button" className="btn btn-secondary min-h-11" onClick={()=>setOpen(true)}>{readOnly?'Riwayat pemeriksa order':'Atur pemeriksa order'}</button>
    {open&&<div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Penugasan pemeriksa order"><div className="bg-surface rounded-xl p-5 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-3">
      <h3 className="font-bold">Penugasan pemeriksa order</h3>
      <p className="text-sm">Pilih Admin aktif atau SPV tim sales saat ini. Penugasan tidak membuka akses lintas tim. Admin lain dapat mengambil alih keputusan dengan alasan yang dicatat.</p>
      {loading&&<p role="status">Memuat penugasan dan pemeriksa…</p>}{error&&<p role="alert" className="text-red-600">{error}</p>}
      {loaded&&data.status!=='PENDING_APPROVAL'&&<p>Order sudah diputuskan. Penugasan tidak dapat diubah.</p>}
      {loaded&&!readOnly&&data.status==='PENDING_APPROVAL'&&<form className="space-y-3" onSubmit={save}><fieldset disabled={saving} className="space-y-3">
        <label className="block">Pemeriksa<select className="form-input block w-full" value={ownerId} onChange={event=>{setOwnerId(event.target.value);if(!event.target.value)setDue('');}}><option value="">Lepas penugasan khusus; kembali ke tanggung jawab tim</option>{ownerId&&!data.people.some(person=>person.id===ownerId)&&<option value={ownerId} disabled>{data.assignment?.ownerName||ownerId} · sudah tidak memenuhi syarat</option>}{data.people.map(person=><option key={person.id} value={person.id}>{person.name} · {person.role==='ADMIN'?'Admin':'SPV tim'}</option>)}</select></label>
        {ownerId&&<label className="block">Tenggat pemeriksaan (WIB)<input className="form-input block w-full" type="datetime-local" required value={due} onChange={event=>setDue(event.target.value)}/></label>}
        <label className="block">Alasan penetapan / pengalihan / pelepasan<textarea className="form-input block w-full" required minLength={5} maxLength={2000} value={reason} onChange={event=>setReason(event.target.value)}/></label>
        <button className="btn btn-secondary min-h-11">{saving?'Menyimpan…':ownerId?'Simpan penugasan':'Lepas penugasan khusus'}</button>
      </fieldset></form>}
      <details><summary>Riwayat penugasan (30 terakhir)</summary>{data?.history?.map(event=><p key={event.id} className="text-xs border-b py-2">{new Date(event.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB · {event.actorName||'Admin'} · Versi {event.after?.revision} · {event.after?.ownerName||'Penugasan khusus dilepas'} · {event.after?.dueAt?new Date(event.after.dueAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Kembali ke SLA / tanggung jawab tim'} · {event.after?.reason}</p>)}</details>
      <button type="button" className="btn btn-secondary min-h-11" disabled={saving} onClick={()=>setOpen(false)}>Tutup</button>
    </div></div>}
  </>;
}
