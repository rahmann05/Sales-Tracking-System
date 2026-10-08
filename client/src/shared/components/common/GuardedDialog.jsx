import React,{useState} from 'react';
import {NativeDialog} from './NativeDialog';
import {useUnsavedNavigation} from '../../hooks/useUnsavedNavigation';
export function GuardedDialog({dirty=false,busy=false,onClose,closeDescription='Isian yang belum disimpan dapat hilang.',children,...props}){
  const [confirming,setConfirming]=useState(false);
  useUnsavedNavigation(dirty,busy);
  const close=()=>{if(busy)return;if(confirming)setConfirming(false);else if(dirty)setConfirming(true);else onClose();};
  return <NativeDialog {...props} onClose={close} busy={busy}>
    {confirming&&<section className="app-discard-confirm" aria-label="Konfirmasi penutupan formulir"><h3>Tutup formulir tanpa mengirim?</h3><p>{closeDescription}</p><div><button type="button" className="app-button" autoFocus onClick={()=>setConfirming(false)}>Lanjutkan mengisi</button><button type="button" className="app-button app-button-primary" disabled={busy} onClick={()=>{if(!busy)onClose();}}>Tutup formulir</button></div></section>}
    <div hidden={confirming}>{children}</div>
  </NativeDialog>;
}
