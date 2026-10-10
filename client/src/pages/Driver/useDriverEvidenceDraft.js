import {useRef,useState,useEffect} from 'react';
import {useFormDraft} from '../../shared/hooks/useFormDraft';
import {deliveryApi} from '../../services/api';
import {useApp} from '../../context/AppContext';
import {enqueueDriverEvidence,retryableSubmission,acknowledgeDriverQueue,pauseDriverQueue,cancelDriverQueue} from '../../services/driverBackgroundQueue';
export function useDriverEvidenceDraft(stop,type,onSubmit,onConfirmed){
 const {user,settings}=useApp();
 const draft=useFormDraft(`driver-evidence:${stop.id}:${type}`,{recipientName:'',signatureDataUrl:'',notes:'',photo:null,gps:null,reason:'',cartons:stop.allocatedCartons,rejected:{},invoiceRejected:{},withoutCheckout:false,checkoutReason:'',pending:null});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const inflight=useRef(false);
 useEffect(()=>{
  const confirmed=event=>{const data=event.data;if(data?.type==='DRIVER_QUEUE_CHANGED'&&data.actorId===user.id&&data.state==='CONFIRMED'&&data.requestId===draft.value.pending?.requestId){draft.clear();onConfirmed?.();}};
  navigator.serviceWorker?.addEventListener('message',confirmed);return()=>navigator.serviceWorker?.removeEventListener('message',confirmed);
 },[user.id,draft.value.pending?.requestId,draft.clear,onConfirmed]);
 const send=async(payload)=>{
  if(inflight.current)return;inflight.current=true;setBusy(true);setError('');
  try{
   const pending=draft.value.pending||{...payload,requestId:crypto.randomUUID(),stopId:stop.id,outletName:stop.outlet?.name||''};
   if(!draft.persist(prev=>({...prev,pending})))throw new Error('Ruang penyimpanan browser tidak cukup. Identitas pengiriman belum aman; kosongkan ruang lalu coba lagi.');
   window.dispatchEvent(new Event('driver:drafts-changed'));
   await onSubmit(stop.id,pending);await acknowledgeDriverQueue(user,pending.requestId).catch(()=>{});draft.clear();window.dispatchEvent(new Event('driver:drafts-changed'));
  }catch(e){
   const pending=draft.value.pending;
   // Persist may have updated React state only on the next render; obtain the saved pending request.
   let saved=pending;try{saved=JSON.parse(localStorage.getItem(`form-draft:${user.id}:driver-evidence:${stop.id}:${type}`))?.value?.pending||pending;}catch{}
   if(saved&&retryableSubmission(e))try{if(await enqueueDriverEvidence(user,settings,stop.id,type,saved)){setError('Belum dikonfirmasi server. Bukti asli sudah masuk antrean otomatis; pantau pada Pengiriman belum dikonfirmasi.');window.dispatchEvent(new Event('driver:queue-changed'));return;}}catch(queueError){setError(`${e.message} Antrean otomatis belum tersimpan: ${queueError.message}`);return;}
   setError(e.message);
  }finally{inflight.current=false;setBusy(false);}
 };
 const edit=async()=>{
  if(!draft.value.pending||inflight.current)return;inflight.current=true;setBusy(true);setError('');
  try{await pauseDriverQueue(user,draft.value.pending.requestId);const res=await deliveryApi.cancelRequest(stop.id,draft.value.pending.requestId);
   if(res.data.confirmed){setError('Hasil sudah tersimpan. Kirim ulang isian yang sama untuk mengambil konfirmasi.');return;}
   await cancelDriverQueue(user,draft.value.pending.requestId);draft.setValue(prev=>({...prev,pending:null}));window.dispatchEvent(new Event('driver:drafts-changed'));window.dispatchEvent(new Event('driver:queue-changed'));
  }catch(e){setError(e.message);}finally{inflight.current=false;setBusy(false);}
 };
 return {...draft,busy,error,setError,send,edit};
}
