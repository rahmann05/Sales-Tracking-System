const SCRIPT_TIMEOUT_MS = 10000;
let flight=null, flightKey='', sequence=0, authHookInstalled=false;

/** Share a single request across maps; failed requests can be retried. */
export function loadGoogleMapsScript(apiKey) {
 if(!apiKey)return Promise.reject(new Error('Google Maps browser key is missing'));
 if(!authHookInstalled){
  const previous=window.gm_authFailure;
  window.gm_authFailure=()=>{window.dispatchEvent(new Event('google-maps-auth-failure'));previous?.();};
  authHookInstalled=true;
 }
 if(window.google?.maps?.Map)return Promise.resolve(window.google.maps);
 if(flight){
  if(flightKey===apiKey)return flight;
  return flight.then(()=>loadGoogleMapsScript(apiKey),()=>loadGoogleMapsScript(apiKey));
 }
 flightKey=apiKey;
 const callback=`__initOutletGoogleMaps${++sequence}`;
 const promise=new Promise((resolve,reject)=>{
  let settled=false,script=document.getElementById('google-maps-script');
  const cleanup=()=>{clearTimeout(timer);delete window[callback];window.removeEventListener('google-maps-auth-failure',onAuth);script?.removeEventListener('load',onLoad);script?.removeEventListener('error',onError);};
  const finish=error=>{
   if(settled)return;settled=true;cleanup();
   if(error){script?.remove();reject(error);}else resolve(window.google.maps);
  };
  const onLoad=()=>{if(window.google?.maps?.Map)finish();};
  const onError=()=>finish(new Error('Google Maps script failed to load'));
  const onAuth=()=>finish(new Error('Google Maps browser key was rejected'));
  const timer=setTimeout(()=>finish(new Error('Google Maps script load timed out')),SCRIPT_TIMEOUT_MS);
  window.addEventListener('google-maps-auth-failure',onAuth);
  if(script){
   let matches=false;try{matches=new URL(script.src).searchParams.get('key')===apiKey;}catch{/* malformed previous script */}
   if(!matches){script.remove();script=null;}
  }
  if(!script){
   script=document.createElement('script');script.id='google-maps-script';
   window[callback]=onLoad;
   script.src=`https://maps.googleapis.com/maps/api/js?${new URLSearchParams({key:apiKey,libraries:'places,geometry,marker',loading:'async',callback})}`;
   script.async=true;script.defer=true;
   script.addEventListener('load',onLoad);script.addEventListener('error',onError);
   document.head.appendChild(script);
  }else{script.addEventListener('load',onLoad);script.addEventListener('error',onError);}
 });
 flight=promise;
 promise.finally(()=>{if(flight===promise){flight=null;flightKey='';}}).catch(()=>{});
 return promise;
}
