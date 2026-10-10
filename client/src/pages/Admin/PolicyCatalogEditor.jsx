import React from 'react';
import {DEFAULT_SERVICE_CATALOG} from '../../../../shared/reference-catalog.mjs';
export function PolicyCatalogEditor({id,value,disabled,onChange}){
 let rows;
 try{rows=typeof value==='string'?JSON.parse(value):value;if(!Array.isArray(rows))throw new Error();}catch{return <p role="alert">Referensi tidak valid. Kembalikan nilai tersimpan untuk melanjutkan.</p>;}
 const update=(index,patch)=>onChange(JSON.stringify(rows.map((r,i)=>i===index?{...r,...patch}:r)));
 const move=(index,delta)=>{const next=[...rows];[next[index],next[index+delta]]=[next[index+delta],next[index]];onChange(JSON.stringify(next));};
 const add=()=>{let i=1;while(rows.some(r=>r.code===`SERVIS_${i}`))i++;onChange(JSON.stringify([...rows,{code:`SERVIS_${i}`,label:`Servis tambahan ${i}`,active:true}]));};
 return <div id={id} className="app-form"><p>Kode tidak berubah setelah ditambahkan. Nonaktifkan pilihan untuk input baru; riwayat mempertahankan label saat dicatat.</p>
  {rows.map((r,i)=><fieldset key={r.code} disabled={disabled} className="app-form"><legend>{i+1}. {r.code}{DEFAULT_SERVICE_CATALOG.some(c=>c.code===r.code)?' · bawaan':''}</legend>
   <label className="app-field">Label<input value={r.label} maxLength={100} onChange={e=>update(i,{label:e.target.value})}/></label>
   <label><input type="checkbox" checked={r.active} onChange={e=>update(i,{active:e.target.checked})}/> Aktif untuk input baru</label>
   <div className="flex gap-2"><button type="button" disabled={disabled||i===0} className="app-button" onClick={()=>move(i,-1)}>Naik</button><button type="button" disabled={disabled||i===rows.length-1} className="app-button" onClick={()=>move(i,1)}>Turun</button></div>
  </fieldset>)}
  <button type="button" className="app-button" disabled={disabled||rows.length>=50} onClick={add}>Tambah jenis servis</button>
 </div>;
}
