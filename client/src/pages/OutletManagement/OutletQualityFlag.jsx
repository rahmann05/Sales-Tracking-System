import React,{useState} from 'react';
import {outletIssues,OUTLET_ISSUE_LABELS,canOpenOutletReview} from '../../../../shared/outlet-validation.mjs';
import {useApp} from '../../context/AppContext';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {useFeaturePolicy} from '../../shared/hooks/useFeaturePolicy';
import {outletValidationApi} from '../../services/api';
import {TAB_IDS} from '../../constants/navigation';
export function OutletQualityFlag({outlet:o}){
 const issues=outletIssues(o),{user,setActiveTab}=useApp(),feature=useFeaturePolicy('OUTLET_REVIEW'),[,setReview]=useWorkspaceState('outletReview','');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const existing=o.reviews?.find(r=>!['COMPLETED','CANCELLED'].includes(r.status));
 const open=async()=>{if(busy)return;setBusy(true);setError('');try{const review=existing||(await outletValidationApi.openReview(o.id,{reason:issues.length?`Periksa kualitas master: ${issues.map(k=>OUTLET_ISSUE_LABELS[k]).join(', ')}.`:'Pemeriksaan opsional Admin atas identitas dan lokasi outlet.'})).data;setReview(review.id);setActiveTab(TAB_IDS.OUTLET_VALIDATION);}catch(e){setError(e.message);}finally{setBusy(false);}};
 const confirmed=o.validationStatus==='VALID'&&o.validationDetails?.qualityConfirmed;
 return <div className={`outlet-quality ${issues.length?'outlet-quality--flagged':'outlet-quality--unflagged'}`}><strong className="outlet-quality-heading">{issues.length?'Data perlu diperiksa':confirmed&&!o.validationDetails?.stale?'Tidak ada flag · pemeriksaan tercatat':'Tidak ada flag otomatis'}</strong>{issues.length?<ul>{issues.map(k=><li key={k}>{OUTLET_ISSUE_LABELS[k]}</li>)}</ul>:<small>Tidak ada flag bukan jaminan identitas dan titik sudah benar.</small>}{!o.deletedAt&&user?.permissions?.can_validate_outlet&&(existing||canOpenOutletReview(o,user))&&<button type="button" className="app-button" disabled={busy||!existing&&!feature.canStart} title={existing?'':feature.reason} onClick={open}>{busy?'Membuka…':existing?'Lanjutkan validasi':issues.length?'Validasi data':'Validasi opsional'}</button>}{error&&<p className="app-error" role="alert">{error}</p>}</div>;
}
