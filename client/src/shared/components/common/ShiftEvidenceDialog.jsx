import React,{useState,useCallback} from 'react';
import {NativeDialog} from './NativeDialog';
import {DeviceCameraCapture} from '../camera/DeviceCameraCapture';
import {shiftActionRules} from '../../../../../shared/shift-policy.mjs';

export function ShiftEvidenceDialog({action,dateKey,values,busy,error,onClose,onConfirm}){
 const [capture,setCapture]=useState(null),[notes,setNotes]=useState('');
 const rules=shiftActionRules(action,dateKey,values),needsReason=rules.handling==='REASON';
 const onLocation=useCallback(gps=>setCapture(current=>({...current,gps})),[]);
 const blocked=rules.handling==='BLOCK';
 const ready=!blocked&&(!rules.photoRequired||capture?.photoUrl)&&(!rules.gpsRequired||capture?.gps)&&(!needsReason||notes.trim().length>=5);
 const submit=async()=>{
  const ok=await onConfirm({photoUrl:capture?.photoUrl,latitude:capture?.gps?.lat,longitude:capture?.gps?.lng,accuracy:capture?.gps?.accuracy,observedAt:capture?.gps?.observedAt,notes:notes.trim()||undefined});
  if(ok)onClose();
 };
 return <NativeDialog open title={action==='SHIFT_IN'?'Mulai shift':'Selesaikan shift'} onClose={onClose} busy={busy}>
  <div className="grid gap-4">
   <p className="text-sm">Tanggal kerja {dateKey} · Jadwal {values.SHIFT_START_TIME||'08:00'}–{values.SHIFT_END_TIME||'17:00'} WIB. {action==='SHIFT_OUT'?'Mengikuti aturan saat shift dimulai.':''}</p>
   {rules.exception&&<p role="status" className="text-sm">{rules.exception==='EARLY_FINISH'?'Anda menyelesaikan shift sebelum jadwal.':'Tanggal ini di luar hari kerja shift.'} {blocked?'Tindakan diblokir oleh aturan shift.':needsReason?'Alasan minimal 5 karakter wajib diisi.':'Tetap dapat dilanjutkan.'}</p>}
   {!blocked&&values.SHIFT_ATTENDANCE_MODE!=='OPTIONAL'&&(action==='SHIFT_IN'||values.SHIFT_ATTENDANCE_MODE==='IN_OUT')&&<DeviceCameraCapture policyValues={values} photoRequired={rules.photoRequired} requireGps={rules.gpsRequired} enforceGeofence={false} capturedPhoto={capture?.photoUrl} onCapture={(photoUrl,gps)=>setCapture({photoUrl,gps})} onLocationChange={rules.photoRequired?undefined:onLocation} onRetake={()=>setCapture(null)} outletName="Presensi shift" buttonLabel="Ambil foto shift"/>}
   <p className="text-sm">Foto {rules.photoRequired?'wajib':'opsional'} · GPS {rules.gpsRequired?'wajib':'opsional'}. {values.SHIFT_ATTENDANCE_MODE!=='IN_OUT'&&action==='SHIFT_OUT'?'Penyelesaian kegiatan tidak membuat bukti OUT.':''}</p>
   <label className="grid gap-2 text-sm">Alasan / catatan {needsReason?'(wajib)':'(opsional)'}<textarea className="form-input" maxLength={4000} rows={3} value={notes} onChange={e=>setNotes(e.target.value)} disabled={busy||blocked}/></label>
   {error&&<p role="alert" className="app-error">{error}</p>}
   <div className="app-actions"><button type="button" className="app-button" disabled={busy} onClick={onClose}>Batal</button><button type="button" className="app-button" disabled={busy||!ready} onClick={submit}>{busy?'Menyimpan…':'Konfirmasi'}</button></div>
  </div>
 </NativeDialog>;
}
