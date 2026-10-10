import React from 'react';

export function PolicyChecklistQuestion({item,index,onChange}){
 const type=item.type||'BOOLEAN';
 const set=(key,value)=>onChange({...item,[key]:value});
 const changeType=next=>{
  const base=Object.fromEntries(Object.entries(item).filter(([key])=>!['options','min','max','failureBelow','failedValues','requireFailurePhoto','requireFailureReason'].includes(key)));
  onChange({...base,type:next,...(next==='SELECT'?{options:['Sesuai','Perlu perbaikan'],failedValues:['Perlu perbaikan']}:{})});
 };
 return <div className="grid gap-3">
  <label className="policy-field">Pertanyaan {index+1}<input className="config-input" value={item.label} maxLength={200} onChange={e=>set('label',e.target.value)}/></label>
  <label className="policy-field">Tipe jawaban<select className="config-input" value={type} onChange={e=>changeType(e.target.value)}><option value="BOOLEAN">Ya / tidak</option><option value="TEXT">Teks</option><option value="NUMBER">Angka</option><option value="SELECT">Pilihan</option></select></label>
  <label className="policy-checklist-required"><input type="checkbox" checked={item.required} onChange={e=>set('required',e.target.checked)}/>Wajib dijawab</label>
  {type==='NUMBER'&&<div className="grid gap-3 sm:grid-cols-3">{[['min','Minimum'],['max','Maksimum'],['failureBelow','Gagal jika kurang dari']].map(([key,label])=><label className="policy-field" key={key}>{label}<input className="config-input" type="number" step="any" value={item[key]??''} onChange={e=>{const next={...item};if(e.target.value==='')delete next[key];else next[key]=Number(e.target.value);onChange(next);}}/></label>)}</div>}
  {type==='SELECT'&&<>
   <label className="policy-field">Pilihan jawaban (satu per baris)<textarea className="config-input" rows={4} value={item.options?.join('\n')||''} onChange={e=>{const options=e.target.value.split('\n');onChange({...item,options,failedValues:(item.failedValues||[]).filter(value=>options.includes(value))});}}/></label>
   <fieldset className="grid gap-2"><legend className="text-sm font-semibold mb-2">Jawaban yang dianggap gagal</legend>{item.options?.filter(v=>v.trim()).map((value,i)=><label className="flex items-center gap-2 text-sm" key={i}><input type="checkbox" checked={item.failedValues?.includes(value)||false} onChange={e=>set('failedValues',e.target.checked?[...(item.failedValues||[]),value]:(item.failedValues||[]).filter(v=>v!==value))}/>{value}</label>)}</fieldset>
  </>}
  {type!=='TEXT'&&<fieldset className="grid gap-2"><legend className="text-sm font-semibold mb-2">Bukti ketika jawaban gagal{type==='BOOLEAN'?' (Tidak)':''}</legend>
   <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!item.requireFailureReason} onChange={e=>set('requireFailureReason',e.target.checked)}/>Wajib alasan</label>
   <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!item.requireFailurePhoto} onChange={e=>set('requireFailurePhoto',e.target.checked)}/>Wajib foto temuan</label>
  </fieldset>}
 </div>;
}
