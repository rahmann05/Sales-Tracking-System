import { reportMoney } from '../../../../../shared/report-visibility.mjs';
import React from 'react';
import { LuPhoneCall, LuShoppingBag, LuCircleCheck } from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';
import { MetricCard } from '../../../shared/components/common/MetricCard';

/**
 * DailyCallHeaderKpi Component
 * Single Responsibility: Render KPI cards for Daily Call Plan, EC Rate, Revenue, and Anomalies.
 */
export const DailyCallHeaderKpi = ({ summary = {}, onSelectAnomalies }) => {
  const {
    totalPlanCalls = 0,
    totalActualCalls = 0,
    totalPlannedActualCalls = 0,
    totalEffectiveCalls = 0,
    effectiveCallRate = '0%',
    totalOrderAmount = 0,
    totalSkuSold = 0,
    avgDurationMinutes = null,
    totalDurationAnomalies = 0,
    totalDistanceAnomalies = 0,
    totalAnomalies = 0,
  } = summary;

  const actualRate =
    totalPlanCalls > 0 ? Math.round((totalPlannedActualCalls / totalPlanCalls) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <MetricCard
        label="Realisasi PJP"
        icon={LuPhoneCall}
        value={totalPlannedActualCalls}
        suffix={`/ ${totalPlanCalls} PJP`}
        badge={`${actualRate}%`}
        description={`${totalActualCalls} kunjungan aktual, termasuk ${totalActualCalls - totalPlannedActualCalls} di luar PJP`}
      />
      <MetricCard
        label="Effective Call (EC)"
        icon={LuCircleCheck}
        value={totalEffectiveCalls}
        suffix="Kunjungan EC"
        badge={effectiveCallRate}
        description="Kunjungan transaksi berhasil"
      />
      <MetricCard
        label="Nilai order disetujui"
        icon={LuShoppingBag}
        value={reportMoney(totalOrderAmount)}
        badge={`${totalSkuSold} SKU`}
        valueClassName="text-xl"
        description={`Rata-rata durasi: ${avgDurationMinutes == null ? 'Tidak tersedia' : `${avgDurationMinutes} menit`}`}
      />
      <button
        type="button"
        onClick={onSelectAnomalies}
        title="Klik untuk membuka Tabel Khusus Audit Absensi Janggal"
        className="app-card bg-surface border border-border-glass hover:bg-surface-container/60 rounded-xl p-4 text-left transition-colors cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
          <FiAlertTriangle aria-hidden="true" className="text-lg shrink-0" />
          <span>Peringatan &amp; Anomali</span>
        </div>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="text-2xl font-semibold text-on-surface">
            {totalAnomalies} <span className="text-xs font-normal text-on-surface-variant">Kasus</span>
          </div>
          <span
            className={totalAnomalies > 0 ? 'admin-status admin-status-rejected' : 'admin-status'}
          >
            {totalAnomalies > 0 ? 'Perlu Evaluasi →' : 'Belum terdeteksi'}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mt-2">
          Di bawah batas durasi: {totalDurationAnomalies} · Di luar radius aturan:{' '}
          {totalDistanceAnomalies}
        </p>
      </button>
    </div>
  );
};
