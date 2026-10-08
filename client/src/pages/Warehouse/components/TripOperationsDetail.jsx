import React from 'react';
import {RouteOperationsActions} from './RouteOperationsActions';
import {PreparationTasks} from './PreparationTasks';
import {ReturnReceiptAction} from './ReturnReceiptAction';
import {OperationalIssues} from './OperationalIssues';
import {deliveryRouteLabel,deliveryStopLabel} from '../deliveryLabels';
const stamp=value=>value?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Belum tercatat';
export function TripOperationsDetail({route,people,issues,canManage,onChanged}){
  const r=route;
  return <section className="admin-panel admin-trip-detail" aria-label={`Detail trip ${r.code}`}>
    <header className="admin-panel-heading"><div><p className="admin-eyebrow">Trip terpilih</p><h2>{r.code} · {r.vehicle?.code||'Kendaraan belum ditetapkan'}</h2><p>{r.driver?.name||'Driver belum ditetapkan'} · {deliveryRouteLabel(r)}</p></div><strong>{r.progress.resolved}/{r.progress.total} stop diproses</strong></header>
    <div className="admin-trip-summary"><div><span>Rencana perjalanan</span><strong>{stamp(r.plannedStartAt)}</strong><small>Sampai {stamp(r.plannedEndAt)}</small></div><div><span>Berangkat / kembali</span><strong>{stamp(r.departedAt)}</strong><small>Kembali {stamp(r.returnedAt)}</small></div><div><span>Jarak rencana / aktual</span><strong>{r.totalDistanceKm??'—'} / {r.actualDistanceKm??'—'} km</strong><small>BBM aktual {r.actualFuelLiters??'—'} liter</small></div><div><span>Diterima penuh</span><strong>{r.progress.delivered} / {r.progress.total} stop</strong><small>Penyelesaian {r.progress.completionPercent}%</small></div></div>
    {r.alerts.length>0&&<p className="admin-feedback error" role="status">{r.alerts.join(' · ')}</p>}
    <div className="admin-trip-work"><section><h3>Kontrol perjalanan</h3>{canManage?<RouteOperationsActions route={r} onChanged={onChanged}/>:<p>Kontrol perjalanan mengikuti hak akses pengguna.</p>}<PreparationTasks route={r} people={people} canManage={canManage} onChanged={onChanged}/></section><section><h3>Tindak lanjut trip</h3><OperationalIssues issues={issues.filter(issue=>issue.routeId===r.id)} people={people} reference={r.closedAt||r.cancelledAt?null:{routeId:r.id}} onChanged={onChanged}/></section></div>
    <section className="admin-trip-stops"><h3>Urutan pengiriman</h3>{r.stops.map(stop=><article key={stop.id}><div className="admin-stop-number">{stop.sequence}</div><div className="admin-stop-content"><header><h4>{stop.outlet?.name||'Outlet belum tercatat'}</h4><span className={`admin-status admin-status-${stop.status?.toLowerCase()}`}>{deliveryStopLabel(stop.status)}</span></header><p>{stop.allocatedCartons} karton · Ditolak {stop.rejectedCartons||0}{stop.rejectReason?` · ${stop.rejectReason}`:''}</p><small>Tiba {stamp(stop.arrivedAt)} · Selesai {stamp(stop.completedAt)}</small>{stop.photoUrl&&<details><summary>Lihat bukti pengiriman</summary><img className="max-h-72 rounded-xl" src={stop.photoUrl} alt={`Bukti pengiriman ${stop.outlet?.name}`}/></details>}<ReturnReceiptAction stop={stop} onReceived={onChanged}/></div></article>)}</section>
    <details className="admin-trip-history"><summary>Riwayat tindakan ({r.history.length})</summary>{r.history.map((item,index)=><p key={index}>{stamp(item.at)} · {item.actorName||item.actorId} · {item.action} · {item.detail?.note}</p>)}</details>
  </section>;
}
