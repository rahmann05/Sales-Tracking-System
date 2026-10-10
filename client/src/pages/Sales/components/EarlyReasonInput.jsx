import React from 'react';
import {parseReasonOptions,DEFAULT_EARLY_REASONS} from '../../../../../shared/visit-reasons.mjs';
export function EarlyReasonInput({value,onChange,settings}){
 const options=parseReasonOptions(settings.ATTENDANCE_EARLY_REASON_OPTIONS??DEFAULT_EARLY_REASONS);
 const custom=settings.ATTENDANCE_EARLY_ALLOW_CUSTOM_REASON!==false;
 return <div className="space-y-2">
  <select aria-label="Pilihan alasan absen keluar lebih awal" value={options.includes(value)?value:''} onChange={e=>onChange(e.target.value)} className="form-input w-full">
   <option value="">Pilih alasan checkout lebih awal</option>
   {options.map(option=><option key={option} value={option}>{option}</option>)}
  </select>
  {custom?<label className="block">Alasan dipilih atau alasan lain<textarea aria-label="Alasan absen keluar lebih awal" className="form-input w-full" maxLength={1000} value={value} onChange={e=>onChange(e.target.value)}/></label>:value&&!options.includes(value)&&<p role="alert">Alasan pada draf tidak tersedia pada aturan kunjungan. Pilih ulang.</p>}
 </div>;
}
