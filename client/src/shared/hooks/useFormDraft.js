import {useCallback,useRef,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {readDraft,writeDraft,mergeFormDraft,draftPolicyVersion,policyVersionChanged} from '../../../../shared/form-draft.mjs';
const identity=value=>value;
// The storage mode is frozen while a form is open, so a policy change cannot lose a pending request.
export function useFormDraft(scope,initialValue,project=identity){
  const {user,settings}=useApp();
  const [persistent]=useState(settings?.DRAFT_STORAGE_MODE==='PERSISTENT');
  const storage=useCallback(()=>persistent?localStorage:sessionStorage,[persistent]);
  const otherStorage=useCallback(()=>persistent?sessionStorage:localStorage,[persistent]);
  const key=`form-draft:${user?.id}:${scope}`;
  const activeKey=useRef(key);activeKey.current=key;
  const initialise=()=>{
    const initial=typeof initialValue==='function'?initialValue():initialValue;
    const ttl=(settings?.DRAFT_RETENTION_HOURS||24)*3600000;
    const primary=readDraft(storage,key,Date.now(),ttl),saved=primary||readDraft(otherStorage,key,Date.now(),ttl);
    const policyVersions=saved?draftPolicyVersion(primary?storage:otherStorage,key):settings?.POLICY_VERSIONS;
    return {key,initial,value:mergeFormDraft(initial,saved),restored:!!saved,storageError:'',policyVersions};
  };
  const [entry,setEntry]=useState(initialise);
  // Reset before rendering children when the account or business-record scope changes.
  let active=entry;if(entry.key!==key){active=initialise();setEntry(active);}
  const {value,initial,restored,storageError}=active;
  const policyChanged=policyVersionChanged(active.policyVersions,settings?.POLICY_VERSIONS);
  const restoreMessage=policyChanged?'Aturan berubah sejak draf dibuat. Isian tetap dipertahankan; tinjau kembali. Server memvalidasi aturan sebelum menyimpan.':restored&&!active.policyVersions?'Draf lama dipulihkan; versi aturan awal tidak tersedia. Tinjau kembali sebelum mengirim.':'Draf isian dipulihkan dari browser ini. Tinjau kembali sebelum mengirim.';
  const current=useRef(value);current.current=value;
  const setDraft=useCallback(update=>{
    if(activeKey.current!==key)return false;
    const next=typeof update==='function'?update(current.current):update;
    current.current=next;
    const saved=writeDraft(storage,key,project(next),Date.now(),{policyVersions:active.policyVersions});
    if(saved)try{otherStorage().removeItem(key);}catch{}
    setEntry(prev=>({...prev,value:next,storageError:saved?'':'Draft belum tersimpan di browser. Jangan muat ulang sebelum mengirim.'}));
    return saved;
  },[key,project,storage,otherStorage,active.policyVersions]);
  const clear=useCallback(()=>{if(activeKey.current!==key)return;for(const get of [()=>sessionStorage,()=>localStorage])try{get().removeItem(key);}catch{}setEntry(prev=>({...prev,storageError:'',restored:false}));},[key]);
  const field=name=>update=>setDraft(prev=>({...prev,[name]:typeof update==='function'?update(prev[name]):update}));
  return {value,setValue:setDraft,persist:setDraft,field,clear,restored,storageError,persistent,policyChanged,restoreMessage,dirty:JSON.stringify(value)!==JSON.stringify(initial)};
}
