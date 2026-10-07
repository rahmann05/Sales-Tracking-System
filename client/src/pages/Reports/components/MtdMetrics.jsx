import React from 'react';
import { LuCalendar, LuTarget, LuTrendingUp, LuCircleCheck } from 'react-icons/lu';
import { MetricCard } from '../../../shared/components/common/MetricCard';

export function MtdMetrics({ period, summary }) {
  const metrics = [
    { label: 'Hari kerja berjalan', icon: LuCalendar, value: period.workingDaysElapsed, suffix: `/ ${period.totalWorkingDays} Hari`, badge: period.workingDaysRate, description: `Progress ${period.monthName} ${period.year}` },
    { label: 'Pencapaian target MTD', icon: LuTarget, value: `Rp ${(summary.mtdActualAmount || 0).toLocaleString('id-ID')}`, badge: summary.overallAchievementRate, description: `Target: Rp ${(summary.monthlyTargetAmount || 0).toLocaleString('id-ID')}`, valueClassName: 'text-xl' },
    { label: 'MTD vs LMA (bulan lalu)', icon: LuTrendingUp, value: summary.mtdToLmaRate, badge: 'MoM Growth', description: `LMA: Rp ${(summary.lastMonthActual || 0).toLocaleString('id-ID')}` },
    { label: 'Call & effective call', icon: LuCircleCheck, value: summary.mtdEffectiveCallRate, suffix: 'EC', badge: `Call: ${summary.mtdCallComplianceRate}`, description: `${summary.totalMtdEffectiveCalls} toko order (${summary.totalMtdSkuSold} SKU)` },
  ];
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{metrics.map(metric => <MetricCard key={metric.label} {...metric} />)}</div>;
}
