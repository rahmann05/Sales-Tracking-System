import React,{useRef,useState} from 'react';
import {CONFIG_PARAMS,parseConfigValue} from '../../../../shared/config.mjs';
import {POLICY_SECRET_KEYS,policyGlobalOnly} from '../../../../shared/operational-policy.mjs';
export function PolicyTransfer({editor}){
 const input=useRef(null),[error,setError]=useState('');
 const exportValues=()=>{
  const values=Object.fromEntries(Object.entries(editor.data.effective.values).filter(([key])=>!POLICY_SECRET_KEYS.includes(key)));
  const content={format:'sinar-operational-policy',version:1,scope:editor.scope,exportedAt:new Date().toISOString(),values};
  const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'})),link=document.createElement('a');
  link.href=url;link.download=`aturan-${editor.scope.replace(':','-')}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const importValues=async event=>{
  setError('');const file=event.target.files?.[0];if(!file)return;
  try{
   if(file.size>300000)throw new Error('File pengaturan maksimal 300 KB.');
   const content=JSON.parse(await file.text());
   if(content.format!=='sinar-operational-policy'||content.version!==1||!content.values||typeof content.values!=='object')throw new Error('Format file pengaturan tidak dikenali.');
   if(content.scope!==editor.scope)throw new Error('Profil pada file harus sama dengan profil yang sedang diedit.');
   const updates=Object.entries(content.values).map(([key,value])=>{
    const param=CONFIG_PARAMS.find(p=>p.key===key);if(!param||POLICY_SECRET_KEYS.includes(key))throw new Error(`Parameter tidak dapat diimpor: ${key}`);
    return [key,parseConfigValue(param,value)];
   });
   for(const [key,value] of updates)if(editor.scope==='GLOBAL'||!policyGlobalOnly(key))editor.change(key,typeof value==='object'?JSON.stringify(value):String(value));
  }catch(e){setError(e.message);}finally{event.target.value='';}
 };
 return <section className="policy-transfer"><button className="config-button" disabled={editor.busy} onClick={exportValues}>Ekspor aturan efektif</button><button className="config-button" disabled={editor.busy} onClick={()=>input.current.click()}>Impor ke perubahan lokal</button><input ref={input} type="file" accept=".json,application/json" hidden onChange={importValues}/><p>File tidak memuat rahasia integrasi. Impor tetap harus disimpan, ditinjau, dan diterbitkan.</p>{error&&<p role="alert" className="policy-error">{error}</p>}</section>;
}
