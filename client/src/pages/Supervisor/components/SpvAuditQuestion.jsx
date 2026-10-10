import React from 'react';
import {auditFailed} from '../../../../../shared/supervision-checklist.mjs';
import {DeviceCameraCapture} from '../../../shared/components/camera/DeviceCameraCapture';

export function SpvAuditQuestion({item,value,evidence={},onChange,onEvidence,policyValues=null}){
 const type=item.type||'BOOLEAN',id=`audit-${item.key}`,failed=auditFailed(item,value);
 return <fieldset className="grid gap-3 p-4 rounded-xl bg-surface-variant/30 border border-border-glass text-sm">
  <legend className="font-semibold px-1">{item.label}{item.required?' · wajib':''}</legend>
  <label htmlFor={id} className="sr-only">{item.label}</label>
  {type==='TEXT'?<textarea id={id} className="config-input" rows={3} maxLength={4000} value={value??''} onChange={e=>onChange(e.target.value)}/>:type==='NUMBER'?<input id={id} className="config-input min-h-11" type="number" step="any" min={item.min} max={item.max} value={value??''} onChange={e=>onChange(e.target.value===''?null:Number(e.target.value))}/>:<select id={id} className="config-input min-h-11" value={value==null?'':String(value)} onChange={e=>onChange(e.target.value===''?null:type==='BOOLEAN'?e.target.value==='true':e.target.value)}>
   <option value="">Belum diisi</option>{type==='BOOLEAN'?<><option value="true">Ya</option><option value="false">Tidak</option></>:item.options.map(option=><option key={option} value={option}>{option}</option>)}
  </select>}
  {type==='NUMBER'&&(item.min!==undefined||item.max!==undefined)&&<p className="text-xs text-on-surface-variant">Rentang: {item.min??'tanpa minimum'} — {item.max??'tanpa maksimum'}</p>}
  {failed&&<>
   <p className="text-sm font-medium text-amber-700">Kondisi perlu perbaikan</p>
   <label className="grid gap-2">Alasan / penjelasan{item.requireFailureReason?' · wajib':' · opsional'}<textarea className="config-input" rows={2} maxLength={2000} value={evidence.reason||''} onChange={e=>onEvidence({...evidence,reason:e.target.value})}/></label>
   {item.requireFailurePhoto&&<DeviceCameraCapture policyValues={policyValues} requireGps={false} photoRequired capturedPhoto={evidence.photoUrl} onCapture={photoUrl=>onEvidence({...evidence,photoUrl})} onRetake={()=>onEvidence({...evidence,photoUrl:undefined})}/>}
  </>}
  {!failed&&(evidence.reason||evidence.photoUrl)&&<p className="text-xs text-on-surface-variant">Bukti sebelumnya tetap disertakan pada catatan audit.</p>}
 </fieldset>;
}
