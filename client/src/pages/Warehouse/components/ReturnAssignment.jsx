import React,{useState} from 'react';
import {deliveryApi} from '../../../services/api';
export function ReturnAssignment({stop,task,people,onChanged}){
 const [ownerId,setOwnerId]=useState(task?.ownerId||''),[due,setDue]=useState(task?.dueAt?new Date(Date.parse(task.dueAt)-new Date(task.dueAt).getTimezoneOffset()*60000).toISOString().slice(0,16):''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!(stop.rejectedCartons>0)||stop.returnInspection)return null;
 const save=async e=>{e.preventDefault();setBusy(true);setError('');try{await deliveryApi.assignReturn(stop.id,{revision:task?.revision||0,ownerId:ownerId||null,dueAt:due?new Date(due).toISOString():null,reason});setReason('');await onChanged();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <details className="admin-trip-history"><summary>PIC pemeriksaan retur · {task?.ownerName||'Belum ditetapkan'}</summary><form className="app-form" onSubmit={save}>
 <label className="app-field">Petugas pemeriksa<select value={ownerId} disabled={busy} onChange={e=>setOwnerId(e.target.value)}><option value="">Antrean gudang</option>{people.filter(p=>['ADMIN','KEPALA_GUDANG'].includes(p.role)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <label className="app-field">Tenggat (waktu lokal)<input type="datetime-local" value={due} disabled={busy} onChange={e=>setDue(e.target.value)}/></label>
 <label className="app-field">Alasan penugasan<textarea required minLength={5} maxLength={2000} value={reason} disabled={busy} onChange={e=>setReason(e.target.value)}/></label>
 <button className="app-button" disabled={busy||reason.trim().length<5}>{busy?'Menyimpan…':'Tetapkan pemeriksa retur'}</button>{error&&<p className="app-error" role="alert">{error}</p>}
 </form></details>;
}
