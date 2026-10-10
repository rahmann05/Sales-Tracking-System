import React from 'react';
export function ShiftEvidenceSummary({row}){
 const finish=row.checklist?.finishEvidence;
 const label={EARLY_FINISH:'Selesai sebelum jadwal',NON_WORKDAY:'Mulai di luar hari kerja'};
 return <details className="mt-2"><summary className="cursor-pointer min-h-11">Jadwal, alasan dan bukti shift</summary><div className="grid gap-3 py-2 text-sm">
  <p>Jadwal awal: {row.policySnapshot?.values?.SHIFT_START_TIME||'08:00'}–{row.policySnapshot?.values?.SHIFT_END_TIME||'17:00'} WIB</p>
  {[{...row,name:'Masuk',exception:row.checklist?.scheduleException},{...finish,name:'Selesai'}].map(e=><div key={e.name} className="grid gap-1"><strong>{e.name}</strong>{e.exception&&<p>{label[e.exception]}</p>}{e.notes&&<p>{e.notes}</p>}{Number.isFinite(e.latitude)&&Number.isFinite(e.longitude)&&<p>GPS perangkat: {e.latitude}, {e.longitude} · Akurasi {e.gpsEvidence?.accuracy==null?'tidak diketahui':`${e.gpsEvidence.accuracy} m`}</p>}{e.photoUrl&&<img src={e.photoUrl} alt={`Foto bukti shift ${e.name.toLowerCase()}`} loading="lazy" className="max-w-48 rounded-xl"/>}{!e.notes&&!e.photoUrl&&!Number.isFinite(e.latitude)&&<p>Bukti tambahan tidak dikirim.</p>}</div>)}
 </div></details>;
}
