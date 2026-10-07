import React,{useState,useEffect} from 'react';
import {useApp} from '../../../context/AppContext';
import {usersApi,pjpApi} from '../../../services/api';
import {manualCodeRequired} from '../../../../../shared/coding.mjs';

export function PjpCodeGeneration() {
  const {settings}=useApp();
  const [sales,setSales]=useState([]),[codes,setCodes]=useState({}),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const manual=manualCodeRequired('PJP',settings);
  useEffect(()=>{
    let active=true;
    usersApi.getAll({role:'SALES',limit:100}).then(r=>{if(active)setSales(Array.isArray(r.data)?r.data:r.data?.data || r.data?.items || []);}).catch(e=>{if(active)setMessage(e.message);});
    return ()=>{active=false;};
  },[]);
  async function generate(e) {
    e.preventDefault();if(busy)return;setBusy(true);setMessage('');
    try {
      const selected=Object.fromEntries(Object.entries(codes).filter(([,code])=>code.trim()));
      if(manual&&!Object.keys(selected).length)throw new Error('Isi nomor PJP untuk minimal satu sales.');
      const result=await pjpApi.generate(manual?selected:{});
      setMessage(result.data?.message || 'PJP hari ini diproses.');
    }catch(e){setMessage(e.message);}finally{setBusy(false);}
  }
  return <form onSubmit={generate} className="p-5 rounded-2xl border border-border-glass space-y-3">
    <h3 className="font-semibold">Penomoran PJP hari ini</h3>
    <p className="text-sm">{manual?'Isi nomor manual bagi sales yang akan dibuatkan PJP. PJP yang sudah ada tetap dipertahankan.':'Nomor PJP diberikan otomatis saat jadwal dibuat. Anda juga dapat menyiapkan seluruh jadwal hari ini.'}</p>
    {manual&&<div className="max-h-64 overflow-auto space-y-2">{sales.map(s=><label key={s.id} className="app-field">{s.name}<input maxLength={128} value={codes[s.id] || ''} onChange={e=>setCodes({...codes,[s.id]:e.target.value})} placeholder="Nomor PJP manual" disabled={busy}/></label>)}</div>}
    {message&&<p role="status" className="text-sm">{message}</p>}
    <button type="submit" className="btn btn-primary" disabled={busy}>{busy?'Memproses…':'Siapkan PJP hari ini'}</button>
  </form>;
}
