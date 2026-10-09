const statuses=new Set(['OK','ZERO_RESULTS','NO_RESULTS','NO_CANDIDATES','REQUEST_DENIED','OVER_QUERY_LIMIT','INVALID_REQUEST','UNKNOWN_ERROR','NOT_FOUND']);
export async function outletMapJson(url,{timeoutSeconds=10}={}){
 const response=await fetch(url,{signal:AbortSignal.timeout(timeoutSeconds*1000)});
 if(response.ok===false)throw new Error('MAP_HTTP_ERROR');
 const data=await response.json();
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('MAP_INVALID_RESPONSE');
 return {...data,status:statuses.has(data.status)?data.status:'MAP_INVALID_RESPONSE'};
}
// Never return/log a fetch error message: it can contain a URL with the server API key.
export const outletMapError=error=>['TimeoutError','AbortError'].includes(error?.name)?'MAP_TIMEOUT':['MAP_HTTP_ERROR','MAP_INVALID_RESPONSE'].includes(error?.message)?error.message:'MAP_PROVIDER_ERROR';
