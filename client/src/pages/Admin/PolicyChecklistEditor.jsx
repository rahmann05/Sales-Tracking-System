import React from 'react';
export function PolicyChecklistEditor({value,onChange,disabled,id}){
 let items;try{items=JSON.parse(value||'[]');}catch{items=[];}
 const update=next=>onChange(JSON.stringify(next));
 const change=(index,key,next)=>update(items.map((item,i)=>i===index?{...item,[key]:next}:item));
 const move=(index,offset)=>{const next=[...items];[next[index],next[index+offset]]=[next[index+offset],next[index]];update(next);};
 return <fieldset className="policy-checklist-editor" disabled={disabled} id={id}>
   <legend className="config-visually-hidden">Pertanyaan audit supervisi</legend>
   {items.map((item,index)=><div className="policy-checklist-item" key={item.key}>
     <label className="policy-field">Pertanyaan {index+1}<input className="config-input" value={item.label} maxLength={200} onChange={e=>change(index,'label',e.target.value)}/></label>
     <label className="policy-checklist-required"><input type="checkbox" checked={item.required} onChange={e=>change(index,'required',e.target.checked)}/>Wajib dijawab</label>
     <div className="policy-checklist-actions"><button type="button" className="config-button" disabled={disabled||index===0} onClick={()=>move(index,-1)} aria-label={`Naikkan pertanyaan ${index+1}`}>Naik</button><button type="button" className="config-button" disabled={disabled||index===items.length-1} onClick={()=>move(index,1)} aria-label={`Turunkan pertanyaan ${index+1}`}>Turun</button><button type="button" className="config-button" onClick={()=>update(items.filter((_,i)=>i!==index))} aria-label={`Hapus pertanyaan ${index+1}`}>Hapus</button></div>
   </div>)}
   {!items.length&&<p>Belum ada pertanyaan. Catatan supervisi tetap tersedia.</p>}
   <button type="button" className="config-button" disabled={disabled||items.length>=30} onClick={()=>update([...items,{key:`q_${crypto.randomUUID().replaceAll('-','')}`,label:'Pertanyaan baru',required:false}])}>Tambah pertanyaan</button>
   <p className="policy-note">Kode pertanyaan dipertahankan saat label atau urutan diubah. Menghapus pertanyaan hanya berlaku untuk kunjungan baru.</p>
 </fieldset>;
}
