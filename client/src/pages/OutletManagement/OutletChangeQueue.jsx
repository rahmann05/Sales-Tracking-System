import React,{useEffect,useState} from 'react';
import {outletsApi} from '../../services/api';
import {stamp} from './outletPresentation';
const labels={PENDING:'Menunggu penerapan',APPLIED:'Diterapkan',FAILED:'Gagal — buat usulan baru',CANCELLED:'Dibatalkan'};
export function OutletChangeQueue({outletId,canManage}){
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[reason,setReason]=useState('');
 const load=async()=>{setBusy(true);setError('');try{setRows((await outletsApi.changeQueue(outletId)).data);}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{let alive=true;setRows([]);setError('');if(canManage)outletsApi.changeQueue(outletId).then(r=>{if(alive)setRows(r.data);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[outletId,canManage]);
 if(!canManage)return null;
 const cancel=async id=>{setBusy(true);setError('');try{await outletsApi.cancelChange(outletId,id,reason);setReason('');await load();}catch(e){setError(e.message);setBusy(false);}};
 return <section className="outlet-form-section"><h3>Perubahan tertunda</h3><p className="outlet-muted">Usulan tidak mengubah master sebelum berhasil diterapkan. Tampilkan ulang untuk melihat hasil proses otomatis.</p><button type="button" className="app-button" disabled={busy} onClick={load}>Perbarui antrean</button>{error&&<p className="app-error" role="alert">{error}</p>}{!rows.length&&!error&&<p>Belum ada usulan perubahan.</p>}{rows.map(row=><article key={row.id} className="outlet-form-section"><strong>{labels[row.state]||row.state}</strong><p>Mulai {stamp(row.effectiveAt)} · {row.actorName}</p><p>{row.input.reason}</p><dl className="outlet-facts">{Object.entries(row.input).filter(([key])=>!['updatedAt','reason','locationEvidence'].includes(key)).map(([key,value])=><React.Fragment key={key}><dt>{key}</dt><dd>{String(value??'Kosong')}</dd></React.Fragment>)}</dl>{row.lastError&&<p role="status">{row.lastError}</p>}{row.state==='PENDING'&&<><label className="app-field">Alasan pembatalan<input minLength={5} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/></label><button type="button" className="app-button" disabled={busy||reason.trim().length<5} onClick={()=>cancel(row.id)}>Batalkan usulan</button></>}</article>)}</section>;
}
