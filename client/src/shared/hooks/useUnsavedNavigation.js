import {useEffect,useRef} from 'react';
export function useUnsavedNavigation(dirty,busy=false){
  const state=useRef({dirty,busy});
  state.current={dirty,busy};
  useEffect(()=>{
    const guard=event=>{if(state.current.busy||state.current.dirty&&!window.confirm('Perubahan belum disimpan. Tinggalkan halaman ini?'))event.preventDefault();};
    const unload=event=>{if(state.current.dirty||state.current.busy){event.preventDefault();event.returnValue='';}};
    window.addEventListener('app:before-navigate',guard);
    window.addEventListener('beforeunload',unload);
    return()=>{window.removeEventListener('app:before-navigate',guard);window.removeEventListener('beforeunload',unload);};
  },[]);
}
