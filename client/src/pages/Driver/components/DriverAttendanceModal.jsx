import {GuardedDialog} from '../../../shared/components/common/GuardedDialog';
import {unitDescription} from '../../../../../shared/product-units.mjs';
import React,{useState} from 'react';
import { useApp } from '../../../context/AppContext';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
export const DriverAttendanceModal=({stop,type,onClose,onSubmitAttendance,policy={}})=>{
  const {settings:runtime}=useApp();
  const settings={...runtime,...policy};
  const [withoutCheckout,setWithoutCheckout]=useState(false),[checkoutReason,setCheckoutReason]=useState('');
  const allowWithoutCheckout=type!=='absen_in'&&settings.DELIVERY_ATTENDANCE_MODE==='IN_OUT'&&policy.DELIVERY_ALLOW_RESULT_WITHOUT_OUT===true;
  const logicalResult=type!=='absen_in'&&(settings.DELIVERY_ATTENDANCE_MODE!=='IN_OUT'||allowWithoutCheckout&&withoutCheckout);
  const requireGps=!logicalResult&&settings.DELIVERY_REQUIRE_GPS!==false;
  const [notes,setNotes]=useState('');const [photo,setPhoto]=useState(null);const [gps,setGps]=useState(null);
  const [reason,setReason]=useState('');const [cartons,setCartons]=useState(stop.allocatedCartons);const [rejected,setRejected]=useState({});
  const [invoiceRejected,setInvoiceRejected]=useState({});
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const total=stop.allocatedCartons;const partial=type==='rejected'&&Number(cartons)>0&&Number(cartons)<total;
  const submit=async e=>{
    e.preventDefault();if(busy)return;
    if(requireGps&&(!gps||!Number.isFinite(gps.lat)||!Number.isFinite(gps.lng))){setError('Ambil bukti dengan GPS aktif');return;}
    if(settings.DELIVERY_REQUIRE_PHOTO&&!photo){setError('Foto bukti wajib');return;}
    if(withoutCheckout&&checkoutReason.trim().length<5){setError('Isi alasan tidak tersedia bukti keluar, minimal 5 karakter');return;}
    if(type==='rejected'&&(!reason.trim()||!Number.isInteger(Number(cartons))||Number(cartons)<1||Number(cartons)>total)){setError('Isi alasan dan jumlah karton penolakan yang valid');return;}
    setBusy(true);setError('');
    try{await onSubmitAttendance(stop.id,{logicalResult,type:type==='absen_in'?'IN':'OUT',latitude:gps?.lat,longitude:gps?.lng,accuracy:gps?.accuracy,observedAt:gps?.observedAt,photoUrl:photo||undefined,notes,
      ...(type==='absen_in'?{}:{result:{status:type==='delivered'?'DELIVERED':partial?'PARTIAL_REJECT':'REJECTED',rejectReason:reason,...(allowWithoutCheckout&&withoutCheckout?{missingCheckoutReason:checkoutReason.trim()}:{}),rejectedCartons:Number(cartons),rejectedInvoices:Object.entries(invoiceRejected).filter(([,q])=>Number(q)>0).map(([invoiceId,q])=>({invoiceId,cartons:Number(q)})),rejectedItems:Object.entries(rejected).filter(([,q])=>Number(q)>0).map(([lineId,q])=>({lineId,quantity:Number(q)}))}})});}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <GuardedDialog open title={type==='absen_in'?'Bukti kedatangan':type==='rejected'?'Penolakan penuh / sebagian':'Penerimaan penuh'} onClose={onClose} busy={busy} dirty={!!(notes||photo||reason||withoutCheckout||checkoutReason||Object.keys(rejected).length||Object.keys(invoiceRejected).length||Number(cartons)!==total)} className="logistics-dialog"><form className="p-5 space-y-4" onSubmit={submit}><fieldset disabled={busy} className="space-y-4">
    <div className="flex items-center justify-between"><h3 className="font-bold">{type==='absen_in'?'Kedatangan':'Hasil pengiriman'} · {stop.outlet?.name}</h3></div>
    <p className="text-sm">{stop.packingList?.code} · Muatan {total} karton</p>
    {allowWithoutCheckout&&<section className="rounded-xl border border-border-glass p-4 space-y-3"><label className="flex items-center gap-3 min-h-11"><input type="checkbox" checked={withoutCheckout} onChange={e=>setWithoutCheckout(e.target.checked)}/>Bukti keluar tidak dapat diambil</label>{withoutCheckout&&<><p className="text-sm text-on-surface-variant">Hasil barang disimpan tanpa presensi keluar. Gudang akan memeriksa alasan Anda. Kewajiban foto hasil tetap berlaku.</p><label className="block">Alasan bukti keluar tidak tersedia<textarea className="form-input block w-full" required minLength={5} maxLength={2000} value={checkoutReason} onChange={e=>setCheckoutReason(e.target.value)}/></label></>}</section>}
    <DeviceCameraCapture photoRequired={settings.DELIVERY_REQUIRE_PHOTO!==false} capturedPhoto={photo} onCapture={(p,g)=>{setPhoto(p);setGps(g);}} onRetake={()=>{setPhoto(null);setGps(null);}} requireGps={requireGps} onLocationChange={settings.DELIVERY_REQUIRE_PHOTO?undefined:setGps} enforceGeofence={!logicalResult&&settings.DELIVERY_REQUIRE_GEOFENCE} targetLat={!logicalResult&&settings.DELIVERY_REQUIRE_GEOFENCE?stop.outlet?.latitude:null} targetLng={!logicalResult&&settings.DELIVERY_REQUIRE_GEOFENCE?stop.outlet?.longitude:null} maxRadiusMeters={stop.outlet?.radiusMeters||settings.ATTENDANCE_RADIUS_METERS} facingModeDefault="environment" />
    {type==='rejected'&&<><p>Isi karton yang ditolak. Jika jumlahnya lebih kecil dari muatan, hasil dicatat sebagai penerimaan sebagian dan rincian barang serta faktur wajib dicocokkan.</p><label className="block">Alasan penolakan<textarea className="block w-full border rounded-xl p-2" required value={reason} onChange={e=>setReason(e.target.value)}/></label><label className="block">Karton ditolak<input type="number" className="block w-full border rounded-xl p-2" min="1" max={total} required value={cartons} onChange={e=>setCartons(e.target.value)}/></label>
      {partial&&<fieldset className="space-y-2"><legend>Jumlah barang ditolak</legend>{(stop.allocatedItems||[]).map(item=><label className="flex justify-between gap-2" key={item.lineId}><span>{stop.packingList?.items?.find(i=>i.lineId===item.lineId)?.name||item.lineId} (muatan {item.quantity} {unitDescription(stop.packingList?.items?.find(i=>i.lineId===item.lineId))})</span><input aria-label="Jumlah barang ditolak" type="number" min="0" max={item.quantity} className="w-24 border rounded p-2" value={rejected[item.lineId]||0} onChange={e=>setRejected({...rejected,[item.lineId]:e.target.value})}/></label>)}</fieldset>}</>}
    {partial&&(stop.allocatedInvoices||[]).map(i=><label key={i.invoiceId} className="block">Karton ditolak faktur {stop.packingList?.invoices?.find(v=>v.id===i.invoiceId)?.invoiceNumber||i.invoiceId}<input type="number" min="0" max={i.cartons} className="form-input block w-full" value={invoiceRejected[i.invoiceId]||0} onChange={e=>setInvoiceRejected({...invoiceRejected,[i.invoiceId]:e.target.value})}/></label>)}
    <label className="block">Catatan<textarea className="block w-full border rounded-xl p-2" value={notes} onChange={e=>setNotes(e.target.value)}/></label>
    {error&&<p role="alert" className="text-red-600">{error}</p>}<button type="submit" disabled={busy} className="w-full p-3 rounded-xl bg-primary text-on-primary">{busy?'Menyimpan…':logicalResult?'Simpan hasil':'Simpan bukti'}</button>
  </fieldset></form></GuardedDialog>;
};
