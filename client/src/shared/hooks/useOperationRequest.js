import {useRef} from 'react';
import {useApp} from '../../context/AppContext';

// Persist only a digest and request ID. Retrying the same payload after a lost
// response reuses the server operation, including after a page refresh.
export function useOperationRequest(kind){
 const {user}=useApp(),memory=useRef(null),key=`operation:${user?.id}:${kind}`;
 return {async identify(body){
  const bytes=new TextEncoder().encode(JSON.stringify(body));
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
  let previous=memory.current;try{previous=JSON.parse(sessionStorage.getItem(key))||previous;}catch{}
  const record=previous?.digest===digest?previous:{digest,id:crypto.randomUUID()};memory.current=record;
  try{sessionStorage.setItem(key,JSON.stringify(record));}catch{}
  return {...body,requestId:record.id};
 },clear(){memory.current=null;try{sessionStorage.removeItem(key);}catch{}}};
}
