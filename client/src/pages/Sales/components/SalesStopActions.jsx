import React from 'react';
import {useApp} from '../../../context/AppContext';
import {OutletLockBadge} from './OutletLockBadge';
import {VisitDurationTimer} from './VisitDurationTimer';
import {activeVisitStatuses,completedVisitStatuses,visitStatusLabel} from '../salesPresentation';
export function SalesStopActions({stop,isLocked,lockReason,onRequestUnlock,onAbsenIn,onAbsenOut,onInputOrder,onClosedReport}){
  const {settings}=useApp();
  if(!stop)return null;
  if(isLocked)return <OutletLockBadge stop={stop} lockReason={lockReason} onRequestUnlock={onRequestUnlock}/>;
  const active=activeVisitStatuses.includes(stop.status);
  return <section className="sales-visit-actions" aria-label="Tindakan kunjungan">
    {stop.status==='PENDING'&&<><p>Mulai presensi masuk setelah tiba di outlet. Foto dan lokasi mengikuti aturan yang berlaku.</p><button type="button" className="app-button app-button-primary" onClick={()=>onAbsenIn(stop)}>Absen masuk</button></>}
    {active&&<><VisitDurationTimer startTime={stop.inTimestamp} minMinutes={settings.ATTENDANCE_ENFORCE_MIN_DURATION?settings.MINIMUM_VISIT_DURATION_MINUTES:0}/><div className="app-actions">{stop.status!=='ORDERED'&&<button type="button" className="app-button app-button-primary" onClick={()=>onInputOrder(stop)}>Buat order</button>}<button type="button" className="app-button" onClick={()=>onAbsenOut(stop)}>Catat hasil & absen keluar</button></div><p className="sales-note">Kunjungan boleh untuk order, penagihan sebelumnya, atau keduanya. Hasil penagihan dicatat saat absen keluar; pembayaran dilakukan di luar aplikasi.</p></>}
    {['PENDING',...activeVisitStatuses].includes(stop.status)&&<details><summary>Kendala kunjungan</summary><div className="app-actions">{stop.status!=='ORDERED'&&<button type="button" className="app-button" onClick={()=>onClosedReport(stop)}>Laporkan toko tutup</button>}<button type="button" className="app-button" onClick={()=>onRequestUnlock(stop)}>Ajukan pengecualian presensi</button></div></details>}
    {completedVisitStatuses.includes(stop.status)&&<p>Kunjungan selesai. Periksa hasil dan bukti presensi di bawah.</p>}
    {['CLOSED','CLOSED_REPORTED','SKIPPED'].includes(stop.status)&&<p>{visitStatusLabel(stop.status)}. Ikuti keputusan Supervisor sebelum melanjutkan.</p>}
  </section>;
}
