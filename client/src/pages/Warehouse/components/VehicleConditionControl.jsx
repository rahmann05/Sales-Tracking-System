import {useUnsavedNavigation} from '../../../shared/hooks/useUnsavedNavigation';
import React,{useState} from 'react';
import {vehiclesApi} from '../../../services/api';
export function VehicleConditionControl({vehicle,onChanged}){
  const [condition,setCondition]=useState(vehicle.condition),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useUnsavedNavigation(Boolean(note||condition!==vehicle.condition),busy);
  return <form className="space-y-2 border rounded-xl p-3" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await vehiclesApi.setCondition(vehicle.id,{condition,note});await onChanged();setNote('');}catch(e){setError(e.message);}finally{setBusy(false);}}}><fieldset disabled={busy} className="space-y-3"><p className="font-semibold">Kondisi saat ini: {vehicle.condition}</p><label className="block">Ubah kondisi<select className="form-input block w-full" value={condition} onChange={e=>setCondition(e.target.value)}><option value="AVAILABLE">Siap digunakan</option><option value="IN_SERVICE">Dalam servis</option><option value="BROKEN">Rusak</option></select></label><label className="block">Alasan pemeriksaan<input required maxLength={2000} className="form-input block w-full" value={note} onChange={e=>setNote(e.target.value)}/></label><button disabled={busy||condition===vehicle.condition} className="min-h-11 border rounded-xl px-3">{busy?'Menyimpan…':'Simpan kondisi'}</button>{error&&<p role="alert" className="text-red-600">{error}</p>}</fieldset></form>;
}
