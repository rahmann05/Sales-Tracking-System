import React from 'react';
import {PolicyChecklistQuestion} from './PolicyChecklistQuestion';
export function PolicyChecklistEditor({value,onChange,disabled,id}){
 let items;try{items=JSON.parse(value||'[]');}catch{items=[];}
 const update=next=>onChange(JSON.stringify(next));
 const move=(index,offset)=>{const next=[...items];[next[index],next[index+offset]]=[next[index+offset],next[index]];update(next);};
 return <fieldset className="policy-checklist-editor" disabled={disabled} id={id}>
   <legend className="config-visually-hidden">Pertanyaan audit supervisi</legend>
   {items.map((item,index)=><div className="policy-checklist-item" key={item.key}>
     <PolicyChecklistQuestion item={item} index={index} onChange={next=>update(items.map((row,i)=>i===index?next:row))}/>
     <div className="policy-checklist-actions"><button type="button" className="config-button" disabled={disabled||index===0} onClick={()=>move(index,-1)} aria-label={`Naikkan pertanyaan ${index+1}`}>Naik</button><button type="button" className="config-button" disabled={disabled||index===items.length-1} onClick={()=>move(index,1)} aria-label={`Turunkan pertanyaan ${index+1}`}>Turun</button><button type="button" className="config-button" onClick={()=>update(items.filter((_,i)=>i!==index))} aria-label={`Hapus pertanyaan ${index+1}`}>Hapus</button></div>
   </div>)}
   {!items.length&&<p>Belum ada pertanyaan. Catatan supervisi tetap tersedia.</p>}
   <button type="button" className="config-button" disabled={disabled||items.length>=30} onClick={()=>update([...items,{key:`q_${crypto.randomUUID().replaceAll('-','')}`,label:'Pertanyaan baru',required:false}])}>Tambah pertanyaan</button>
   <p className="policy-note">Kode pertanyaan dipertahankan saat label atau urutan diubah. Menghapus pertanyaan hanya berlaku untuk kunjungan baru.</p>
 </fieldset>;
}
