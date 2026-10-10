import React,{useEffect,useState} from 'react';
import {useApp} from '../../../context/AppContext';
import {staffAttendanceApi} from '../../../services/api';
import {request} from '../../../services/httpClient';
import {followUpAllowed} from '../../../../../shared/follow-up-policy.mjs';
export function BlockedFollowUpActions({row,onChanged}){
 const {user}=useApp(),[options,setOptions]=useState([]),[ownerId,setOwnerId]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const allowed=followUpAllowed(user,'assign')&&followUpAllowed(user,'view');
 useEffect(()=>{if(!allowed)return;let live=true;staffAttendanceApi.followUpCandidates().then(r=>{if(live)setOptions(r.data||[]);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[allowed]);
 const submit=async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{await request(`/staff-attendance/follow-ups/${row.activityId}/retry-auto`,{method:'POST',body:JSON.stringify({...(ownerId?{ownerId}:{}),reason})});await onChanged();}catch(err){setError(err.message);}finally{setBusy(false);}};
 return <section className="app-form"><p role="status">Tugas otomatis belum terbentuk: {row.blockedFollowUp.message}</p><p>Audit dan hasil kunjungan tetap tersimpan. Perbaiki hak akses/penugasan, lalu ulangi. Pilih PIC lain hanya bila memang bertanggung jawab atas temuan ini.</p>{allowed&&<form onSubmit={submit} className="app-form"><fieldset disabled={busy} className="app-form"><label className="app-field">Sales PIC<select value={ownerId} onChange={e=>setOwnerId(e.target.value)}><option value="">Ikuti aturan awal</option>{options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label><label className="app-field">Alasan penugasan ulang<textarea required minLength={5} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/></label><button className="app-button">{busy?'Memproses…':'Bentuk tugas tindak lanjut'}</button></fieldset></form>}{error&&<p role="alert">{error}</p>}</section>;
}
