import React,{useState,useEffect} from 'react';
import {configApi} from '../../services/api';
export function SystemAuditPanel(){
 const [state,setState]=useState('ACTIVE'),[type,setType]=useState(''),[queryType,setQueryType]=useState(''),[items,setItems]=useState([]),[cursor,setCursor]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async(next)=>{setBusy(true);setError('');try{const r=await configApi.systemAudit({state,...(queryType?{type:queryType}:{}),...(next?{cursor:next}:{})});setItems(old=>next?[...old,...r.data.items]:r.data.items);setCursor(r.data.nextCursor);}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{load();},[state,queryType]);
 return <section className="policy-panel"><header><h2>Riwayat audit sistem</h2><p>Pengarsipan mempertahankan keputusan dan bukti. Rincian proses tersedia pada halaman sumber masing-masing.</p></header><div className="policy-panel-body">
 <form className="policy-transfer" onSubmit={e=>{e.preventDefault();setQueryType(type.trim());}}><label className="policy-field">Riwayat<select className="config-input" value={state} disabled={busy} onChange={e=>setState(e.target.value)}><option value="ACTIVE">Aktif</option><option value="ARCHIVED">Arsip</option><option value="ALL">Semua</option></select></label><label className="policy-field">Jenis sumber<input className="config-input" placeholder="Mis. POLICY_VERSION" maxLength={100} value={type} disabled={busy} onChange={e=>setType(e.target.value)}/></label><button className="config-button" disabled={busy}>Terapkan filter</button></form>
 {error&&<p role="alert" className="policy-error">{error}</p>}
 <div className="policy-audit-list" aria-busy={busy}>{items.map(item=><article key={item.id}><div><strong>{item.entityType} · {item.action}</strong><span>{item.actorName||'Sistem'} · {new Date(item.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB{item.archivedAt?' · Arsip':''}</span><small>{item.entityId}</small></div></article>)}</div>
 {!busy&&!items.length&&<p>Tidak ada riwayat pada filter ini.</p>}{busy&&<p role="status">Memuat riwayat…</p>}{cursor&&<button className="config-button" disabled={busy} onClick={()=>load(cursor)}>Muat berikutnya</button>}
 </div></section>;
}
