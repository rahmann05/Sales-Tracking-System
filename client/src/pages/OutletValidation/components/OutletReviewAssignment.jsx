import {useApp} from '../../../context/AppContext';
import React,{useState} from 'react';
import {outletValidationApi} from '../../../services/api';
import {stamp} from '../../OutletManagement/outletPresentation';
export function OutletReviewAssignment({review,onRefresh,disabled}){
 const {user}=useApp();
 const [ownerId,setOwnerId]=useState(review.ownerId||''),[due,setDue]=useState(review.dueAt?new Date(Date.parse(review.dueAt)-new Date(review.dueAt).getTimezoneOffset()*60000).toISOString().slice(0,16):''),[reason,setReason]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const save=async e=>{e.preventDefault();setBusy(true);setError('');try{await outletValidationApi.assign(review.outletId,review.id,{revision:review.revision,ownerId:ownerId||null,dueAt:due?new Date(due).toISOString():null,reason});setReason('');await onRefresh();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <div className="outlet-notice"><div><strong>PIC: {review.availableOwners?.find(u=>u.id===review.ownerId)?.name||review.assignment?.ownerName||'Antrean Admin'}</strong><p>Tenggat: {review.dueAt?stamp(review.dueAt):'Belum ditetapkan'}</p>
 {!['COMPLETED','CANCELLED'].includes(review.status)&&user?.permissions?.can_assign_outlet_review&&<details><summary>Atur PIC dan tenggat kasus</summary><form className="app-form" onSubmit={save}>
 <label className="app-field">Penanggung jawab<select value={ownerId} disabled={disabled||busy} onChange={e=>setOwnerId(e.target.value)}><option value="">Antrean Admin</option>{review.availableOwners?.map(user=><option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
 <label className="app-field">Tenggat (waktu lokal)<input type="datetime-local" value={due} disabled={disabled||busy} onChange={e=>setDue(e.target.value)}/></label>
 <label className="app-field">Alasan penugasan<textarea required minLength={5} maxLength={2000} value={reason} disabled={disabled||busy} onChange={e=>setReason(e.target.value)}/></label>
 {error&&<p role="alert" className="app-error">{error}</p>}<button className="app-button" disabled={disabled||busy||reason.trim().length<5}>{busy?'Menyimpan…':'Simpan penugasan'}</button>
 </form></details>}</div></div>;
}
