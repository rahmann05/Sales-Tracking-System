import React from 'react';
import {visitPurposes,collectionResults,includesCollection} from '../../../../../shared/visit-outcome.mjs';
export function VisitOutcomeInput({value,onChange}) {
 const change=patch=>onChange({...value,...patch});
 return <fieldset className="space-y-3 border rounded-xl p-3"><legend className="font-bold text-sm">Tujuan dan hasil kunjungan</legend>
  <label className="block text-sm">Tujuan<select className="form-input w-full" value={value.purpose} onChange={e=>onChange({purpose:e.target.value})}><option value="">Pilih tujuan (opsional)</option>{Object.entries(visitPurposes).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
  {includesCollection(value.purpose)&&<>
   <label className="block text-sm">Referensi order / faktur sebelumnya<input className="form-input w-full" maxLength={500} value={value.reference||''} onChange={e=>change({reference:e.target.value})} placeholder="Nomor order atau faktur, termasuk dari luar aplikasi"/></label>
   <label className="block text-sm">Hasil penagihan<select className="form-input w-full" value={value.result||''} onChange={e=>{const rest={...value};delete rest.promiseDate;onChange({...rest,result:e.target.value});}}><option value="">Pilih hasil</option>{Object.entries(collectionResults).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
   {value.result==='PROMISED'&&<label className="block text-sm">Tanggal janji pembayaran<input className="form-input w-full" type="date" value={value.promiseDate||''} onChange={e=>change({promiseDate:e.target.value})}/></label>}
   <label className="block text-sm">Catatan hasil penagihan<textarea className="form-input w-full" maxLength={2000} value={value.note||''} onChange={e=>change({note:e.target.value})}/></label>
   <p className="text-xs">Pembayaran dilakukan di luar aplikasi. Hasil ini adalah laporan kunjungan sales; bukan verifikasi pelunasan.</p>
  </>}
 </fieldset>;
}
