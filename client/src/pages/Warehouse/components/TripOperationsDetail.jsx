import {DeliveryReceiptSummary} from '../../../shared/components/common/DeliveryReceiptSummary';
import {DepartureChecklistSummary} from '../../../shared/components/common/DepartureChecklistSummary';
import React,{useEffect,useRef} from 'react';
import {useWorkspaceState} from '../../../shared/hooks/useWorkspaceState';
import {tripNextWork} from '../../../../../shared/operational-attention.mjs';
import {RouteOperationsActions} from './RouteOperationsActions';
import {PreparationTasks} from './PreparationTasks';
import {ReturnAssignment} from './ReturnAssignment';
import {ReturnReceiptAction} from './ReturnReceiptAction';
import {OperationalIssues} from './OperationalIssues';
import {deliveryRouteLabel,deliveryStopLabel} from '../deliveryLabels';
import {stopDestinationOutlet} from '../../../../../shared/driver-workspace.mjs';
import {outletOperationalPoint} from '../../../../../shared/outlet-location.mjs';
const stamp=value=>value?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Belum tercatat';
const resolveStopPoint=stop=>{const raw=stopDestinationOutlet(stop);const op=outletOperationalPoint(raw);const lat=op?.latitude??raw?.latitude;const lng=op?.longitude??raw?.longitude;return lat!=null&&lng!=null&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))?{latitude:Number(lat),longitude:Number(lng)}:null;};
export function TripOperationsDetail({route,people,issues,canManage,onChanged}){
  const r=route,work=tripNextWork(r),[selectedStop]=useWorkspaceState('deliveryStop',''),stopRefs=useRef({});
  useEffect(()=>{const element=stopRefs.current[selectedStop];if(element){element.scrollIntoView({block:'center',behavior:'smooth'});element.focus({preventScroll:true});}},[selectedStop,r.id]);
  return <section className="admin-panel admin-trip-detail" aria-label={`Detail trip ${r.code}`}>
    <header className="admin-panel-heading"><div><p className="admin-eyebrow">Trip terpilih</p><h2>{r.code} · {r.vehicle?.code||'Kendaraan belum ditetapkan'}</h2><p>{r.driver?.name||'Driver belum ditetapkan'} · {deliveryRouteLabel(r)}</p></div><strong>{r.progress.resolved}/{r.progress.total} stop diproses</strong></header>
    {work&&<p className="admin-feedback" role="status"><strong>Langkah berikutnya: {work.nextAction}.</strong> {work.explanation}</p>}
    <div className="admin-trip-summary"><div><span>Rencana perjalanan</span><strong>{stamp(r.plannedStartAt)}</strong><small>Sampai {stamp(r.plannedEndAt)}</small></div><div><span>Berangkat / kembali</span><strong>{stamp(r.departedAt)}</strong><small>Kembali {stamp(r.returnedAt)}</small></div><div><span>Jarak rencana / aktual</span><strong>{r.totalDistanceKm??'—'} / {r.actualDistanceKm??'—'} km</strong><small>BBM aktual {r.actualFuelLiters??'—'} liter</small></div><div><span>Diterima penuh</span><strong>{r.progress.delivered} / {r.progress.total} stop</strong><small>Penyelesaian {r.progress.completionPercent}%</small></div></div>
    {r.gpsFlag&&<p className="admin-feedback error" role="alert"><strong>FLAG ADMIN — POSISI GPS ARMADA TIDAK TERKINI:</strong> {r.gpsFlag.message}</p>}
    {r.alerts.length>0&&<p className="admin-feedback error" role="status">{r.alerts.join(' · ')}</p>}
    {!canManage&&<DepartureChecklistSummary route={r}/>}
    <div className="admin-trip-work"><section><h3>Kontrol perjalanan</h3>{canManage?<RouteOperationsActions route={r} onChanged={onChanged}/>:<p>Kontrol perjalanan mengikuti hak akses pengguna.</p>}<PreparationTasks route={r} people={people} canManage={canManage} onChanged={onChanged}/></section><section><h3>Masalah / keluhan perjalanan</h3><OperationalIssues issues={issues.filter(issue=>issue.routeId===r.id)} people={people} reference={r.closedAt||r.cancelledAt?null:{routeId:r.id}} onChanged={onChanged}/></section></div>
    <section className="admin-trip-stops"><h3>Urutan pengiriman</h3>{r.stops.map(stop=>{const pt=resolveStopPoint(stop);return <article key={stop.id} tabIndex={-1} ref={element=>{stopRefs.current[stop.id]=element;}} aria-label={`Tujuan ${stop.sequence}: ${stop.outlet?.name}`} style={selectedStop===stop.id?{outline:'2px solid var(--color-primary, #0066cc)',outlineOffset:4}:undefined}><div className="admin-stop-number">{stop.sequence}</div><div className="admin-stop-content"><header><h4>{stop.outlet?.name||'Outlet belum tercatat'}</h4><span className={`admin-status admin-status-${stop.status?.toLowerCase()}`}>{deliveryStopLabel(stop.status)}</span></header><p>{stop.allocatedCartons} karton · Ditolak {stop.rejectedCartons||0}{stop.rejectReason?` · ${stop.rejectReason}`:''}</p><p className="text-xs">Long, Lat: {pt?<a href={`https://www.google.com/maps/search/?api=1&query=${pt.latitude},${pt.longitude}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">{pt.longitude.toFixed(6)}, {pt.latitude.toFixed(6)}</a>:'Titik belum tersedia'}</p><small>Tiba {stamp(stop.arrivedAt)} · Selesai {stamp(stop.completedAt)}</small>{stop.photoUrl&&<details><summary>Lihat bukti pengiriman</summary><img className="max-h-72 rounded-xl" src={stop.photoUrl} alt={`Bukti pengiriman ${stop.outlet?.name}`}/></details>}<DeliveryReceiptSummary stop={stop}/><ReturnAssignment key={r.preparation?.returnTasks?.[stop.id]?.revision||0} stop={stop} task={r.preparation?.returnTasks?.[stop.id]} people={people} onChanged={onChanged}/><ReturnReceiptAction assignment={r.preparation?.returnTasks?.[stop.id]} stop={stop} onReceived={onChanged}/></div></article>;})}</section>
    <details className="admin-trip-history"><summary>Riwayat tindakan ({r.history.length})</summary>{r.history.map((item,index)=><p key={index}>{stamp(item.at)} · {item.actorName||item.actorId} · {item.action} · {item.detail?.note}</p>)}</details>
  </section>;
}

