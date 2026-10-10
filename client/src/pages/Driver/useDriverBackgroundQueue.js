import {useEffect,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {bindDriverQueue,driverQueueInstalled,driverQueueRows,confirmedDraftCleanup,queueEnabled,resumeDriverQueue} from '../../services/driverBackgroundQueue';
export function useDriverBackgroundQueue(onChanged){
 const {user,settings}=useApp(),[rows,setRows]=useState([]),[error,setError]=useState('');
 useEffect(()=>{
  let active=true,busy=false;
  const load=async()=>{
   if(busy)return;busy=true;
   try{
    if(!queueEnabled(settings)&&!await driverQueueInstalled())return;
    await bindDriverQueue(user,settings);const next=await driverQueueRows(user);let cleaned=false;
    for(const row of next)cleaned=confirmedDraftCleanup(row)||cleaned;
    if(active){setRows(next.filter(row=>!['CONFIRMED','CANCELLED'].includes(row.state)));setError('');}
    if(cleaned){window.dispatchEvent(new Event('driver:drafts-changed'));await onChanged?.();}
   }catch(e){if(active)setError(e.message);}finally{busy=false;}
  };
  const changed=event=>{if(event.data?.type==='DRIVER_QUEUE_CHANGED'&&event.data.actorId===user.id)load();};
  const wake=()=>load();load();const timer=setInterval(load,30000);
  navigator.serviceWorker?.addEventListener('message',changed);window.addEventListener('online',wake);window.addEventListener('focus',wake);window.addEventListener('driver:queue-changed',wake);
  return()=>{active=false;clearInterval(timer);navigator.serviceWorker?.removeEventListener('message',changed);window.removeEventListener('online',wake);window.removeEventListener('focus',wake);window.removeEventListener('driver:queue-changed',wake);};
 },[user.id,settings.DRIVER_BACKGROUND_SUBMISSION_ENABLED,settings.DRAFT_STORAGE_MODE,onChanged]);
 const retry=async requestId=>{setError('');try{await bindDriverQueue(user,settings);await resumeDriverQueue(user,requestId);}catch(e){setError(e.message);}finally{window.dispatchEvent(new Event('driver:queue-changed'));}};
 return {rows,error,retry,enabled:queueEnabled(settings)};
}
