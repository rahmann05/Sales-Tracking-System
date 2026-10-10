import React,{useEffect,useState} from 'react';
import {outletsApi} from '../../../services/api';
export function OffPjpMasterSelector({scope='BOTH',outletId,onSelect}){
 const [search,setSearch]=useState(''),[rows,setRows]=useState([]),[error,setError]=useState('');
 useEffect(()=>{if(scope==='PROSPECT_ONLY')return;let live=true;outletsApi.getAll({search,page:1,limit:100}).then(r=>{if(live){setRows(r.data||[]);setError('');}}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[search,scope]);
 if(scope==='PROSPECT_ONLY')return <div><p>Kunjungan luar PJP saat ini khusus calon outlet.</p>{outletId&&<button type="button" className="app-button" onClick={()=>onSelect(null)}>Lepas outlet master dari draft</button>}</div>;
 return <section className="app-form"><label className="app-field">Cari outlet master<input value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="app-field">Outlet kunjungan<select value={outletId||''} required={scope==='MASTER_ONLY'} onChange={e=>onSelect(rows.find(o=>o.id===e.target.value)||null)}><option value="">{scope==='MASTER_ONLY'?'Pilih outlet master':'Calon outlet / belum terdaftar'}</option>{outletId&&!rows.some(o=>o.id===outletId)&&<option value={outletId}>Outlet terpilih</option>}{rows.map(o=><option key={o.id} value={o.id}>{o.name} · {o.address}</option>)}</select></label>{error&&<p role="alert">{error}</p>}<small>Menampilkan paling banyak 100 outlet sesuai akses Anda. Kunjungan ini tidak menambah pola PJP rutin.</small></section>;
}
