import {useUnsavedNavigation} from '../../../shared/hooks/useUnsavedNavigation';
import {useDomainPermission} from '../../../shared/hooks/useDomainPermission';
import {useApp} from '../../../context/AppContext';
import {canDomainAction} from '../../../../../shared/domain-permissions.mjs';
import React,{useState} from 'react';
import {deliveryApi} from '../../../services/api';
export function OperationalIssues({issues,people,reference,onChanged}){
  const canResolve=useDomainPermission('RESOLVE_DELIVERY_ISSUE'),{user}=useApp();
  const canAssign=['ADMIN','KEPALA_GUDANG'].includes(user?.role)&&user.permissions?.can_monitor_delivery!==false;
  people=people.filter(p=>canDomainAction(p,'RESOLVE_DELIVERY_ISSUE')&&p.permissions?.[p.role==='SUPIR'?'can_access_driver_map':'can_monitor_delivery']!==false);
  const [adding,setAdding]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [title,setTitle]=useState(''),[reason,setReason]=useState(''),[owner,setOwner]=useState(''),[due,setDue]=useState(''),[resolutions,setResolutions]=useState({});
  useUnsavedNavigation(Boolean(adding&&(title||reason||owner||due)||Object.values(resolutions).some(Boolean)),busy);
  const run=async fn=>{setBusy(true);setError('');try{await fn();setAdding(false);setTitle('');setReason('');setOwner('');setDue('');setResolutions({});await onChanged();}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <section className="space-y-3"><h3 className="font-bold">Tindak lanjut ({issues.length})</h3>
    {issues.map(i=><form key={i.id} className="border rounded-xl p-3 space-y-2" onSubmit={e=>{e.preventDefault();run(()=>deliveryApi.resolveIssue(i.id,resolutions[i.id]));}}><strong>{i.title}</strong><p>{i.reason}</p><p className="text-sm">PIC: {people.find(p=>p.id===i.ownerId)?.name||i.ownerId} · Tenggat {new Date(i.dueAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} {new Date(i.dueAt)<new Date()?'· Terlambat':''}</p><label className="block">Hasil tindak lanjut<textarea required maxLength={2000} className="form-input block w-full" value={resolutions[i.id]||''} onChange={e=>setResolutions({...resolutions,[i.id]:e.target.value})}/></label><button disabled={busy||!canResolve||(user.role==='SUPIR'&&i.ownerId!==user.id)} className="min-h-11 border rounded-xl px-3">Selesaikan tindak lanjut</button></form>)}
    {canAssign&&reference&&<button className="min-h-11 border rounded-xl px-3" type="button" onClick={()=>setAdding(!adding)}>{adding?'Batal mencatat':'Catat masalah / tugaskan PIC'}</button>}
    {canAssign&&adding&&<form className="border rounded-xl p-3 space-y-3" onSubmit={e=>{e.preventDefault();run(()=>deliveryApi.createIssue({...reference,title,reason,ownerId:owner,dueAt:new Date(`${due}:00+07:00`).toISOString()}));}}><fieldset disabled={busy} className="space-y-3"><label className="block">Masalah<input required maxLength={200} className="form-input block w-full" value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="block">Penyebab / tindakan yang dibutuhkan<textarea required maxLength={2000} className="form-input block w-full" value={reason} onChange={e=>setReason(e.target.value)}/></label><label className="block">Penanggung jawab<select required className="form-input block w-full" value={owner} onChange={e=>setOwner(e.target.value)}><option value="">Pilih PIC</option>{people.map(p=><option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}</select></label><label className="block">Tenggat WIB<input required type="datetime-local" className="form-input block w-full" value={due} onChange={e=>setDue(e.target.value)}/></label><button className="min-h-11 bg-primary text-on-primary rounded-xl px-3">Simpan tugas</button></fieldset></form>}
    {error&&<p role="alert" className="text-red-600">{error}</p>}
  </section>;
}
