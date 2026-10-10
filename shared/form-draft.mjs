export const DRAFT_VERSION=1;
export const DRAFT_TTL=24*60*60*1000;
// A legacy request receipt must survive migration even when the ordinary draft has pending:null.
export function mergeFormDraft(initial,saved){
 const value={...initial,...saved};
 if(initial?.pending?.requestId&&!saved?.pending?.requestId)value.pending=initial.pending;
 return value;
}
export function readDraft(storage,key,now=Date.now(),ttl=DRAFT_TTL){
  try{storage=typeof storage==='function'?storage():storage;const saved=JSON.parse(storage.getItem(key));
    if(saved?.version!==DRAFT_VERSION||!Number.isFinite(saved.at)||(now-saved.at>ttl&&!saved.value?.pending?.requestId)||saved.at>now||!saved.value||typeof saved.value!=='object'||Array.isArray(saved.value)){storage.removeItem(key);return null;}
    return saved.value;
  }catch{return null;}
}
export function draftPolicyVersion(storage,key){
 try{storage=typeof storage==='function'?storage():storage;const versions=JSON.parse(storage.getItem(key))?.policyVersions;return Array.isArray(versions)&&versions.every(row=>row&&typeof row==='object')?versions:null;}catch{return null;}
}
export function policyVersionChanged(before,after){
 if(!Array.isArray(before)||!Array.isArray(after))return false;
 const normalized=rows=>JSON.stringify(rows.map(({scope,revision})=>({scope,revision})).sort((a,b)=>String(a.scope).localeCompare(String(b.scope))));
 return normalized(before)!==normalized(after);
}
export function writeDraft(storage,key,value,now=Date.now(),metadata={}){
  try{storage=typeof storage==='function'?storage():storage;storage.setItem(key,JSON.stringify({version:DRAFT_VERSION,at:now,value,...metadata}));return true;}catch{return false;}
}
