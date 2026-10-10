import React,{useState} from 'react';
import {outletIssues,OUTLET_ISSUE_LABELS} from '../../../../shared/outlet-validation.mjs';
import {useApp} from '../../context/AppContext';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {useFeaturePolicy} from '../../shared/hooks/useFeaturePolicy';
import {outletValidationApi} from '../../services/api';
import {TAB_IDS} from '../../constants/navigation';
export function OutletQualityFlag({outlet:o}){
 const issues=outletIssues(o),{user,setActiveTab}=useApp(),feature=useFeaturePolicy('OUTLET_REVIEW'),[,setReview]=useWorkspaceState('outletReview','');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const existing=o.reviews?.find(r=>!['COMPLETED','CANCELLED'].includes(r.status));
 const open=async()=>{if(busy)return;setBusy(true);setError('');try{const review=existing||(await outletValidationApi.openReview(o.id,{reason:`Periksa kualitas master: ${issues.map(k=>OUTLET_ISSUE_LABELS[k]).join(', ')}.`})).data;setReview(review.id);setActiveTab(TAB_IDS.OUTLET_VALIDATION);}catch(e){setError(e.message);}finally{setBusy(false);}};
 if(!issues.length)return null;
 return <div className="outlet-quality"><strong>Data perlu diperiksa</strong><ul>{issues.map(k=><li key={k}>{OUTLET_ISSUE_LABELS[k]}</li>)}</ul>{!o.deletedAt&&user?.permissions?.can_validate_outlet&&<button type="button" className="app-button" disabled={busy||!existing&&!feature.canStart} title={existing?'':feature.reason} onClick={open}>{busy?'Membuka…':existing?'Lanjutkan validasi':'Validasi data'}</button>}{error&&<p className="app-error" role="alert">{error}</p>}</div>;
}
