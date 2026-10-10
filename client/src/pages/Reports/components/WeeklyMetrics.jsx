import React from 'react';
import { LuPhoneCall, LuShoppingBag, LuCircleCheck } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';
import { MetricCard } from '../../../shared/components/common/MetricCard';
import {useApp} from '../../../context/AppContext';
import {selectedReportItems} from '../../../../../shared/report-presentation.mjs';

export function WeeklyMetrics({ summary }) {
  const {settings}=useApp(),selection=selectedReportItems(settings,'REPORT_WEEKLY_WIDGETS');
  const metrics = [
    { label: 'Total kunjungan mingguan', icon: LuPhoneCall, value: summary.totalActualCalls, suffix: 'Kunjungan', badge: `${summary.callComplianceRate} terjadwal`, description: `${summary.totalPlanCalls} rencana terjadwal · ${summary.totalOffPjpCalls||0} kunjungan luar PJP` },
    { label: 'Effective call (EC)', icon: LuCircleCheck, value: summary.totalEffectiveCalls, suffix: 'Kunjungan efektif', badge: summary.effectiveCallRate, description: 'Rasio kunjungan menghasilkan penjualan yang diakui laporan' },
    { label: 'Nilai order disetujui mingguan (WTD)', icon: LuShoppingBag, value: `Rp ${(summary.totalOrderAmount || 0).toLocaleString('id-ID')}`, badge: `${summary.totalSkuSold} SKU`, description: summary.durationSamples?`Rata-rata durasi: ${summary.avgDurationMinutes} menit · ${summary.durationSamples} kunjungan dengan bukti durasi`:'Durasi belum tersedia; bukti masuk–keluar tidak cukup.', valueClassName: 'text-xl' },
    { label: 'Anomali lapangan', icon: FiAlertTriangle, value: summary.totalAnomalies, suffix: 'Kasus', alert: summary.totalAnomalies > 0, badge: summary.totalAnomalies > 0 ? 'Perlu evaluasi' : 'Tidak terdeteksi', description: 'Durasi di bawah ambang aturan kunjungan atau deviasi radius; hanya dari bukti tersedia.' },
  ];
  const keyed=Object.fromEntries(['calls','ec','revenue','anomalies'].map((key,index)=>[key,metrics[index]]));
  return selection.length?<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{selection.map(key => <MetricCard key={key} {...keyed[key]} />)}</div>:null;
}
