import {useCallback,useRef,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {readDraft,writeDraft} from '../../../../shared/form-draft.mjs';
const identity=value=>value;
// Session-only drafts are isolated by account and task. Fresh GPS must be captured again.
export function useFormDraft(scope,initialValue,project=identity){
  const {user}=useApp();
  const key=`form-draft:${user?.id}:${scope}`;
  const [initial]=useState(()=>typeof initialValue==='function'?initialValue():initialValue);
  const [saved]=useState(()=>readDraft(()=>sessionStorage,key));
  const [value,setValue]=useState(()=>({...initial,...saved}));
  const current=useRef(value);current.current=value;
  const [storageError,setStorageError]=useState('');
  const [restored,setRestored]=useState(!!saved);
  const setDraft=useCallback(update=>{
    const next=typeof update==='function'?update(current.current):update;
    current.current=next;setValue(next);
    setStorageError(writeDraft(()=>sessionStorage,key,project(next))?'':'Draft belum tersimpan di browser. Jangan muat ulang sebelum mengirim.');
  },[key,project]);
  const clear=useCallback(()=>{try{sessionStorage.removeItem(key);}catch{}setStorageError('');setRestored(false);},[key]);
  const field=name=>update=>setDraft(prev=>({...prev,[name]:typeof update==='function'?update(prev[name]):update}));
  return {value,setValue:setDraft,field,clear,restored,storageError,dirty:JSON.stringify(value)!==JSON.stringify(initial)};
}
