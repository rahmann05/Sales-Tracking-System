import React from 'react';
export function PlanSubstituteEditor({rule,people,startsOn,endsOn,enabled,onChange}){
 const substitute=rule.substitute;
 if(!substitute)return enabled?<button type="button" className="app-button" onClick={()=>onChange({userId:'',startsOn,endsOn,reason:''})}>Tetapkan Sales pengganti sementara</button>:null;
 const change=patch=>onChange({...substitute,...patch});
 return <section className="app-form"><h4>Pengganti sementara untuk outlet ini</h4><p>Kunjungan yang jatuh tempo dalam rentang tanggal berikut dialihkan ke pengganti. Interval dan tanggal acuan tetap; di luar rentang, kunjungan menjadi tugas Sales utama.</p>
  {!enabled&&<p role="alert">Pengganti sementara dinonaktifkan oleh aturan tim. Hapus pengganti ini sebelum menerbitkan.</p>}
  <div className="planner-rule-fields">
   <label className="app-field">Sales pengganti<select disabled={!enabled} value={substitute.userId} onChange={e=>change({userId:e.target.value})} required><option value="">Pilih Sales dalam tim</option>{people.filter(p=>p.id!==rule.userId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <label className="app-field">Mulai pengganti<input disabled={!enabled} type="date" required min={startsOn} max={endsOn} value={substitute.startsOn} onChange={e=>change({startsOn:e.target.value})}/></label>
   <label className="app-field">Sampai tanggal<input disabled={!enabled} type="date" required min={substitute.startsOn||startsOn} max={endsOn} value={substitute.endsOn} onChange={e=>change({endsOn:e.target.value})}/></label>
   <label className="app-field">Alasan pengganti<input disabled={!enabled} required minLength={5} maxLength={500} value={substitute.reason} onChange={e=>change({reason:e.target.value})}/></label>
  </div>
  <button type="button" className="app-button" onClick={()=>onChange(null)}>Hapus pengganti sementara</button>
 </section>;
}
