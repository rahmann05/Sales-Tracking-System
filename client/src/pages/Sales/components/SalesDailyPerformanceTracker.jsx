import React from 'react';
import {calculateSalesPerformance} from '../../../services/salesPerformanceService';
export function SalesDailyPerformanceTracker({salesStops=[],offPjpAttendances=[],targetDailyVisits}){
  const m=calculateSalesPerformance({salesStops,offPjpAttendances,targetDailyVisits});
  const hasTarget=Number.isFinite(Number(targetDailyVisits))&&Number(targetDailyVisits)>0;
  return <section className="sales-metrics" aria-label="Ringkasan kunjungan hari ini"><div><span>PJP selesai</span><strong>{m.rjpCompleted} <small>/ {m.rjpTotal}</small></strong><p>Tutup dan dilewati dihitung terpisah.</p></div><div><span>Luar PJP tervalidasi</span><strong>{m.offPjpValidated}</strong><p>{m.offPjpPending} menunggu keputusan Supervisor.</p></div><div><span>Target kunjungan valid</span><strong>{m.totalValidVisits} <small>/ {hasTarget?targetDailyVisits:'—'}</small></strong><p>{hasTarget?(m.totalValidVisits>=targetDailyVisits?'Target harian tercapai.':`Masih kurang ${m.remainingToTarget} kunjungan.`):'Target belum ditetapkan.'}</p></div><div><span>Tutup / dilewati</span><strong>{m.rjpClosed+m.rjpSkipped}</strong><p>Periksa laporan dan keputusan pada detail outlet.</p></div></section>;
}
