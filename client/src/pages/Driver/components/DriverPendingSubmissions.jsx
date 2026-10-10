import React,{useEffect,useState} from 'react';
import {useApp} from '../../../context/AppContext';
import {driverPendingDrafts} from '../../../../../shared/driver-pending.mjs';
import {sendDriverEvidence} from '../../../services/api/deliveryApi';
export function DriverPendingSubmissions({onChanged}){
 const {user}=useApp(),[rows,setRows]=useState([]),[busy,setBusy]=useState(''),[error,setError]=useState('');
 const load=()=>{const unique=new Map();for(const get of [()=>sessionStorage,()=>localStorage])try{for(const row of driverPendingDrafts(get(),user.id))unique.set(row.pending.requestId,row);}catch{}setRows([...unique.values()]);};
 useEffect(()=>{load();window.addEventListener('focus',load);window.addEventListener('driver:drafts-changed',load);window.addEventListener('storage',load);return()=>{window.removeEventListener('focus',load);window.removeEventListener('driver:drafts-changed',load);window.removeEventListener('storage',load);};},[user.id]);
 const retry=async row=>{if(busy)return;setBusy(row.key);setError('');try{
  await sendDriverEvidence(row.pending.stopId,row.pending);
  for(const get of [()=>sessionStorage,()=>localStorage])try{get().removeItem(row.key);}catch{}
  load();await onChanged();
 }catch(e){setError(e.message);}finally{setBusy('');}};
 if(!rows.length)return null;
 return <section className="admin-panel p-4 space-y-3"><h2>Pengiriman belum dikonfirmasi ({rows.length})</h2><p>Isian tersimpan di browser, belum berarti diterima server. Kirim ulang isian yang sama untuk mengambil hasil tanpa menggandakan transaksi.</p>
  <ul>{rows.map(row=><li className="flex flex-wrap gap-3 items-center py-2" key={row.key}><span>{row.pending.type==='IN'?'Bukti tiba':'Hasil pengiriman'} · {row.pending.outletName||row.pending.stopId}</span><button className="app-button" disabled={!!busy} onClick={()=>retry(row)}>{busy===row.key?'Memeriksa…':'Kirim ulang & periksa hasil'}</button></li>)}</ul>
  {error&&<p role="alert" className="app-error">{error} Jika server meminta perbaikan bukti, buka tujuan terkait lalu gunakan “Periksa hasil sebelum mengubah”.</p>}
 </section>;
}
