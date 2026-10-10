import React from 'react';
import { LuCalendar, LuTarget, LuTrendingUp, LuCircleCheck } from 'react-icons/lu';
import { MetricCard } from '../../../shared/components/common/MetricCard';
import { formatTarget } from '../../../../../shared/sales-targets.mjs';
import {useApp} from '../../../context/AppContext';
import {selectedReportItems} from '../../../../../shared/report-presentation.mjs';

export function MtdMetrics({ period, summary }) {
  const {settings}=useApp(),selection=selectedReportItems(settings,'REPORT_MTD_WIDGETS');
  const metrics = [
    { label: 'Hari kerja berjalan', icon: LuCalendar, value: period.calendarKnown?period.workingDaysElapsed:'Belum ditetapkan', suffix: period.calendarKnown?`/ ${period.totalWorkingDays} Hari`:'', badge: period.workingDaysRate, description: `Kalender ${period.monthName || ''} ${period.year || ''}` },
    { label: 'Pencapaian target MTD', icon: LuTarget, value: `Rp ${(summary.mtdActualAmount || 0).toLocaleString('id-ID')}`, badge: summary.overallAchievementRate, description: `Target periode: ${formatTarget(summary.monthlyTargetAmount)}`, valueClassName: 'text-xl' },
    { label: 'MTD vs LMA (bulan lalu)', icon: LuTrendingUp, value: summary.mtdToLmaRate, badge: 'Rasio, bukan pertumbuhan', description: `Bulan lalu penuh: Rp ${(summary.lastMonthActual || 0).toLocaleString('id-ID')}` },
    { label: 'Call & effective call', icon: LuCircleCheck, value: summary.mtdEffectiveCallRate, suffix: 'EC', badge: `Call: ${summary.mtdCallComplianceRate}`, description: `${summary.totalMtdEffectiveCalls} toko order (${summary.totalMtdSkuSold} SKU)` },
  ];
  const keyed=Object.fromEntries(['calendar','target','comparison','calls'].map((key,index)=>[key,metrics[index]]));
  return selection.length?<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{selection.map(key => <MetricCard key={key} {...keyed[key]} />)}</div>:null;
}
