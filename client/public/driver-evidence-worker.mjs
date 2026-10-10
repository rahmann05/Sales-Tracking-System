// Dedicated evidence queue. No fetch interception, application cache or token refresh.
const DB_NAME='sinar-driver-evidence-v1',STORE='records',SESSION='__session';
const scope=globalThis;
export const retryDisposition=status=>status===401?'NEEDS_AUTH':status===408||status===429||status>=500?'RETRY':status>=200&&status<300?'CONFIRMED':'NEEDS_REVIEW';
export const retryDelay=attempts=>Math.min(300000,5000*2**Math.min(attempts,6));
export const terminalExpired=(row,now,hours)=>['CONFIRMED','CANCELLED'].includes(row.state)&&Number.isFinite(row.updatedAt)&&row.updatedAt<now-hours*3600000;
export function validQueueJob(job){
 return job&&typeof job.actorId==='string'&&typeof job.requestId==='string'&&job.body?.requestId===job.requestId&&
  /^(POST|PATCH)$/.test(job.method)&&/^\/delivery\/stops\/[\w-]+\/(attendance|status)$/.test(job.endpoint)&&
  job.method===(job.endpoint.endsWith('/attendance')?'POST':'PATCH')&&job.draftKey?.startsWith(`form-draft:${job.actorId}:driver-evidence:`);
}
function openDb(){return new Promise((resolve,reject)=>{const request=scope.indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function storage(mode,work){const db=await openDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);let result;work(store,value=>{result=value;});tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Queue transaction aborted'));});}finally{db.close();}}
const read=id=>storage('readonly',(store,done)=>{const r=store.get(id);r.onsuccess=()=>done(r.result);});
const all=()=>storage('readonly',(store,done)=>{const r=store.getAll();r.onsuccess=()=>done(r.result);});
const put=value=>storage('readwrite',store=>store.put(value));
const remove=id=>storage('readwrite',store=>store.delete(id));
async function announce(job){for(const client of await scope.clients.matchAll({type:'window',includeUncontrolled:true}))client.postMessage({type:'DRIVER_QUEUE_CHANGED',actorId:job.actorId,requestId:job.requestId,state:job.state});}
let flight;
async function drainWork(){
 const session=await read(SESSION);if(!session?.enabled||!session.token)return;
 const rows=(await all()).filter(row=>row.actorId===session.actorId&&row.baseUrl===session.baseUrl&&['QUEUED','RETRY','NEEDS_AUTH'].includes(row.state)).sort((a,b)=>a.createdAt-b.createdAt).slice(0,20);
 let transient=false;
 for(const candidate of rows){
  const live=await read(SESSION);if(!live||live.token!==session.token||!live.enabled||live.actorId!==candidate.actorId)break;
  if(candidate.nextAttemptAt>Date.now()){transient=true;continue;}
  const job=await read(candidate.id);if(!job||!['QUEUED','RETRY','NEEDS_AUTH'].includes(job.state))continue;
  const attempts=(job.attempts||0)+1,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  let state,lastError;
  try{
   const response=await scope.fetch(session.baseUrl+job.endpoint,{method:job.method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.token}`},body:JSON.stringify(job.body),signal:controller.signal,cache:'no-store',redirect:'error'});
   let result;try{result=await response.json();}catch{}
   // A successful status with no valid receipt payload is still unconfirmed.
   state=response.ok&&!result?.data?'RETRY':retryDisposition(response.status);
   lastError=state==='CONFIRMED'?null:result?.message||`Respons server ${response.status}; hasil belum dikonfirmasi.`;
  }catch{state='RETRY';lastError='Jaringan belum tersedia atau respons belum dikonfirmasi.';}finally{clearTimeout(timer);}
  const latest=await read(job.id);
  // Manual confirmation and cancellation must survive an older network attempt.
  if(!latest||['CONFIRMED','CANCELLED'].includes(latest.state))continue;
  if(latest.state==='PAUSED'&&state!=='CONFIRMED')state='PAUSED';
  const next={...job,state,lastError,attempts,nextAttemptAt:Date.now()+retryDelay(attempts),updatedAt:Date.now()};
  if(state==='CONFIRMED'){delete next.body;next.confirmedAt=Date.now();}
  await put(next);await announce(next);
  if(state==='NEEDS_AUTH')break;
  if(state==='RETRY')transient=true;
 }
 if(transient)throw new Error('Evidence queue still requires network retry.');
}
export function drain(){if(!flight)flight=drainWork().finally(()=>{flight=null;});return flight;}
async function message(data){
 if(data.type==='SESSION'){
  const url=new URL(data.baseUrl);
  if(url.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw new Error('API antrean memerlukan HTTPS.');
  if(typeof data.actorId!=='string'||typeof data.token!=='string')throw new Error('Sesi antrean tidak valid.');
  const retentionHours=Number.isFinite(data.retentionHours)?Math.max(1,Math.min(168,data.retentionHours)):24;
  await put({id:SESSION,actorId:data.actorId,token:data.token,baseUrl:data.baseUrl.replace(/\/$/,''),enabled:data.enabled===true});
  for(const row of await all())if(row.actorId===data.actorId&&terminalExpired(row,Date.now(),retentionHours))await remove(row.id);
  return {ok:true};
 }
 if(data.type==='FORGET_SESSION'){const current=await read(SESSION);if(current?.token===data.token)await remove(SESSION);return {ok:true};}
 const session=await read(SESSION);
 if(!session||session.actorId!==data.actorId)throw new Error('Masuk dengan akun pemilik bukti sebelum mengelola antrean.');
 if(data.type==='LIST')return {rows:(await all()).filter(row=>row.id!==SESSION&&row.actorId===session.actorId).map(({body,...metadata})=>metadata)};
 if(data.type==='ENQUEUE'){
  if(!session.enabled||!validQueueJob(data.job)||data.job.actorId!==session.actorId)throw new Error('Pengiriman otomatis tidak aktif atau data antrean tidak valid.');
  const job=data.job,id=`${job.actorId}:${job.requestId}`,previous=await read(id);
  if(previous){if(previous.body&&JSON.stringify(previous.body)!==JSON.stringify(job.body)||previous.endpoint!==job.endpoint)throw new Error('UUID sudah dipakai untuk payload berbeda. Periksa hasil server sebelum mengubah bukti.');return {ok:true};}
  await put({...job,id,baseUrl:session.baseUrl,state:'QUEUED',attempts:0,createdAt:Date.now(),updatedAt:Date.now(),nextAttemptAt:0,lastError:null});
  return {ok:true};
 }
 if(data.type==='ACK'){
  const row=await read(`${session.actorId}:${data.requestId}`);if(row){await put({...row,body:undefined,state:'CONFIRMED',confirmedAt:Date.now(),updatedAt:Date.now(),lastError:null});}return {ok:true};
 }
 if(data.type==='RESUME'){
  const row=await read(`${session.actorId}:${data.requestId}`);
  if(row&&['QUEUED','RETRY','NEEDS_AUTH','PAUSED'].includes(row.state)){await put({...row,state:'QUEUED',nextAttemptAt:0,lastError:null});}return {ok:true};
 }
 if(data.type==='PAUSE'){
  const id=`${session.actorId}:${data.requestId}`;let row=await read(id);
  if(row&&row.state!=='CONFIRMED')await put({...row,state:'PAUSED'});
  await flight?.catch(()=>{});row=await read(id);
  if(row&&row.state!=='CONFIRMED')await put({...row,state:'PAUSED'});
  return {ok:true};
 }
 if(data.type==='CANCELLED'){
  const row=await read(`${session.actorId}:${data.requestId}`);
  if(row&&row.state!=='CONFIRMED'){const next={...row,state:'CANCELLED',updatedAt:Date.now(),lastError:null};delete next.body;await put(next);}return {ok:true};
 }
 if(data.type==='DRAIN'){await drain();return {ok:true};}
 throw new Error('Perintah antrean tidak dikenal.');
}
if(typeof scope.skipWaiting==='function'){
 scope.addEventListener('install',event=>event.waitUntil(scope.skipWaiting()));
 scope.addEventListener('activate',event=>event.waitUntil(scope.clients.claim()));
 scope.addEventListener('message',event=>event.waitUntil((async()=>{try{const result=await message(event.data);event.ports[0]?.postMessage(result);if(['SESSION','ENQUEUE'].includes(event.data.type))await drain().catch(()=>{});}catch(error){event.ports[0]?.postMessage({error:error.message});}})()));
 scope.addEventListener('sync',event=>{if(event.tag==='sinar-driver-evidence')event.waitUntil(drain());});
}
