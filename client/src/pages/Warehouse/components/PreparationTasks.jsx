import React,{useState} from 'react';
import {deliveryApi} from '../../../services/api';
import {preparationStages,preparationOwnerProblem} from '../../../../../shared/warehouse-policy.mjs';
const stages={PICK:'Penyiapan barang',CHECK:'Pemeriksaan barang',LOAD:'Loading / serah terima'};
const stamp=v=>new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
export function PreparationTasks({route,people,onChanged,canManage}){
  const [stage,setStage]=useState('PICK'),[owner,setOwner]=useState(''),[due,setDue]=useState(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const enabled=preparationStages(route.policySnapshot?.values),pending=enabled.filter(key=>!route.preparation?.[key]);
  const selectedStage=pending.includes(stage)?stage:pending[0]||'',eligible=people.filter(person=>!preparationOwnerProblem(person,route,selectedStage));
  const selectedOwner=eligible.some(person=>person.id===owner)?owner:'';
  const assign=async e=>{e.preventDefault();setBusy(true);setError('');try{await deliveryApi.routeAction(route.id,{action:'ASSIGN_PREPARATION',stage:selectedStage,ownerId:selectedOwner,assignmentRevision:route.preparation?.tasks?.[selectedStage]?.revision||0,dueAt:new Date(`${due}:00+07:00`).toISOString(),note});setNote('');await onChanged();}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <section className="space-y-3"><h3 className="font-bold">Tugas persiapan gudang</h3>{enabled.map(key=>{const done=route.preparation?.[key],task=route.preparation?.tasks?.[key];return <p key={key} className="text-sm"><strong>{stages[key]}</strong> · {done?`Selesai oleh ${done.actorName||done.actorId} · ${stamp(done.at)}`:task?`${task.ownerName} · Tenggat ${stamp(task.dueAt)}${new Date(task.dueAt)<new Date()?' · Terlambat':''}`:'Belum ditugaskan'}</p>;})}
    {enabled.length<3&&<p className="text-sm">Dilewati sesuai aturan trip: {Object.keys(stages).filter(key=>!enabled.includes(key)).map(key=>stages[key]).join(', ')}.</p>}
    {canManage&&pending.length>0&&route.status==='DRAFT'&&!route.cancelledAt&&!route.closedAt&&<details><summary className="min-h-11 cursor-pointer">Tugaskan / ganti PIC persiapan</summary><form onSubmit={assign} className="space-y-3 border rounded-xl p-3"><fieldset disabled={busy} className="space-y-3">
      <label className="block">Tahap<select className="form-input block w-full" value={selectedStage} onChange={e=>{setStage(e.target.value);setOwner('');}}>{pending.map(key=><option value={key} key={key}>{stages[key]}</option>)}</select></label>
      <label className="block">Petugas gudang<select required className="form-input block w-full" value={selectedOwner} onChange={e=>setOwner(e.target.value)}><option value="">Pilih petugas berwenang</option>{eligible.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
      {!eligible.length&&<p role="status">Belum ada petugas yang memenuhi izin dan aturan pemeriksa terpisah. Perbaiki hak akses atau penugasan tahap lainnya.</p>}
      <label className="block">Tenggat persiapan WIB<input required type="datetime-local" className="form-input block w-full" value={due} onChange={e=>setDue(e.target.value)}/></label>
      <label className="block">Instruksi / alasan penugasan<textarea required minLength={5} maxLength={2000} className="form-input block w-full" value={note} onChange={e=>setNote(e.target.value)}/></label><button disabled={!selectedOwner||note.trim().length<5} className="min-h-11 border rounded-xl px-3">{busy?'Menyimpan…':'Simpan penugasan'}</button>
    </fieldset>{error&&<p role="alert" className="text-red-600">{error}</p>}</form></details>}
  </section>;
}
