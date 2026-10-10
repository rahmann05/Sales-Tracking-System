import React,{useEffect,useState} from 'react';
import {outletsApi,ordersApi} from '../../../services/api';
import {NativeDialog} from '../../../shared/components/common/NativeDialog';
import {InputOrderModal} from './InputOrderModal';
export function OutsidePjpOrderDialog({onClose,onSaved}){
 const [query,setQuery]=useState(''),[page,setPage]=useState(1),[result,setResult]=useState(null),[outlet,setOutlet]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;setBusy(true);setError('');const timer=setTimeout(()=>outletsApi.directory({search:query,page,limit:20}).then(value=>{if(active)setResult(value);}).catch(e=>{if(active){setError(e.message);setResult(null);}}).finally(()=>{if(active)setBusy(false);}),250);return()=>{active=false;clearTimeout(timer);};},[query,page]);
 const submit=async payload=>{await ordersApi.createOrder({...payload,pjpStopId:undefined});await onSaved();onClose();};
 if(outlet)return <InputOrderModal stop={{outletId:outlet.id,outletName:outlet.name,outletCode:outlet.outletCode,outlet}} onClose={onClose} onSubmitOrder={submit}/>;
 return <NativeDialog open title="Order tanpa kunjungan PJP" onClose={onClose}><div className="grid gap-4">
  <p>Pilih outlet aktif dalam penugasan Anda. Order tetap mengikuti persetujuan dan pemenuhan; tidak menciptakan kunjungan atau presensi.</p>
  <label className="app-field">Cari nama, kode atau alamat outlet<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label>
  {error&&<p role="alert" className="app-error">{error}</p>}{busy&&<p role="status">Memuat outlet…</p>}
  {!busy&&result?.data?.map(o=><button type="button" key={o.id} className="app-button text-left" onClick={()=>setOutlet(o)}><span><strong>{o.name}</strong><span className="block">{o.outletCode||'Tanpa kode'} · {o.address}</span></span></button>)}
  {!busy&&result&&!result.data.length&&<p>Tidak ada outlet sesuai pencarian dalam penugasan Anda.</p>}
  <nav className="app-actions" aria-label="Halaman pilihan outlet"><button type="button" className="app-button" disabled={busy||page===1} onClick={()=>setPage(p=>p-1)}>Sebelumnya</button><span>{page} / {result?.pagination?.totalPages||1}</span><button type="button" className="app-button" disabled={busy||!result||page>=result.pagination.totalPages} onClick={()=>setPage(p=>p+1)}>Berikutnya</button></nav>
 </div></NativeDialog>;
}
