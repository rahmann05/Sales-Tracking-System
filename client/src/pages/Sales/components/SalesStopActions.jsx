import {visitPolicy,featureAvailable} from '../../../../../shared/operational-policy.mjs';
import React from 'react';
import {useApp} from '../../../context/AppContext';
import {OutletLockBadge} from './OutletLockBadge';
import {VisitDurationTimer} from './VisitDurationTimer';
import {activeVisitStatuses,completedVisitStatuses,visitStatusLabel} from '../salesPresentation';
export function SalesStopActions({stop,isLocked,lockReason,onRequestUnlock,onAbsenIn,onAbsenOut,onInputOrder,onClosedReport}){
  const {settings}=useApp();
  if(!stop)return null;
  if(isLocked)return <OutletLockBadge stop={stop} lockReason={lockReason} onRequestUnlock={onRequestUnlock}/>;
  const frozen={...settings,...stop.policySnapshot?.values},policy=visitPolicy(frozen);
  const active=activeVisitStatuses.includes(stop.status);
  const complete=completedVisitStatuses.includes(stop.status);
  const canOrder=featureAvailable(settings,'ORDERS')&&stop.status!=='ORDERED'&&(active||(stop.status==='PENDING'&&(policy.mode==='OPTIONAL'||frozen.ORDER_REQUIRE_CHECKIN===false))||(complete&&frozen.ORDER_ALLOW_AFTER_VISIT===true));
  return <section className="sales-visit-actions" aria-label="Tindakan kunjungan">
    {stop.status==='PENDING'&&<><p>Mulai kegiatan setelah tiba di outlet. Bukti presensi mengikuti aturan yang berlaku.</p><button type="button" className="app-button app-button-primary" disabled={!featureAvailable(settings,'SALES_VISITS')} onClick={()=>onAbsenIn(stop)}>{policy.mode==='OPTIONAL'?'Mulai kegiatan':'Absen masuk'}</button></>}
    {active&&<>{policy.requireOut&&<VisitDurationTimer startTime={stop.inTimestamp} minMinutes={frozen.ATTENDANCE_ENFORCE_MIN_DURATION?frozen.MINIMUM_VISIT_DURATION_MINUTES:0}/>}<div className="app-actions">{canOrder&&<button type="button" className="app-button app-button-primary" onClick={()=>onInputOrder(stop)}>Buat order</button>}<button type="button" className="app-button" onClick={()=>onAbsenOut(stop)}>{policy.requireOut?'Catat hasil & absen keluar':'Catat hasil & selesai'}</button></div><p className="sales-note">Kunjungan boleh untuk order, penagihan sebelumnya, atau keduanya. Hasil penagihan dicatat bersama hasil kunjungan; pembayaran dilakukan di luar aplikasi.</p></>}
    {['PENDING',...activeVisitStatuses].includes(stop.status)&&<details><summary>Kendala kunjungan</summary><div className="app-actions">{stop.status!=='ORDERED'&&<button type="button" className="app-button" onClick={()=>onClosedReport(stop)}>Laporkan toko tutup</button>}{featureAvailable(settings,'UNLOCK')&&<button type="button" className="app-button" onClick={()=>onRequestUnlock(stop)}>Ajukan pengecualian presensi</button>}</div></details>}
    {!active&&canOrder&&<button type="button" className="app-button app-button-primary" onClick={()=>onInputOrder(stop)}>Buat order{complete?' setelah kunjungan':''}</button>}
    {complete&&<p>Kunjungan selesai. Periksa hasil dan bukti presensi di bawah.</p>}
    {['CLOSED','CLOSED_REPORTED','SKIPPED'].includes(stop.status)&&<p>{visitStatusLabel(stop.status)}. Ikuti keputusan Supervisor sebelum melanjutkan.</p>}
  </section>;
}
