import React,{useEffect,useState} from 'react';
import {request} from '../../../services/httpClient';
import {useApp} from '../../../context/AppContext';

export function SalesExceptionClarifications(){
 const {user}=useApp(),[items,setItems]=useState([]),[notes,setNotes]=useState({}),[busy,setBusy]=useState(''),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  const load=()=>request('/attention/my-exceptions').then(res=>{if(active){setItems(res.data);setError('');}}).catch(e=>{if(active)setError(e.message);});
  load();window.addEventListener('operational-data-changed',load);
  return()=>{active=false;window.removeEventListener('operational-data-changed',load);};
 },[user.id]);
 const send=async(id,event)=>{event.preventDefault();setBusy(id);setError('');try{
  const res=await request(`/attention/exceptions/${id}/clarify`,{method:'PATCH',body:JSON.stringify({note:notes[id]})});
  setItems(rows=>rows.map(row=>row.id===id?res.data:row));window.dispatchEvent(new CustomEvent('operational-data-changed'));
 }catch(e){setError(e.message);}finally{setBusy('');}};
 if(!items.length&&!error)return null;
 return <section className="sales-panel p-5 space-y-4" aria-label="Presensi perlu perhatian">
  <div><h2 className="font-semibold">Presensi perlu perhatian</h2><p className="text-sm text-on-surface-variant">Pemeriksaan tetap terbuka sampai SPV mengambil keputusan. Penjelasan tidak membuat bukti absen keluar.</p></div>
  {error&&<p role="alert" className="app-error">{error}</p>}
  {items.map(row=>{const asked=row.decision?.value==='REQUIRES_CORRECTION',sent=row.details.clarification?.requestAt===row.decision?.at;return <details key={row.id} className="border border-border-glass rounded-xl p-4" open={asked&&!sent||undefined}>
   <summary className="cursor-pointer min-h-11">{row.details.outletName||'Kegiatan'} · {asked?sent?'Penjelasan menunggu pemeriksaan':'SPV meminta penjelasan':'Menunggu pemeriksaan SPV'}</summary>
   {row.decision?.note&&<p className="py-2 text-sm">Catatan SPV: {row.decision.note}</p>}
   {row.details.clarification&&<p className="py-2 text-sm">Penjelasan Anda: {row.details.clarification.note}</p>}
   {asked&&!sent&&<form onSubmit={event=>send(row.id,event)}><label className="app-field">Penjelasan<textarea required minLength={5} maxLength={2000} value={notes[row.id]||''} onChange={event=>setNotes(values=>({...values,[row.id]:event.target.value}))}/></label><button className="app-button app-button-primary mt-3" disabled={Boolean(busy)||(notes[row.id]||'').trim().length<5}>{busy===row.id?'Mengirim…':'Kirim penjelasan ke SPV'}</button></form>}
  </details>;})}
 </section>;
}
