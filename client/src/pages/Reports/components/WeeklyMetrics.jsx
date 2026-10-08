import React from 'react';
import { LuPhoneCall, LuShoppingBag, LuCircleCheck } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';
import { MetricCard } from '../../../shared/components/common/MetricCard';

export function WeeklyMetrics({ summary }) {
  const metrics = [
    { label: 'Total kunjungan mingguan', icon: LuPhoneCall, value: summary.totalActualCalls, suffix: `/ ${summary.totalPlanCalls} Plan`, badge: summary.callComplianceRate, description: 'Kunjungan terjadwal / rencana periode' },
    { label: 'Effective call (EC)', icon: LuCircleCheck, value: summary.totalEffectiveCalls, suffix: 'Toko order', badge: summary.effectiveCallRate, description: 'Rasio toko menghasilkan pesanan' },
    { label: 'Nilai order disetujui mingguan (WTD)', icon: LuShoppingBag, value: `Rp ${(summary.totalOrderAmount || 0).toLocaleString('id-ID')}`, badge: `${summary.totalSkuSold} SKU`, description: `Rata-rata durasi: ${summary.avgDurationMinutes} menit · ${summary.durationSamples || 0} kunjungan selesai`, valueClassName: 'text-xl' },
    { label: 'Anomali lapangan', icon: FiAlertTriangle, value: summary.totalAnomalies, suffix: 'Kasus', alert: summary.totalAnomalies > 0, badge: summary.totalAnomalies > 0 ? 'Perlu evaluasi' : 'Normal', description: 'Total kunjungan < 5m atau deviasi radius' },
  ];
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{metrics.map(metric => <MetricCard key={metric.label} {...metric} />)}</div>;
}
