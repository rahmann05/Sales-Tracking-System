import {useCallback,useEffect,useState} from 'react';

// Keep working filters in the URL without introducing a second application router.
export function useWorkspaceState(key,initialValue){
  const read=()=>typeof window==='undefined'?initialValue:new URLSearchParams(window.location.search).get(key)??initialValue;
  const [value,setValue]=useState(read);
  useEffect(()=>{const sync=()=>setValue(read());window.addEventListener('popstate',sync);window.addEventListener('workspace-state-changed',sync);return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('workspace-state-changed',sync);};},[key,initialValue]);
  const update=useCallback((next,{replace=false}={})=>{
    const url=new URL(window.location.href);
    if(next===initialValue||next==='')url.searchParams.delete(key);else url.searchParams.set(key,next);
    window.history[replace?'replaceState':'pushState'](null,'',url);
    window.dispatchEvent(new Event('workspace-state-changed'));
  },[key,initialValue]);
  return [value,update];
}
