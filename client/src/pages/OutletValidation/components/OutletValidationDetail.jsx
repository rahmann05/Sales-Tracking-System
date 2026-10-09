import {useFeaturePolicy} from '../../../shared/hooks/useFeaturePolicy';
import React,{useState} from 'react';
import {outletValidationApi} from '../../../services/api';
import {confirmWorkspaceNavigation} from '../../../shared/utils/confirmWorkspaceNavigation';
import {useUnsavedNavigation} from '../../../shared/hooks/useUnsavedNavigation';
import {OutletReviewAssignment} from './OutletReviewAssignment';
import {OutletMiniMapPreview} from './OutletMiniMapPreview';
import {OutletCoordinateForm} from './OutletCoordinateForm';
import {ValidationSearchPanel} from './ValidationSearchPanel';
import {OutletHistory} from '../../OutletManagement/OutletHistory';
import {stamp,point,resultLabels,reviewLabels} from '../../OutletManagement/outletPresentation';
import {outletReviewEvidenceState} from '../../../../../shared/outlet-evidence-policy.mjs';
export function OutletValidationDetail({review:r,onRefresh,onClose}) {
 const mapPolicy=useFeaturePolicy('MAPS');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[correction,setCorrection]=useState(false),[decision,setDecision]=useState('KEEP'),[note,setNote]=useState(''),[evidence,setEvidence]=useState('');
 useUnsavedNavigation(Boolean(note||evidence),busy);
 const o=r.outlet,run=r.runs[0],result=run?.result,{stale,expired,changed,expiresAt}=outletReviewEvidenceState(r.runs,o),closed=r.status==='COMPLETED';
 const comparisons=stale?[]:[['findPlace','Profil toko'],['forwardGeocode','Titik alamat']].map(([key,label])=>({...result?.signals?.[key],label})).filter(s=>s.googleLat!=null).map(s=>({latitude:s.googleLat,longitude:s.googleLng,distanceMeters:s.distanceMeters,label:s.label}));
 const act=async action=>{if(busy)return;setBusy(true);setError('');try{await action();await onRefresh();}catch(e){setError(e.message);await onRefresh();}finally{setBusy(false);}};
 const saveDecision=e=>{e.preventDefault();act(async()=>{await outletValidationApi.decide(o.id,r.id,{revision:r.revision,action:decision,note,evidence});setNote('');setEvidence('');});};
 return <section className="outlet-panel outlet-review-detail"><header className="outlet-detail-heading"><div><p className="outlet-eyebrow">{o.outletCode || 'Kode belum tersedia'} · {reviewLabels[r.status]}</p><h2>{o.name}</h2><p>{r.reason}</p><small>Diajukan oleh {r.requestedBy.name} · {stamp(r.createdAt)}</small></div><button type="button" className="app-button" onClick={onClose} disabled={busy}>Kembali</button></header><div className="outlet-detail-content">
  {error&&<p className="app-error" role="alert">{error}</p>}
  <OutletReviewAssignment key={r.revision} review={r} onRefresh={onRefresh} disabled={busy}/>
  <div className="outlet-comparison-heading"><div><h3>{changed?'Data berubah setelah pemeriksaan':expired?'Bukti perbandingan peta kedaluwarsa':resultLabels[result?.code] || 'Peta belum diperiksa'}</h3><p className="outlet-muted">{run?`${stamp(run.createdAt)} · ${run.actor.name}`:'Pemeriksaan peta dapat dijalankan bila diperlukan.'}</p>{expiresAt&&<p className="outlet-muted">Bukti pembanding berlaku hingga {stamp(expiresAt)}. Hasil lama tetap tersimpan dalam riwayat.</p>}{stale&&!closed&&<p className="outlet-muted">Periksa ulang atau isi referensi bukti lapangan terbaru sebelum mempertahankan data master.</p>}</div>{!closed&&<button type="button" className="app-button app-button-primary" disabled={busy||!mapPolicy.canStart||mapPolicy.settings.OUTLET_MAP_COMPARISON_ENABLED===false} title={!mapPolicy.canStart?mapPolicy.reason:mapPolicy.settings.OUTLET_MAP_COMPARISON_ENABLED===false?'Perbandingan peta dinonaktifkan Admin.':undefined} onClick={()=>act(()=>outletValidationApi.validateSingle(o.id,{reviewId:r.id,revision:r.revision}))}>{busy?'Memproses…':'Periksa dengan peta'}</button>}</div>
  <div className="outlet-master-snapshot"><strong>Data master saat ini</strong><p>{o.address}</p><small>{point(o)} · radius {o.radiusMeters} m · {o.cluster?.name}</small></div>
  <OutletMiniMapPreview latitude={o.latitude} longitude={o.longitude} name={o.name} radiusMeters={o.radiusMeters} candidates={comparisons}/>
  {comparisons.length>0&&<p className="outlet-muted">Titik kandidat ditampilkan sebagai pembanding. Kehadirannya di peta bukan rekomendasi untuk mengganti master.</p>}
  {result?.warnings?.length>0&&<div className="outlet-warning">{result.warnings.map((w,i)=><p key={i}>{w}</p>)}</div>}{result&&<ValidationSearchPanel result={result}/>}
  {!closed&&<><div className="app-actions"><button type="button" className="app-button" disabled={busy} onClick={()=>{if(!correction||confirmWorkspaceNavigation())setCorrection(v=>!v);}}>{correction?'Tutup koreksi lokasi':'Koreksi lokasi master'}</button></div>{correction&&<OutletCoordinateForm key={o.updatedAt} outlet={o} suggestion={!stale?result?.suggestion:null} onClose={()=>setCorrection(false)} onSaved={onRefresh}/>}
   <form className="app-form outlet-decision" onSubmit={saveDecision}><h3>Catat keputusan pemeriksaan</h3><p className="outlet-muted">Data boleh dipertahankan berdasarkan bukti lapangan meskipun profil toko tidak ada di peta.</p><label className="app-field">Keputusan<select value={decision} disabled={busy} onChange={e=>setDecision(e.target.value)}><option value="KEEP">Pertahankan data master</option><option value="CORRECTED">Selesai · data sudah dikoreksi</option><option value="WAITING_FIELD">Minta pengecekan lapangan</option></select></label><label className="app-field">Alasan keputusan<textarea required minLength={10} maxLength={2000} value={note} disabled={busy} onChange={e=>setNote(e.target.value)}/></label><label className="app-field">Referensi bukti / tindak lanjut<textarea maxLength={2000} required={Boolean(stale&&decision==='KEEP')} minLength={stale&&decision==='KEEP'?10:undefined} value={evidence} disabled={busy} onChange={e=>setEvidence(e.target.value)} placeholder="Sumber data, hasil kunjungan, atau Sales dan rencana pengecekan lapangan."/></label><button type="submit" className="app-button app-button-primary" disabled={busy}>{busy?'Mencatat…':decision==='WAITING_FIELD'?'Catat tindak lanjut lapangan':'Selesaikan kasus'}</button></form></>}
  {r.decision&&<div className="outlet-notice"><div><strong>Keputusan terakhir · {r.decision.actor.name}</strong><p>{r.decision.note}</p>{r.decision.evidence&&<p>{r.decision.evidence}</p>}<small>{stamp(r.decision.at)}</small></div></div>}
  <details className="outlet-disclosure"><summary>Riwayat bukti & perubahan</summary><OutletHistory outlet={{...o,reviews:[r]}}/></details>
 </div></section>;
}
