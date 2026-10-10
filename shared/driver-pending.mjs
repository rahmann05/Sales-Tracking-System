import {readDraft} from './form-draft.mjs';
export function driverPendingDrafts(storage,userId){
 const prefix=`form-draft:${userId}:driver-evidence:`,rows=[];
 try{const keys=Array.from({length:storage.length},(_,i)=>storage.key(i));for(const key of keys){
  if(!key?.startsWith(prefix))continue;
  const value=readDraft(storage,key);if(value?.pending?.requestId&&value.pending.stopId)rows.push({key,pending:value.pending});
 }}catch{}
 return rows;
}
