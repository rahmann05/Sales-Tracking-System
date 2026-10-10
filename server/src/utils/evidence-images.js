import {evidenceImageError,EVIDENCE_IMAGE_KEYS,EVIDENCE_IMAGE_DEFAULTS} from '../../../shared/evidence-image-policy.mjs';
import {getDynamicConfig} from '../modules/config/config.service.js';
import {processValue} from '../modules/config/services/process-policy.service.js';
import {AppError} from './errors.js';
const labels={photoUrl:'Foto bukti',photo:'Foto lapangan',taxDocumentUrl:'Dokumen identitas',dataUrl:'Lampiran gambar'};
export async function assertEvidenceImages(payload,{entity=null,values=null}={}){
 if(!values)values=Object.fromEntries(await Promise.all(EVIDENCE_IMAGE_KEYS.map(async key=>[key,entity?await processValue(entity,key,EVIDENCE_IMAGE_DEFAULTS[key]):await getDynamicConfig(key,EVIDENCE_IMAGE_DEFAULTS[key])])));
 const walk=(node,index=null)=>{
  if(!node||typeof node!=='object')return;
  for(const [key,value] of Object.entries(node)){
   if(Object.hasOwn(labels,key)){const label=labels[key]+(index===null?'':` ${index+1}`),error=evidenceImageError(value,values,label);if(error)throw new AppError(error,422);}
   else if(value&&typeof value==='object')walk(value,Array.isArray(node)?Number(key):index);
  }
 };
 walk(payload);
}
