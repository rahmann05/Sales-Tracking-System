import {useRef,useState} from 'react';
import {useFormDraft} from '../../shared/hooks/useFormDraft';
import {deliveryApi} from '../../services/api';
export function useDriverEvidenceDraft(stop,type,onSubmit){
 const draft=useFormDraft(`driver-evidence:${stop.id}:${type}`,{notes:'',photo:null,gps:null,reason:'',cartons:stop.allocatedCartons,rejected:{},invoiceRejected:{},withoutCheckout:false,checkoutReason:'',pending:null});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const inflight=useRef(false);
 const send=async(payload)=>{
  if(inflight.current)return;inflight.current=true;setBusy(true);setError('');
  try{
   const pending=draft.value.pending||{...payload,requestId:crypto.randomUUID(),stopId:stop.id,outletName:stop.outlet?.name||''};
   if(!draft.persist(prev=>({...prev,pending})))throw new Error('Ruang penyimpanan browser tidak cukup. Identitas pengiriman belum aman; kosongkan ruang lalu coba lagi.');
   window.dispatchEvent(new Event('driver:drafts-changed'));
   await onSubmit(stop.id,pending);draft.clear();window.dispatchEvent(new Event('driver:drafts-changed'));
  }catch(e){setError(e.message);}finally{inflight.current=false;setBusy(false);}
 };
 const edit=async()=>{
  if(!draft.value.pending||inflight.current)return;inflight.current=true;setBusy(true);setError('');
  try{const res=await deliveryApi.findRequest(stop.id,draft.value.pending.requestId);
   if(res.data.confirmed){setError('Hasil sudah tersimpan. Kirim ulang isian yang sama untuk mengambil konfirmasi.');return;}
   draft.setValue(prev=>({...prev,pending:null}));window.dispatchEvent(new Event('driver:drafts-changed'));
  }catch(e){setError(e.message);}finally{inflight.current=false;setBusy(false);}
 };
 return {...draft,busy,error,setError,send,edit};
}
