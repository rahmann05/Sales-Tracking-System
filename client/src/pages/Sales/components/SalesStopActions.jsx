import {salesVisitActions} from '../../../../../shared/sales-visit-actions.mjs';
import React from 'react';
import {useApp} from '../../../context/AppContext';
import {OutletLockBadge} from './OutletLockBadge';
import {VisitDurationTimer} from './VisitDurationTimer';
import {activeVisitStatuses,visitStatusLabel} from '../salesPresentation';
export function SalesStopActions({stop,isLocked,lockReason,onRequestUnlock,onAbsenIn,onAbsenOut,onInputOrder,onClosedReport}){
  const {settings,user}=useApp();
  if(!stop)return null;
  const {canStart,canRequestException,canReportClosed,canOrder,frozen,policy,active,complete,lockedEntry}=salesVisitActions({stop,isLocked,settings,user});
  if(lockedEntry)return canRequestException?<OutletLockBadge stop={stop} lockReason={lockReason} onRequestUnlock={onRequestUnlock}/>:<p className="app-notice">{lockReason||'Outlet memerlukan pengecualian presensi.'} Pengajuan pengecualian tidak tersedia untuk akun atau aturan saat ini.</p>;
  return <section className="sales-visit-actions" aria-label="Tindakan kunjungan">
    {isLocked&&active&&<p className="app-notice">Outlet kini dikunci. Kunjungan yang sudah berjalan tetap dapat diselesaikan.</p>}
    {stop.status==='PENDING'&&<><p>Mulai kegiatan setelah tiba di outlet. Bukti presensi mengikuti aturan yang berlaku.</p><button type="button" className="app-button app-button-primary" disabled={!canStart} onClick={()=>onAbsenIn(stop)}>{policy.mode==='OPTIONAL'?'Mulai kegiatan':'Absen masuk'}</button></>}
    {active&&<>{policy.requireOut&&<VisitDurationTimer startTime={stop.inTimestamp} minMinutes={frozen.ATTENDANCE_ENFORCE_MIN_DURATION?frozen.MINIMUM_VISIT_DURATION_MINUTES:0}/>}<div className="app-actions">{canOrder&&<button type="button" className="app-button app-button-primary" onClick={()=>onInputOrder(stop)}>Buat order</button>}<button type="button" className="app-button" onClick={()=>onAbsenOut(stop)}>{policy.requireOut?'Catat hasil & absen keluar':'Catat hasil & selesai'}</button></div><p className="sales-note">Kunjungan boleh untuk order, penagihan sebelumnya, atau keduanya. Hasil penagihan dicatat bersama hasil kunjungan; pembayaran dilakukan di luar aplikasi.</p></>}
    {['PENDING',...activeVisitStatuses].includes(stop.status)&&(canReportClosed||canRequestException)&&<details><summary>Kendala kunjungan</summary><div className="app-actions">{canReportClosed&&<button type="button" className="app-button" onClick={()=>onClosedReport(stop)}>Laporkan toko tutup</button>}{canRequestException&&<button type="button" className="app-button" onClick={()=>onRequestUnlock(stop)}>Ajukan pengecualian presensi</button>}</div></details>}
    {!active&&canOrder&&<button type="button" className="app-button app-button-primary" onClick={()=>onInputOrder(stop)}>Buat order{complete?' setelah kunjungan':''}</button>}
    {complete&&<p>Kunjungan selesai. Periksa hasil dan bukti presensi di bawah.</p>}
    {['CLOSED','CLOSED_REPORTED','SKIPPED'].includes(stop.status)&&<p>{visitStatusLabel(stop.status)}. Ikuti keputusan Supervisor sebelum melanjutkan.</p>}
  </section>;
}
