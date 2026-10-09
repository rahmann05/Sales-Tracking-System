import React,{useState} from 'react';
import {LuRefreshCw,LuArrowRight,LuMapPin} from 'react-icons/lu';
import {useApp} from '../../context/AppContext';
import {deliveryApi} from '../../services/api';
import {useWorkspaceState} from '../../shared/hooks/useWorkspaceState';
import {useSelectedDetail} from '../../shared/hooks/useSelectedDetail';
import {TAB_IDS} from '../../constants/navigation';
import {useDriverTrips} from './useDriverTrips';
import {DriverStopCard} from './components/DriverStopCard';
import {DriverAttendanceModal} from './components/DriverAttendanceModal';
import {RouteOperationsActions} from '../Warehouse/components/RouteOperationsActions';
import {OperationalIssues} from '../Warehouse/components/OperationalIssues';
import {deliveryRouteLabel,deliveryStopLabel} from '../Warehouse/deliveryLabels';
import {routeProgress} from '../../../../shared/delivery-operations.mjs';
import {orderedStops,nextDeliveryStop,deliveryStopGate} from '../../../../shared/driver-workspace.mjs';
const stamp=v=>v?new Date(v).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):'Belum tercatat';
export function DriverFieldView(){
 const {driverTracking,user,setActiveTab}=useApp();
 const {routes,issues,loading,error,updatedAt,refresh,activeRoute:trip,selectTrip}=useDriverTrips();
 const [selectedStopId,selectStop]=useWorkspaceState('driverStop',''),[modal,setModal]=useState(null);
 const stops=orderedStops(trip),next=nextDeliveryStop(stops),selected=stops.find(s=>s.id===selectedStopId)||next||stops[0],progress=routeProgress(trip||{});
 const detailRef=useSelectedDetail(selectedStopId?selected?.id:null,true);
 const disabled=!!error||trip?.status!=='IN_TRANSIT'||trip?.onHold||!!trip?.returnedAt;
 const destinationGate=deliveryStopGate(stops,selected?.id,trip?.policySnapshot?.values);
 const tripIssues=issues.filter(i=>i.routeId===trip?.id||stops.some(s=>s.id===i.deliveryStopId));
 const save=async(id,data)=>{if(data.logicalResult)await deliveryApi.updateStopStatus(id,{...data.result,photoUrl:data.photoUrl,notes:data.notes});else await deliveryApi.submitDriverAttendance(id,data);setModal(null);await refresh();};
 return <div className="workspace-page logistics-workspace driver-workspace">
  <header className="admin-page-heading"><div><p className="admin-eyebrow">Driver / Pelaksanaan pengiriman</p><h1>Trip saya</h1><p>Trip yang belum ditutup, termasuk penugasan dari tanggal sebelumnya.</p></div><button type="button" className="admin-button" disabled={loading} onClick={refresh}><LuRefreshCw/>{loading?'Memperbarui…':'Perbarui'}</button></header>
  <p role="status" className="admin-footnote">Pembaruan setiap 30 detik · Terakhir berhasil: {stamp(updatedAt)} WIB</p>
  {error&&<p role="alert" className="admin-feedback error">{error} Data terakhir tetap ditampilkan. Perbarui data sebelum melakukan tindakan.</p>}
  {loading&&!routes.length?<p className="admin-empty">Memuat trip yang ditugaskan…</p>:!trip?<section className="admin-panel admin-empty"><h2>Belum ada trip terbuka</h2><p>Hubungi Kepala Gudang untuk memeriksa penugasan Anda.</p></section>:<>
   <section className="admin-panel logistics-trip-heading"><div><span className="admin-status">{deliveryRouteLabel(trip)}</span><h2>{trip.code}</h2><p>{trip.vehicle?.code||'Truk belum ditetapkan'} · {trip.vehicle?.name} · Tanggal trip {trip.date?new Date(trip.date).toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta'}):'Belum tersedia'}</p></div><div className="logistics-heading-tools">{routes.length>1&&<label>Trip yang ditugaskan<select value={trip.id} onChange={e=>{if(window.dispatchEvent(new CustomEvent('app:before-navigate',{cancelable:true}))){selectTrip(e.target.value);selectStop('');}}}>{routes.map(r=><option key={r.id} value={r.id}>{r.code} · {deliveryRouteLabel(r)}</option>)}</select></label>}<button type="button" className="admin-button" onClick={()=>{selectTrip(trip.id);setActiveTab(TAB_IDS.DELIVERY_DRIVER_MAP);}}><LuMapPin/>Peta tujuan</button></div></section>
   <div className="logistics-metrics">{[['Tujuan diproses',`${progress.resolved}/${progress.total}`],['Diterima penuh',progress.delivered],['Diterima sebagian',stops.filter(s=>s.status==='PARTIAL_REJECT').length],['Ditolak',stops.filter(s=>s.status==='REJECTED').length]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
   <section className="admin-panel logistics-next"><div><p className="admin-eyebrow">{trip.returnedAt?'Perjalanan telah kembali':next?'Tujuan berikutnya':'Seluruh tujuan telah diproses'}</p><h2>{trip.returnedAt?'Menunggu pemeriksaan dan penutupan gudang':next?next.outlet?.name:'Konfirmasikan perjalanan kembali'}</h2><p>{trip.onHold?'Trip ditahan. Hubungi Kepala Gudang sebelum melanjutkan.':trip.status==='DRAFT'?'Gudang sedang menyiapkan muatan. Tunggu serah terima.':trip.status==='READY'?'Periksa serah terima muatan dan isi odometer sebelum berangkat.':next?.outlet?.address||'Trip selesai setelah bukti dan retur diperiksa oleh gudang.'}</p></div>{next&&<button type="button" className="admin-button primary" onClick={()=>{selectStop(next.id);detailRef.current?.scrollIntoView({behavior:'smooth',block:'start'});}}>Buka tujuan<LuArrowRight/></button>}</section>
   {!trip.returnedAt&&['READY','COMPLETED','PARTIAL'].includes(trip.status)&&<section className="admin-panel logistics-action-panel"><h2>Tindakan perjalanan</h2><fieldset disabled={!!error}><RouteOperationsActions key={trip.id} route={trip} driver onChanged={refresh}/></fieldset></section>}
   <div className="logistics-split"><section className="admin-panel logistics-stop-list"><div className="admin-panel-heading"><h2>Urutan tujuan</h2><span>{progress.completionPercent}% diproses</span></div><ol>{stops.map((stop,index)=><li key={stop.id}><button type="button" aria-pressed={selected?.id===stop.id} onClick={()=>selectStop(stop.id)}><span className="logistics-sequence">{index+1}</span><span><strong>{stop.outlet?.name||'Outlet'}</strong><small>{deliveryStopLabel(stop.status)}{stop.status==='PENDING'&&stop.arrivedAt?' · Sudah tiba':''}</small><small>{stop.allocatedCartons??0} karton · {stop.packingList?.code}</small></span>{stop.id===next?.id&&<span className="admin-status">Berikutnya</span>}</button></li>)}</ol></section>
    <section ref={detailRef} tabIndex={-1} className="logistics-stop-detail" aria-label="Rincian tujuan pilihan">{selected?<><DriverStopCard policy={trip.policySnapshot?.values} stop={selected} index={stops.indexOf(selected)} totalStops={stops.length} disabled={disabled||destinationGate.blocked} onAbsenIn={()=>setModal({stop:selected,type:'absen_in'})} onMarkDelivered={()=>setModal({stop:selected,type:'delivered'})} onMarkRejected={()=>setModal({stop:selected,type:'rejected'})}/>{destinationGate.reason&&<p role="status" className="admin-feedback">{destinationGate.reason}</p>}{disabled&&selected.status==='PENDING'&&<p className="admin-footnote">Absensi tersedia setelah trip berangkat, tidak ditahan, dan data berhasil diperbarui.</p>}<p className="admin-footnote">Tiba: {stamp(selected.arrivedAt)} · Selesai diproses: {stamp(selected.completedAt)}</p></>:<p className="admin-empty">Trip belum memiliki tujuan.</p>}</section>
   </div>
   <section className="admin-panel logistics-gps"><h2>Status GPS ponsel</h2><p role="status">{driverTracking?.message||'Menunggu informasi GPS.'}</p>{driverTracking?.at&&<p>Terakhir berhasil dikirim: {stamp(driverTracking.at)} WIB · {driverTracking.routeCode||'Trip'}</p>}<p className="admin-footnote">Lokasi langsung tersedia saat halaman aktif, izin GPS diberikan, dan jaringan tersambung. Gudang melihat waktu serta sumber posisi terakhir ketika pembaruan berhenti.</p></section>
   {tripIssues.length>0&&<section className="admin-panel logistics-action-panel"><fieldset disabled={!!error}><OperationalIssues issues={tripIssues} people={[user]} onChanged={refresh}/></fieldset></section>}
  </>}
  {modal&&<DriverAttendanceModal policy={trip?.policySnapshot?.values} stop={modal.stop} type={modal.type} onClose={()=>setModal(null)} onSubmitAttendance={save}/>}
 </div>;
}
