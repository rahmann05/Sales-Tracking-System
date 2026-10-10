import React,{useState} from 'react';
import {useApp} from '../../../context/AppContext';
import {NativeDialog} from '../../../shared/components/common/NativeDialog';
import {DeviceCameraCapture} from '../../../shared/components/camera/DeviceCameraCapture';
import {CAMERA_INPUT_LABELS,cameraInputPolicy} from '../../../../../shared/camera-input-policy.mjs';

export function RegistrationPhotoDialog({title,onClose,onCapture,outletName,latitude,longitude,division,policyValues,document:documentPhoto=false}){
 const {settings}=useApp(),[photo,setPhoto]=useState(null);
 const values=policyValues||settings,input=cameraInputPolicy(values.CAMERA_INPUT_MODE);
 const hasPoint=Number.isFinite(latitude)&&Number.isFinite(longitude);
 return <NativeDialog open title={title} onClose={onClose}>
  <div className="space-y-4">
   <div className="space-y-2 text-sm"><p><strong>{outletName||'Outlet baru'}</strong> · {division}</p><p>{CAMERA_INPUT_LABELS[input.mode]}. {documentPhoto?'Pastikan nama dan nomor dokumen terbaca. Foto tidak membuktikan keaslian dokumen.':'Pastikan papan nama dan bagian depan toko terlihat.'}</p>
    {!documentPhoto&&<p>Koordinat pada formulir: {hasPoint?`${latitude}, ${longitude}`:'belum tersedia'}. Titik ini terpisah dari foto dan bukan pengukuran GPS saat foto diambil.</p>}
    {input.upload&&<p>Gambar unggahan tidak dianggap sebagai foto yang baru diambil.</p>}
   </div>
   <DeviceCameraCapture policyValues={values} capturedPhoto={photo} onCapture={value=>setPhoto(value)} onRetake={()=>setPhoto(null)} photoRequired requireGps={false} enforceGeofence={false} facingModeDefault="environment" outletName={outletName||'Outlet baru'} buttonLabel={documentPhoto?'Ambil foto dokumen':'Ambil foto toko'}/>
   <div className="app-actions"><button type="button" className="app-button" onClick={onClose}>Batal</button><button type="button" className="app-button" disabled={!photo} onClick={()=>{onCapture(photo);onClose();}}>Gunakan foto</button></div>
  </div>
 </NativeDialog>;
}
