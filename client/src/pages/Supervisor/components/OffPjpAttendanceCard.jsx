import {VisitOutcomeAttachments} from '../../../shared/components/common/VisitOutcomeAttachments';
import React, { useState } from 'react';
import {visitOutcomeText} from '../../../../../shared/visit-outcome.mjs';
import { NativeDialog } from '../../../shared/components/common/NativeDialog';
export function OffPjpAttendanceCard({attendance:item,onValidate}) {
  const [decision,setDecision] = useState(null);
  const [note,setNote] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const pending = ['PENDING','WAITING_SPV'].includes(item.status) || (!item.status && item.validationStatus==='MENUNGGU');
  const save = async e=>{e.preventDefault();setBusy(true);setError('');try{const result=await onValidate({attendanceId:item.id,approved:decision==='APPROVE',rejectionNote:note});if(result===false)setError('Validasi gagal. Periksa notifikasi lalu coba kembali.');else setDecision(null);}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <article className="workspace-card"><div className="workspace-heading"><h3>{item.outletName}</h3><span className="app-status">{pending?'Menunggu validasi':item.validationStatus || item.status}</span></div><p>{item.address}</p><p>Sales: {item.salesName || '—'} • {item.timestamp || 'Waktu belum tersedia'}</p><p>{item.reason || 'Tidak ada catatan kunjungan'}</p>{item.visitOutcome&&<><p>{visitOutcomeText(item.visitOutcome)}</p><VisitOutcomeAttachments value={item.visitOutcome}/></>}{pending && <div className="app-actions"><button className="app-button app-button-primary" onClick={()=>{setDecision('APPROVE');setNote('');setError('');}}>Validasi kunjungan</button><button className="app-button" onClick={()=>{setDecision('REJECT');setNote('');setError('');}}>Tolak kunjungan</button></div>}
    <NativeDialog open={Boolean(decision)} title={decision==='APPROVE'?'Validasi kunjungan luar PJP':'Tolak kunjungan luar PJP'} busy={busy} onClose={()=>setDecision(null)}><form className="app-form" onSubmit={save}><p>{item.outletName} — {item.salesName}</p><p>Keputusan ini memvalidasi kunjungan. Nominal/SKU manual tetap mengikuti kebijakan dan persetujuannya sendiri.</p><label className="app-field">{decision==='REJECT'?'Alasan penolakan':'Catatan (opsional)'}<textarea required={decision==='REJECT'} minLength={decision==='REJECT'?5:undefined} value={note} onChange={e=>setNote(e.target.value)}/></label>{error && <p role="alert" className="app-error">{error}</p>}<button className="app-button app-button-primary" disabled={busy}>{busy?'Menyimpan…':'Simpan keputusan'}</button></form></NativeDialog>
  </article>;
}
