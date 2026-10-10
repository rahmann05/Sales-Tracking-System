import React,{useEffect,useState} from 'react';
import {staffAttendanceApi} from '../../../services/api';
import {useFormDraft} from '../../hooks/useFormDraft';
import {useUnsavedNavigation} from '../../hooks/useUnsavedNavigation';
import {wibDateKey} from '../../../../../shared/visit-metrics.mjs';
export function FollowUpAssignment({id,followUp:f,onChanged}){
 const draft=useFormDraft(`followup-assignment:${id}:${f.revision||0}`,{ownerId:f.ownerId,dueDate:f.dueDate||'',reason:''});
 const [people,setPeople]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useUnsavedNavigation(draft.dirty,busy);
 useEffect(()=>{let live=true;staffAttendanceApi.followUpCandidates().then(r=>{if(live)setPeople(r.data);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[]);
 const save=async e=>{e.preventDefault();setBusy(true);setError('');try{await staffAttendanceApi.assignFollowUp(id,{...draft.value,revision:f.revision||0});draft.clear();await onChanged();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <details className="border rounded-xl p-3"><summary className="cursor-pointer min-h-11">Alihkan PIC / ubah tenggat</summary><p>Instruksi dan bukti lama tetap dalam riwayat. Hanya PIC terbaru yang dapat mengirim hasil.</p>
  {(draft.restored||draft.policyChanged)&&<p role="status">{draft.restoreMessage}</p>}{draft.storageError&&<p role="alert">{draft.storageError}</p>}
  <form className="space-y-3" onSubmit={save}><fieldset className="space-y-3" disabled={loading||busy}>
   <label className="block">Sales penanggung jawab<select className="form-input block w-full" required value={draft.value.ownerId} onChange={e=>draft.field('ownerId')(e.target.value)}><option value="">Pilih PIC aktif</option>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <label className="block">Tenggat WIB<input className="form-input block w-full" type="date" required min={wibDateKey()} value={draft.value.dueDate} onChange={e=>draft.field('dueDate')(e.target.value)}/></label>
   <label className="block">Alasan perubahan<textarea className="form-input block w-full" required minLength={5} maxLength={1000} value={draft.value.reason} onChange={e=>draft.field('reason')(e.target.value)}/></label>
   <button className="app-button" disabled={!people.some(p=>p.id===draft.value.ownerId)}>{busy?'Menyimpan…':'Simpan penugasan'}</button>
  </fieldset></form>{error&&<p role="alert" className="app-error">{error}</p>}
 </details>;
}
