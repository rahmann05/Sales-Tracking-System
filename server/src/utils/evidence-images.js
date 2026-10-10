import {evidenceImageError,EVIDENCE_IMAGE_KEYS,EVIDENCE_IMAGE_DEFAULTS} from '../../../shared/evidence-image-policy.mjs';
import {getDynamicConfig} from '../modules/config/config.service.js';
import {processValue} from '../modules/config/services/process-policy.service.js';
import {AppError} from './errors.js';
const fields=new Set(['photoUrl','photo','taxDocumentUrl','dataUrl']);
export async function assertEvidenceImages(payload,{entity=null,values=null}={}){
 if(!values)values=Object.fromEntries(await Promise.all(EVIDENCE_IMAGE_KEYS.map(async key=>[key,entity?await processValue(entity,key,EVIDENCE_IMAGE_DEFAULTS[key]):await getDynamicConfig(key,EVIDENCE_IMAGE_DEFAULTS[key])])));
 const walk=(node,path='Bukti')=>{
  if(!node||typeof node!=='object')return;
  for(const [key,value] of Object.entries(node)){
   if(fields.has(key)){const error=evidenceImageError(value,values,`${path}.${key}`);if(error)throw new AppError(error,422);}
   else if(value&&typeof value==='object')walk(value,`${path}.${key}`);
  }
 };
 walk(payload);
}
