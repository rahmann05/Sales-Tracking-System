import React from 'react';
import { useApp } from '../../../context/AppContext';
import { CODE_ENTITIES, manualCodeRequired } from '../../../../../shared/coding.mjs';

export function BusinessCodeInput({entity,value='',onChange,existing=false,optional=false,disabled=false}) {
  const {settings}=useApp();
  const label=CODE_ENTITIES.find(e=>e.key===entity)?.label || 'Kode';
  const manual=manualCodeRequired(entity,settings);
  return <label className="app-field block text-sm space-y-1">
    <span>{label}{optional?' (opsional)':''}</span>
    <input className="form-input w-full" type="text" maxLength={128} value={existing||manual ? value : ''} onChange={e=>onChange(e.target.value)} required={manual&&!optional&&!existing} disabled={disabled||existing||!manual} placeholder={manual?'Masukkan kode':'Ditetapkan otomatis saat disimpan'} />
    {!existing&&<span className="block text-xs text-on-surface-variant">{manual?'Pengkodean otomatis OFF; isi kode manual.':'Kode mengikuti pengaturan sistem dan diberikan oleh server saat penyimpanan.'}</span>}
  </label>;
}
