import {getAuthToken} from './httpClient';
import {driverEvidenceRequest} from './api/deliveryApi';
let registration;
const baseUrl=()=>new URL(import.meta.env.VITE_API_BASE_URL||'/api/v1',window.location.origin).href.replace(/\/$/,'');
async function worker(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)throw new Error('Browser belum mendukung antrean latar belakang; kirim ulang secara manual.');
 if(!registration)registration=navigator.serviceWorker.register('/driver-evidence-worker.mjs',{type:'module'}).catch(error=>{registration=null;throw error;});
 const r=await registration;await navigator.serviceWorker.ready;return r.active||r.waiting||r.installing;
}
async function call(data){
 const target=await worker();return new Promise((resolve,reject)=>{const channel=new window.MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(new Error('Antrean belum merespons; draf asli tetap tersimpan.'));},35000);
  channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();event.data.error?reject(new Error(event.data.error)):resolve(event.data);};target.postMessage(data,[channel.port2]);
 });
}
export const queueEnabled=settings=>settings.DRIVER_BACKGROUND_SUBMISSION_ENABLED===true&&settings.DRAFT_STORAGE_MODE==='PERSISTENT';
export async function driverQueueInstalled(){if(!('serviceWorker' in navigator))return false;const r=await navigator.serviceWorker.getRegistration('/driver-evidence-worker.mjs');if(r)registration=Promise.resolve(r);return !!r;}
export async function bindDriverQueue(user,settings){return call({type:'SESSION',actorId:user.id,token:getAuthToken(),baseUrl:baseUrl(),enabled:queueEnabled(settings),retentionHours:settings.DRAFT_RETENTION_HOURS});}
export async function enqueueDriverEvidence(user,settings,stopId,type,pending){
 if(!queueEnabled(settings))return false;
 await bindDriverQueue(user,settings);const req=driverEvidenceRequest(stopId,pending);
 await call({type:'ENQUEUE',actorId:user.id,job:{actorId:user.id,requestId:pending.requestId,draftKey:`form-draft:${user.id}:driver-evidence:${stopId}:${type}`,outletName:pending.outletName,...req}});
 try{const r=await registration;await r.sync?.register('sinar-driver-evidence');}catch{}
 call({type:'DRAIN',actorId:user.id}).catch(()=>{});return true;
}
export async function driverQueueRows(user){return (await call({type:'LIST',actorId:user.id})).rows;}
export async function acknowledgeDriverQueue(user,requestId){if(!registration)return;await call({type:'ACK',actorId:user.id,requestId});}
export async function resumeDriverQueue(user,requestId){await call({type:'RESUME',actorId:user.id,requestId});await call({type:'DRAIN',actorId:user.id});}
export async function pauseDriverQueue(user,requestId){if(await driverQueueInstalled())await call({type:'PAUSE',actorId:user.id,requestId});}
export async function cancelDriverQueue(user,requestId){if(await driverQueueInstalled())await call({type:'CANCELLED',actorId:user.id,requestId});}
export function retryableSubmission(error){return !error.status||error.status===408||error.status===429||error.status>=500;}
export function confirmedDraftCleanup(row){
 if(row.state!=='CONFIRMED')return false;let changed=false;
 for(const storage of [sessionStorage,localStorage])try{const draft=JSON.parse(storage.getItem(row.draftKey));if(draft?.value?.pending?.requestId===row.requestId){storage.removeItem(row.draftKey);changed=true;}}catch{}
 return changed;
}
