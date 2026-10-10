import React from 'react';
export function PolicyImageFormatsEditor({id,value,disabled,onChange}){
 const selected=String(value??'JPEG,PNG,WEBP').split(',').map(v=>v.trim()).filter(Boolean);
 return <fieldset disabled={disabled} aria-describedby={`${id}-help`} className="space-y-2">
  <legend className="config-visually-hidden">Format foto yang diizinkan</legend>
  {['JPEG','PNG','WEBP'].map((format,index)=><label key={format} className="flex items-center gap-3 min-h-11"><input id={index===0?id:undefined} type="checkbox" checked={selected.includes(format)} onChange={e=>onChange((e.target.checked?[...selected,format]:selected.filter(v=>v!==format)).join(','))}/><span>{format}</span></label>)}
  <p className="text-xs text-on-surface-variant">Pilih minimal satu. Kamera langsung memakai {selected[0]||'format pertama yang dipilih'}. Lampiran hasil kunjungan mendukung JPEG/PNG.</p>
 </fieldset>;
}
