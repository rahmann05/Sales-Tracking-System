import {projectOperationalData} from '../../../shared/outlet-location.mjs';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const REQUEST_TIMEOUT_MS=30000;
let sessionRevision=0;
let refreshFlight=null;
const reads=new Map();
export const getAuthToken=()=>localStorage.getItem('token') || '';
export const setAuthToken=token=>token?localStorage.setItem('token',token):localStorage.removeItem('token');
export function clearSession() {
  try{const oldToken=getAuthToken();navigator.serviceWorker?.getRegistration('/driver-evidence-worker.mjs').then(r=>r?.active?.postMessage({type:'FORGET_SESSION',token:oldToken})).catch(()=>{});}catch{}
  sessionRevision++;
  for(const key of ['token','refreshToken','authUser'])localStorage.removeItem(key);
  reads.clear();
}
export function saveSession(data) {
  clearSession();
  setAuthToken(data.accessToken || data.token);
  if(data.refreshToken)localStorage.setItem('refreshToken',data.refreshToken);
  if(data.user)localStorage.setItem('authUser',JSON.stringify(data.user));
}
const failure=(message,status,code)=>Object.assign(new Error(message),{status,code});
const changed=()=>failure('Sesi telah berubah. Muat ulang data untuk akun aktif.',401,'SESSION_CHANGED');
function expire(revision) {
  if(revision!==sessionRevision)return;
  const hadSession=Boolean(getAuthToken() || localStorage.getItem('authUser'));
  clearSession();
  if(hadSession)window.dispatchEvent(new CustomEvent('auth:expired'));
}
async function fetchJson(endpoint,options={}) {
  const {timeoutMs=REQUEST_TIMEOUT_MS,...fetchOptions}=options;
  const controller=new AbortController();
  const abort=()=>controller.abort(fetchOptions.signal?.reason);
  if(fetchOptions.signal?.aborted)abort();
  else fetchOptions.signal?.addEventListener('abort',abort,{once:true});
  let timer;
  try {
    // The deadline includes a response body that never completes, as well as stalled connections.
    return await Promise.race([(async()=>{
      const response=await fetch(`${API_BASE}${endpoint}`,{...fetchOptions,signal:controller.signal});
      let data;
      try {data=await response.json();} catch(error) {
        if(controller.signal.aborted)throw error;
        if(response.ok)throw failure('Respons server tidak valid. Coba muat ulang.',502,'INVALID_RESPONSE');
        data={};
      }
      return {response,data};
    })(),new Promise((_,reject)=>{timer=setTimeout(()=>{reject(failure('Server terlalu lama merespons. Silakan coba lagi; perubahan belum dikonfirmasi.',408,'REQUEST_TIMEOUT'));controller.abort();},timeoutMs);})]);
  } catch(error) {
    if(error.status || error.name==='AbortError')throw error;
    throw new Error(navigator.onLine===false?'Perangkat offline. Hubungkan kembali lalu kirim ulang.':'Server belum dapat dihubungi. Coba kembali; perubahan belum dikonfirmasi.',{cause:error});
  } finally {clearTimeout(timer);fetchOptions.signal?.removeEventListener('abort',abort);}
}
async function refreshToken(revision) {
  if(refreshFlight?.revision===revision)return refreshFlight.promise;
  const token=localStorage.getItem('refreshToken');
  if(!token)throw failure('Sesi berakhir. Silakan masuk kembali.',401,'SESSION_EXPIRED');
  const flight=(async()=>{
    const {response,data}=await fetchJson('/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:token})});
    if(revision!==sessionRevision || token!==localStorage.getItem('refreshToken'))throw changed();
    if(!response.ok || !data.data?.accessToken)throw failure(data.message || 'Sesi berakhir. Silakan masuk kembali.',response.ok?502:response.status,'REFRESH_FAILED');
    setAuthToken(data.data.accessToken);
  })();
  const pending={revision,promise:flight};
  refreshFlight=pending;
  try {await flight;}finally{if(refreshFlight===pending)refreshFlight=null;}
}
async function perform(endpoint,options,revision) {
  const publicRequest=['/auth/login','/health'].includes(endpoint);
  if(!publicRequest && !getAuthToken())throw failure('Sesi berakhir. Silakan masuk kembali.',401,'SESSION_EXPIRED');
  const send=token=>fetchJson(endpoint,{...options,headers:{'Content-Type':'application/json',...options.headers,...(token?{Authorization:`Bearer ${token}`}:{})}});
  const token=publicRequest?'':getAuthToken();
  let result=await send(token);
  // Retry only reads; mutations need explicit confirmation after a failed response.
  if(result.response.status===503 && (!options.method || options.method==='GET')) {
    await new Promise(resolve=>setTimeout(resolve,400));
    if(!publicRequest && revision!==sessionRevision)throw changed();
    result=await send(token);
  }
  if(!publicRequest && revision!==sessionRevision)throw changed();
  if(result.response.status===401 && !publicRequest) {
    try {if(getAuthToken()===token)await refreshToken(revision);}catch(error){if(revision!==sessionRevision)throw changed();if(error.status===401)expire(revision);throw error;}
    if(revision!==sessionRevision)throw changed();
    result=await send(getAuthToken());
    if(revision!==sessionRevision)throw changed();
  }
  if(!result.response.ok) {
    if(result.response.status===401 && !publicRequest)expire(revision);
    const error=failure(result.data.message || result.data.errors?.[0]?.message || `Request gagal (${result.response.status})`,result.response.status);
    error.data=result.data;throw error;
  }
  return /^\/(pjp|delivery|packing|clusters|staff-attendance)(?:[/?]|$)/.test(endpoint)?projectOperationalData(result.data):result.data;
}
export function request(endpoint,options={}) {
  const revision=sessionRevision;
  const canShare=(!options.method || options.method==='GET')&&!options.signal;
  const key=`${revision}:${getAuthToken()}:${endpoint}`;
  if(canShare&&reads.has(key))return reads.get(key);
  const promise=perform(endpoint,options,revision);
  if(canShare){reads.set(key,promise);promise.finally(()=>{if(reads.get(key)===promise)reads.delete(key);}).catch(()=>{});}
  return promise;
}
