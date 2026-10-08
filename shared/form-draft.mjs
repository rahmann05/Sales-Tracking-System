export const DRAFT_VERSION=1;
export const DRAFT_TTL=24*60*60*1000;
export function readDraft(storage,key,now=Date.now()){
  try{storage=typeof storage==='function'?storage():storage;const saved=JSON.parse(storage.getItem(key));
    if(saved?.version!==DRAFT_VERSION||!Number.isFinite(saved.at)||(now-saved.at>DRAFT_TTL&&!saved.value?.pending?.requestId)||saved.at>now||!saved.value||typeof saved.value!=='object'){storage.removeItem(key);return null;}
    return saved.value;
  }catch{return null;}
}
export function writeDraft(storage,key,value,now=Date.now()){
  try{storage=typeof storage==='function'?storage():storage;storage.setItem(key,JSON.stringify({version:DRAFT_VERSION,at:now,value}));return true;}catch{return false;}
}
