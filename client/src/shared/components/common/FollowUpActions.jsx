import React,{useState} from 'react';
import {useApp} from '../../../context/AppContext';
import {staffAttendanceApi} from '../../../services/api';
export function FollowUpActions({id,followUp:f,onChanged}) {
 const {user}=useApp();
 const [note,setNote]=useState(''),[evidence,setEvidence]=useState(''),[decision,setDecision]=useState('ACCEPT'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const review=f.status==='SUBMITTED'&&['ADMIN','SUPERVISOR'].includes(user?.role)&&f.ownerId!==user.id;
 const submit=f.status==='OPEN'&&f.ownerId===user?.id;
 const save=async e=>{e.preventDefault();setBusy(true);setError('');try{
  if(review)await staffAttendanceApi.reviewFollowUp(id,{decision,note,submissionId:f.submission.id});
  else await staffAttendanceApi.completeFollowUp(id,note,evidence);
  setNote('');setEvidence('');await onChanged();
 }catch(err){setError(err.message);}finally{setBusy(false);}};
 return <div className="space-y-3">
  <p>Instruksi tugas: {f.note}</p>
  {f.status==='DONE'&&!f.submission&&<p>{f.completionNote}</p>}
  {f.submission&&<div className="border rounded-xl p-3 space-y-1"><strong>Hasil dari PIC</strong><p>{f.submission.note}</p><p>Bukti / referensi: {f.submission.evidence}</p><p className="text-xs">Dikirim {new Date(f.submission.at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}</p></div>}
  {f.review&&<p className="text-sm">{f.review.decision==='ACCEPT'?'Diterima pemeriksa':'Diminta perbaikan'}: {f.review.note}</p>}
  {f.status==='SUBMITTED'&&!review&&<p role="status">Hasil dikirim, menunggu pemeriksaan SPV / Admin.</p>}
  {(submit||review)&&<form className="space-y-3" onSubmit={save}><fieldset disabled={busy} className="space-y-3">
   {review&&<label className="block">Keputusan<select className="form-input block w-full" value={decision} onChange={e=>setDecision(e.target.value)}><option value="ACCEPT">Terima hasil dan selesaikan tugas</option><option value="RETURN">Minta perbaikan dari PIC</option></select></label>}
   <label className="block">{review?'Catatan pemeriksaan / alasan perbaikan':'Hasil tindak lanjut'}<textarea className="form-input block w-full" required maxLength={review?2000:4000} value={note} onChange={e=>setNote(e.target.value)}/></label>
   {submit&&<label className="block">Bukti atau referensi hasil<textarea className="form-input block w-full" required maxLength={2000} value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Contoh: waktu komunikasi, pihak yang ditemui, atau referensi dokumen pendukung"/></label>}
   <p className="text-xs">Pemeriksaan ini menyelesaikan tindak lanjut kunjungan, bukan memverifikasi pelunasan.</p>
   <button className="btn btn-secondary min-h-11">{busy?'Menyimpan…':review?'Simpan pemeriksaan':'Kirim hasil untuk diperiksa'}</button>
  </fieldset></form>}
  {error&&<p role="alert" className="text-red-600">{error}</p>}
  <details><summary className="cursor-pointer min-h-11">Riwayat tindak lanjut ({f.history?.length||0})</summary>{f.history?.map((h,i)=><p className="text-sm py-1" key={i}>{new Date(h.at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} · {h.action} · {h.note||h.after?.note} {h.evidence?`· Bukti / referensi: ${h.evidence}`:''}</p>)}</details>
 </div>;
}
