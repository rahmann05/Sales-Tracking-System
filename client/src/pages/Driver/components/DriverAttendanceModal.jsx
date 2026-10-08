import {unitDescription} from '../../../../../shared/product-units.mjs';
import React,{useState} from 'react';
import { useApp } from '../../../context/AppContext';
import { DeviceCameraCapture } from '../../../shared/components/camera/DeviceCameraCapture';
export const DriverAttendanceModal=({stop,type,onClose,onSubmitAttendance})=>{
  const {settings}=useApp();
  const [notes,setNotes]=useState('');const [photo,setPhoto]=useState(null);const [gps,setGps]=useState(null);
  const [reason,setReason]=useState('');const [cartons,setCartons]=useState(stop.allocatedCartons);const [rejected,setRejected]=useState({});
  const [invoiceRejected,setInvoiceRejected]=useState({});
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const total=stop.allocatedCartons;const partial=type==='rejected'&&Number(cartons)>0&&Number(cartons)<total;
  const submit=async e=>{
    e.preventDefault();if(busy)return;
    if(!gps||!Number.isFinite(gps.lat)||!Number.isFinite(gps.lng)){setError('Ambil bukti dengan GPS aktif');return;}
    if(settings.DELIVERY_REQUIRE_PHOTO&&!photo){setError('Foto bukti wajib');return;}
    if(type==='rejected'&&(!reason.trim()||!Number.isInteger(Number(cartons))||Number(cartons)<1||Number(cartons)>total)){setError('Isi alasan dan jumlah karton penolakan yang valid');return;}
    setBusy(true);setError('');
    try{await onSubmitAttendance(stop.id,{type:type==='absen_in'?'IN':'OUT',latitude:gps.lat,longitude:gps.lng,photoUrl:photo||undefined,notes,
      ...(type==='absen_in'?{}:{result:{status:type==='delivered'?'DELIVERED':partial?'PARTIAL_REJECT':'REJECTED',rejectReason:reason,rejectedCartons:Number(cartons),rejectedInvoices:Object.entries(invoiceRejected).filter(([,q])=>Number(q)>0).map(([invoiceId,q])=>({invoiceId,cartons:Number(q)})),rejectedItems:Object.entries(rejected).filter(([,q])=>Number(q)>0).map(([lineId,q])=>({lineId,quantity:Number(q)}))}})});}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3"><form role="dialog" aria-modal="true" aria-label="Bukti pengiriman" className="bg-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto p-4 space-y-4" onSubmit={submit}>
    <div className="flex items-center justify-between"><h3 className="font-bold">{type==='absen_in'?'Kedatangan':'Hasil pengiriman'} · {stop.outlet?.name}</h3><button type="button" disabled={busy} onClick={onClose} aria-label="Tutup">✕</button></div>
    <p className="text-sm">{stop.packingList?.code} · Muatan {total} karton</p>
    <DeviceCameraCapture capturedPhoto={photo} onCapture={(p,g)=>{setPhoto(p);setGps(g);}} onRetake={()=>{setPhoto(null);setGps(null);}} requireGps targetLat={settings.DELIVERY_REQUIRE_GEOFENCE?stop.outlet?.latitude:null} targetLng={settings.DELIVERY_REQUIRE_GEOFENCE?stop.outlet?.longitude:null} maxRadiusMeters={stop.outlet?.radiusMeters||settings.ATTENDANCE_RADIUS_METERS} facingModeDefault="environment" />
    {type==='rejected'&&<><label className="block">Alasan penolakan<textarea className="block w-full border rounded-xl p-2" required value={reason} onChange={e=>setReason(e.target.value)}/></label><label className="block">Karton ditolak<input type="number" className="block w-full border rounded-xl p-2" min="1" max={total} required value={cartons} onChange={e=>setCartons(e.target.value)}/></label>
      {partial&&<fieldset className="space-y-2"><legend>Jumlah barang ditolak</legend>{(stop.allocatedItems||[]).map(item=><label className="flex justify-between gap-2" key={item.lineId}><span>{stop.packingList?.items?.find(i=>i.lineId===item.lineId)?.name||item.lineId} (muatan {item.quantity} {unitDescription(stop.packingList?.items?.find(i=>i.lineId===item.lineId))})</span><input aria-label="Jumlah barang ditolak" type="number" min="0" max={item.quantity} className="w-24 border rounded p-2" value={rejected[item.lineId]||0} onChange={e=>setRejected({...rejected,[item.lineId]:e.target.value})}/></label>)}</fieldset>}</>}
    {partial&&(stop.allocatedInvoices||[]).map(i=><label key={i.invoiceId} className="block">Karton ditolak faktur {stop.packingList?.invoices?.find(v=>v.id===i.invoiceId)?.invoiceNumber||i.invoiceId}<input type="number" min="0" max={i.cartons} className="form-input block w-full" value={invoiceRejected[i.invoiceId]||0} onChange={e=>setInvoiceRejected({...invoiceRejected,[i.invoiceId]:e.target.value})}/></label>)}
    <label className="block">Catatan<textarea className="block w-full border rounded-xl p-2" value={notes} onChange={e=>setNotes(e.target.value)}/></label>
    {error&&<p role="alert" className="text-red-600">{error}</p>}<button type="submit" disabled={busy} className="w-full p-3 rounded-xl bg-primary text-on-primary">{busy?'Menyimpan…':'Simpan bukti'}</button>
  </form></div>;
};
