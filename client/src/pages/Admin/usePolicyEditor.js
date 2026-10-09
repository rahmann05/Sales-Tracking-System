import {useState,useEffect,useCallback} from 'react';
import {configApi} from '../../services/api';
import {CONFIG_PARAMS,parseConfigValue} from '../../../../shared/config.mjs';
import {policyGlobalOnly} from '../../../../shared/operational-policy.mjs';
import {initialValues} from './AdminConfigNavigation';
import {useUnsavedNavigation} from '../../shared/hooks/useUnsavedNavigation';
export function usePolicyEditor(refreshSettings){
 const [scope,setScope]=useState('GLOBAL'),[data,setData]=useState(null),[values,setValues]=useState({}),[reason,setReason]=useState('');
 const [inherited,setInherited]=useState([]);
 const merged=d=>({...d?.effective?.values,...Object.fromEntries(Object.entries(d?.profile?.draft||{}).map(([k,v])=>[k,v===null?d.parent.values[k]:v]))});
 const [preview,setPreview]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[errors,setErrors]=useState({});
 const baseline=initialValues(merged(data));
 const dirty=Boolean(data)&&(CONFIG_PARAMS.some(p=>values[p.key]!==baseline[p.key])||JSON.stringify([...inherited].sort())!==JSON.stringify(Object.entries(data.profile.draft).filter(([,v])=>v===null).map(([k])=>k).sort()));
 useUnsavedNavigation(dirty,busy);
 const load=useCallback(async()=>{
  setBusy(true);setError('');setData(null);setPreview(null);
  try{const res=await configApi.policy(scope);setData(res.data);setValues(initialValues(merged(res.data)));setInherited(Object.entries(res.data.profile.draft).filter(([,v])=>v===null).map(([k])=>k));setReason(res.data.profile.reason||'');}
  catch(e){setError(e.message);}finally{setBusy(false);}
 },[scope]);
 useEffect(()=>{load();},[load]);
 const change=(key,value)=>{setInherited(keys=>keys.filter(k=>k!==key));setValues(v=>({...v,[key]:value}));setPreview(null);setErrors({});setMessage('');};
 const changeScope=next=>{if(!dirty||window.confirm('Perubahan lokal belum disimpan sebagai draf. Pindah profil?'))setScope(next);};
 const save=async()=>{
  setBusy(true);setError('');setMessage('');const fieldErrors={},updates={};
  for(const param of CONFIG_PARAMS){
   if(scope!=='GLOBAL'&&(policyGlobalOnly(param.key)))continue;
   if(inherited.includes(param.key)){updates[param.key]=null;continue;}
   try{const value=parseConfigValue(param,values[param.key]);if(JSON.stringify(value)!==JSON.stringify(data.effective.values[param.key])||Object.hasOwn(data.profile.draft,param.key))updates[param.key]=value;}
   catch(e){fieldErrors[param.key]=e.message;}
  }
  setErrors(fieldErrors);
  if(Object.keys(fieldErrors).length){setError('Perbaiki nilai yang ditandai sebelum menyimpan.');setBusy(false);return;}
  try{const res=await configApi.saveDraft(scope,{revision:data.profile.revision,reason,values:updates});setData(d=>({...d,profile:res.data}));setPreview(null);setMessage('Draf tersimpan. Aturan operasional belum berubah.');}
  catch(e){setError(e.message);}finally{setBusy(false);}
 };
 const review=async()=>{setBusy(true);setError('');try{const res=await configApi.preview(scope,data.profile.revision);setPreview(res.data);}catch(e){setError(e.message);}finally{setBusy(false);}};
 const publish=async effectiveAt=>{setBusy(true);setError('');try{await configApi.publish(scope,{revision:data.profile.revision,fingerprint:preview.fingerprint,effectiveAt:effectiveAt?new Date(effectiveAt).toISOString():undefined});await load();await refreshSettings();setMessage('Versi diterbitkan. Waktu berlaku dan histori tercatat.');}catch(e){setError(e.message);}finally{setBusy(false);}};
 const restore=async versionId=>{setBusy(true);setError('');try{const res=await configApi.restore(scope,{revision:data.profile.revision,versionId,reason:reason||'Memulihkan aturan versi sebelumnya'});const next={...data,profile:res.data};setData(next);setValues(initialValues(merged(next)));setInherited(Object.entries(res.data.draft).filter(([,v])=>v===null).map(([k])=>k));setReason(res.data.reason);setPreview(null);setMessage('Versi lama disalin ke draf. Tinjau sebelum menerbitkan kembali.');}catch(e){setError(e.message);}finally{setBusy(false);}};
 const discard=()=>{setValues(baseline);setInherited(Object.entries(data.profile.draft).filter(([,v])=>v===null).map(([k])=>k));setErrors({});setPreview(null);};
 const inherit=key=>{change(key,typeof data.parent.values[key]==='object'?JSON.stringify(data.parent.values[key]):String(data.parent.values[key]));setInherited(keys=>[...new Set([...keys,key])]);};
 const clearDraft=async()=>{setBusy(true);setError('');try{await configApi.saveDraft(scope,{revision:data.profile.revision,reason:reason.trim().length>=5?reason:'Membatalkan seluruh draf tersimpan',values:{}});await load();setMessage('Draf tersimpan dibatalkan. Aturan aktif tetap berlaku.');}catch(e){setError(e.message);}finally{setBusy(false);}};
 const cancelSchedule=async versionId=>{setBusy(true);setError('');try{await configApi.cancelSchedule(scope,{versionId,revision:data.profile.revision,reason});await load();setMessage('Jadwal dibatalkan. Versi aktif tetap berlaku.');}catch(e){setError(e.message);}finally{setBusy(false);}};
 return {cancelSchedule,clearDraft,inherit,scope,changeScope,data,values,reason,setReason,preview,busy,error,message,errors,dirty,load,change,save,review,publish,restore,discard};
}
