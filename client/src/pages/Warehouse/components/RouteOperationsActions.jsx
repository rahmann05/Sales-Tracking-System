import {useApp} from '../../../context/AppContext';
import {canTripAction} from '../../../../../shared/trip-permissions.mjs';
import {DepartureChecklistSummary} from '../../../shared/components/common/DepartureChecklistSummary';
import {SpvAuditQuestion} from '../../Supervisor/components/SpvAuditQuestion';
import {preparationStages,preparationReady,departureItems} from '../../../../../shared/warehouse-policy.mjs';
import {useUnsavedNavigation} from '../../../shared/hooks/useUnsavedNavigation';
import React,{useState,useEffect} from 'react';
import {deliveryApi,vehiclesApi} from '../../../services/api';
const labels={PICK:'Konfirmasi penyiapan',CHECK:'Konfirmasi pemeriksaan',LOAD:'Serah terima muatan',START:'Berangkat',RETURN:'Kembali gudang',CLOSE:'Tutup trip',HOLD:'Tahan trip',RESUME:'Lanjutkan trip',CANCEL:'Batalkan trip',RESCHEDULE:'Jadwal / penugasan ulang',LEGACY_ODOMETER:'Rekonsiliasi odometer trip lama'};
export function RouteOperationsActions({route,onChanged,driver=false}){
  const {user}=useApp();
  const [departureAnswers,setDepartureAnswers]=useState({});const [action,setAction]=useState('');const [note,setNote]=useState('');const [quantities,setQuantities]=useState({});const [cartons,setCartons]=useState('');const [odometer,setOdometer]=useState('');
  const [fuel,setFuel]=useState('');const [docs,setDocs]=useState(false);const [start,setStart]=useState('');const [end,setEnd]=useState('');const [vehicle,setVehicle]=useState(route.vehicleId);const [person,setPerson]=useState(route.driverId);const [options,setOptions]=useState({vehicles:[],drivers:[]});const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const dirty=Boolean(action&&(note||cartons||odometer||fuel||docs||start||end||Object.keys(quantities).length||Object.keys(departureAnswers).length));
  useUnsavedNavigation(dirty,busy);
  const changeAction=next=>{if(!busy&&(!dirty||window.confirm('Isian tindakan belum disimpan. Ganti tindakan?'))){setAction(next);setNote('');setError('');setQuantities({});setCartons('');setOdometer('');setFuel('');setDocs(false);setDepartureAnswers({});setStart('');setEnd('');}};
  useEffect(()=>{if(action!=='RESCHEDULE')return;let active=true;Promise.all([vehiclesApi.getAll(),deliveryApi.getDrivers()]).then(([v,d])=>{if(active)setOptions({vehicles:v.data,drivers:d.data});}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[action]);
  if(route.closedAt||route.cancelledAt)return <><DepartureChecklistSummary route={route}/><p className="text-sm">{route.closedAt?'Trip ditutup':'Trip dibatalkan'}</p></>;
  const policy={...route.policySnapshot?.values,...route.policySnapshot?.warehouseEvidence?.values},stages=preparationStages(policy);
  const actions=[];
  if(!driver){
    if(route.status==='DRAFT'&&!route.onHold)actions.push(...stages.filter(stage=>!route.preparation?.[stage]).slice(0,1));
    if(['DRAFT','READY'].includes(route.status)&&!route.departedAt&&!route.stops.some(s=>s.arrivedAt||s.status!=='PENDING'))actions.push('RESCHEDULE','CANCEL');
    actions.push(route.onHold?'RESUME':'HOLD');
    if(route.odometerStart==null&&['IN_TRANSIT','COMPLETED','PARTIAL'].includes(route.status))actions.push('LEGACY_ODOMETER');
    if(route.returnedAt)actions.push('CLOSE');
  }
  if(route.status==='READY'&&preparationReady(route)&&!route.onHold)actions.push('START');
  if(['COMPLETED','PARTIAL'].includes(route.status)&&!route.returnedAt)actions.push('RETURN');
  const prep=['PICK','CHECK','LOAD'].includes(action);
  const submit=async e=>{e.preventDefault();if(!canTripAction(user,action)){setError('Izin tindakan berubah. Muat ulang halaman.');return;}setBusy(true);setError('');try{
    await deliveryApi.routeAction(route.id,{action,note,...(action==='START'?{departureAnswers}:{}),...(prep?{cartons:Number(cartons),quantities}:{}),...(['START','RETURN','LEGACY_ODOMETER'].includes(action)?{...(odometer!==''?{odometer:Number(odometer)}:{})}:{}),...(action==='RETURN'&&fuel!==''?{fuelLiters:Number(fuel)}:{}),...(action==='CLOSE'?{documentsReturned:docs}:{}),...(action==='RESCHEDULE'?{vehicleId:vehicle,driverId:person,plannedStartAt:new Date(`${start}:00+07:00`).toISOString(),plannedEndAt:new Date(`${end}:00+07:00`).toISOString()}:{})});
    setAction('');setNote('');window.dispatchEvent(new Event('delivery:changed'));await onChanged();
  }catch(e){setError(e.message);}finally{setBusy(false);}};
  return <div className="space-y-3"><DepartureChecklistSummary route={route}/>{route.status==='READY'&&!preparationReady(route)&&<p className="text-amber-700">Trip lama belum memiliki bukti loading. Kepala gudang perlu menjadwal ulang dan memverifikasi persiapannya sebelum berangkat.</p>}<div className="flex flex-wrap gap-2">{actions.filter(a=>canTripAction(user,a)).map(a=><button type="button" className="min-h-11 px-3 border rounded-xl hover:bg-primary/10" key={a} disabled={busy} onClick={()=>changeAction(a)}>{labels[a]}</button>)}</div>
    {action&&<form className="p-4 border rounded-xl space-y-3" onSubmit={submit}><h4 className="font-bold">{labels[action]} · {route.code}</h4><fieldset disabled={busy} className="space-y-3">
      {prep&&<><p className="text-sm">Isi hasil aktual pemeriksaan fisik. Jika berbeda, catat masalah lalu batalkan/jadwal ulang persiapan sebelum konfirmasi.</p><label className="block">Karton aktual (rencana {route.totalCartons})<input className="form-input block w-full" type="number" min="0" required value={cartons} onChange={e=>setCartons(e.target.value)}/></label>{route.stops.map(s=><fieldset key={s.id} className="border rounded p-3"><legend>{s.outlet?.name}</legend>{s.allocatedItems.map(i=>{const key=`${s.id}:${i.lineId}`;return <label key={key} className="block mb-2">{s.packingList?.items.find(p=>p.lineId===i.lineId)?.name||i.lineId} (rencana {i.quantity})<input className="form-input block w-full" type="number" min="0" required value={quantities[key]??''} onChange={e=>setQuantities({...quantities,[key]:Number(e.target.value)})}/></label>;})}</fieldset>)}</>}
      {['START','RETURN','LEGACY_ODOMETER'].includes(action)&&<label className="block">Odometer {action==='RETURN'?'akhir':'awal'} aktual (km)<input type="number" min="0" step="0.1" className="form-input block w-full" required={policy.TRIP_REQUIRE_ODOMETER!==false||action==='LEGACY_ODOMETER'} value={odometer} onChange={e=>setOdometer(e.target.value)}/></label>}
      {action==='START'&&!!departureItems(policy).length&&<fieldset className="space-y-3"><legend>Checklist sebelum keberangkatan</legend><p className="text-sm">{policy.TRIP_BLOCK_FAILED_DEPARTURE_CHECKLIST!==false?'Kondisi gagal perlu diperbaiki sebelum berangkat.':'Kondisi gagal tetap disimpan dalam riwayat keberangkatan.'}</p>{departureItems(policy).map(item=><SpvAuditQuestion policyValues={policy} key={item.key} item={item} value={departureAnswers[item.key]} evidence={departureAnswers._evidence?.[item.key]} onChange={value=>setDepartureAnswers(v=>({...v,[item.key]:value}))} onEvidence={proof=>setDepartureAnswers(v=>({...v,_evidence:{...v._evidence,[item.key]:proof}}))}/>)}</fieldset>}
      {action==='RETURN'&&<label className="block">BBM aktual (liter, opsional)<input className="form-input block w-full" type="number" min="0" step="0.1" value={fuel} onChange={e=>setFuel(e.target.value)}/></label>}
      {action==='CLOSE'&&<label className="flex gap-2"><input type="checkbox" required={policy.TRIP_REQUIRE_DOCUMENT_RETURN!==false} checked={docs} onChange={e=>setDocs(e.target.checked)}/>Bukti dan dokumen pengiriman sudah direkonsiliasi</label>}
      {action==='RESCHEDULE'&&<><label className="block">Jadwal berangkat WIB<input className="form-input block w-full" type="datetime-local" required value={start} onChange={e=>setStart(e.target.value)}/></label><label className="block">Target kembali WIB<input className="form-input block w-full" type="datetime-local" required value={end} onChange={e=>setEnd(e.target.value)}/></label><label className="block">Kendaraan<select className="form-input block w-full" value={vehicle} onChange={e=>setVehicle(e.target.value)}>{options.vehicles.map(v=><option key={v.id} value={v.id}>{v.name} · {v.condition}</option>)}</select></label><label className="block">Supir<select className="form-input block w-full" value={person} onChange={e=>setPerson(e.target.value)}>{options.drivers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label><p className="text-sm">Perubahan penugasan/jadwal mengulang konfirmasi persiapan dan loading.</p></>}
      <label className="block">Catatan / alasan<textarea required maxLength={2000} className="form-input block w-full" value={note} onChange={e=>setNote(e.target.value)}/></label><div className="flex gap-2"><button className="min-h-11 px-4 bg-primary text-on-primary rounded-xl" type="submit">{busy?'Menyimpan…':'Simpan tindakan'}</button><button className="min-h-11 px-4 border rounded-xl" type="button" onClick={()=>changeAction('')}>Batal</button></div>
    </fieldset>{error&&<p role="alert" className="text-red-600">{error}</p>}</form>}
  </div>;
}
