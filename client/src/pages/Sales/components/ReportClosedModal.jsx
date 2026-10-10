import {useFormDraft} from '../../../shared/hooks/useFormDraft';
import {SalesDialog} from './SalesDialog';
import {useApp} from '../../../context/AppContext';
import {DeviceCameraCapture} from '../../../shared/components/camera/DeviceCameraCapture';
import React,{useState} from 'react';
export const ReportClosedModal=({stop,onClose,onSubmitReport})=>{
 const {settings}=useApp(),draft=useFormDraft('ReportClosedModal:'+stop?.id,{closedReason:'Toko Gembok / Tutup Permanen'});
 const [photo,setPhoto]=useState(null),[saving,setSaving]=useState(false),[error,setError]=useState('');
 if(!stop)return null;
 const submit=async()=>{
  if(saving)return;setError('');
  if(settings.CLOSED_OUTLET_REQUIRE_PHOTO&&!photo){setError('Foto toko tutup wajib diambil.');return;}
  if(settings.CLOSED_OUTLET_REQUIRE_REASON&&draft.value.closedReason.trim().length<5){setError('Alasan toko tutup minimal lima karakter.');return;}
  setSaving(true);try{await onSubmitReport({stopId:stop.id,reason:draft.value.closedReason,photoUrl:photo||null});draft.clear();}catch(e){setError(e.message);}finally{setSaving(false);}
 };
 return <SalesDialog title="Laporkan toko tutup" description={stop.outletName} onClose={onClose} busy={saving} dirty={draft.dirty||!!photo} restored={draft.restored} draftNotice={draft.restored||draft.policyChanged?draft.restoreMessage:''} draftError={draft.storageError}>
 {error&&<p className="app-error" role="alert">{error}</p>}
 <p className="sales-note">Laporan ini tidak menonaktifkan outlet dan tidak membuktikan toko tutup permanen. {settings.ALLOW_CONTINUE_PENDING_CLOSED===false?'Tunggu keputusan sebelum melanjutkan kunjungan berikutnya.':'Anda dapat melanjutkan sesuai aturan urutan kunjungan.'}</p>
 <fieldset disabled={saving} className="app-form"><label className="app-field">Alasan toko tidak dapat dikunjungi<select value={draft.value.closedReason} onChange={e=>draft.field('closedReason')(e.target.value)}><option value="Toko Gembok / Tutup Permanen">Toko terkunci / tutup saat dikunjungi</option><option value="Pemilik Tidak di Tempat">Pemilik tidak di tempat</option><option value="Toko Renovasi">Toko sedang renovasi</option><option value="Akses Terhalang">Akses jalan terhalang</option></select></label>
 <DeviceCameraCapture onCapture={setPhoto} capturedPhoto={photo} onRetake={()=>setPhoto(null)} requireGps={false} enforceGeofence={false} photoRequired={settings.CLOSED_OUTLET_REQUIRE_PHOTO===true} facingModeDefault="environment" policyValues={settings} outletName={stop.outletName} buttonLabel="Foto kondisi toko"/>
 <button type="button" className="app-button app-button-primary" onClick={submit}>{saving?'Mengirim…':'Kirim laporan untuk keputusan'}</button></fieldset></SalesDialog>;
};
