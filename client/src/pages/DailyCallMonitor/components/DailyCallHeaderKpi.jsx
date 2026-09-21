import React from 'react';
import {
  LuPhoneCall,
  LuShoppingBag,
  LuCircleCheck,
  LuClock,
  LuTrendingUp,
} from 'react-icons/lu';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * DailyCallHeaderKpi Component
 * Single Responsibility: Render KPI cards for Daily Call Plan, EC Rate, Revenue, and Anomalies.
 */
export const DailyCallHeaderKpi = ({ summary = {}, onSelectAnomalies }) => {
  const {
    totalPlanCalls = 0,
    totalActualCalls = 0,
    totalEffectiveCalls = 0,
    effectiveCallRate = '0%',
    totalOrderAmount = 0,
    totalSkuSold = 0,
    avgDurationMinutes = 0,
    totalDurationAnomalies = 0,
    totalDistanceAnomalies = 0,
    totalAnomalies = 0,
  } = summary;

  const actualRate = totalPlanCalls > 0 ? Math.round((totalActualCalls / totalPlanCalls) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
      {/* 1. Plan vs Actual Calls */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-semibold">Total Kunjungan</span>
          <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface border border-border-glass flex items-center justify-center shrink-0">
            <LuPhoneCall className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-xl md:text-2xl font-black text-on-surface tracking-tight">
            {totalActualCalls} <span className="text-xs font-normal text-on-surface-variant">/ {totalPlanCalls} Plan</span>
          </div>
          <span className="text-xs font-bold font-mono text-on-surface bg-surface-container border border-border-glass px-2 py-0.5 rounded-lg">
            {actualRate}%
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant m-0 truncate">Realisasi Call Plan Hari Ini</p>
      </div>

      {/* 2. Effective Calls (EC) */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-semibold">Effective Call (EC)</span>
          <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface border border-border-glass flex items-center justify-center shrink-0">
            <LuCircleCheck className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-xl md:text-2xl font-black text-on-surface tracking-tight">
            {totalEffectiveCalls} <span className="text-xs font-normal text-on-surface-variant">Toko Order</span>
          </div>
          <span className="text-xs font-bold font-mono text-on-surface bg-surface-container border border-border-glass px-2 py-0.5 rounded-lg">
            {effectiveCallRate}
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant m-0 truncate">Kunjungan transaksi berhasil</p>
      </div>

      {/* 3. Omzet Order of The Day */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-semibold">Order Of The Day</span>
          <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface border border-border-glass flex items-center justify-center shrink-0">
            <LuShoppingBag className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-lg md:text-xl font-black text-on-surface tracking-tight">
            Rp {(totalOrderAmount || 0).toLocaleString('id-ID')}
          </div>
          <span className="text-xs font-bold font-mono text-on-surface bg-surface-container border border-border-glass px-2 py-0.5 rounded-lg">
            {totalSkuSold} SKU
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant m-0 truncate">Rata-rata durasi: {avgDurationMinutes} Menit</p>
      </div>

      {/* 4. Monitoring Anomali */}
      <div
        onClick={onSelectAnomalies}
        role="button"
        tabIndex={0}
        title="Klik untuk membuka Tabel Khusus Audit Absensi Janggal"
        className="bg-surface border border-border-glass hover:bg-surface-container rounded-2xl p-4 shadow-xs space-y-2 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-semibold">Peringatan & Anomali</span>
          <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface border border-border-glass flex items-center justify-center shrink-0">
            <FiAlertTriangle className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-xl md:text-2xl font-black text-on-surface tracking-tight">
            {totalAnomalies} <span className="text-xs font-normal text-on-surface-variant">Kasus</span>
          </div>
          {totalAnomalies > 0 ? (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
              Perlu Evaluasi &rarr;
            </span>
          ) : (
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container border border-border-glass px-2 py-0.5 rounded-lg">
              Normal
            </span>
          )}
        </div>
        <p className="text-[11px] text-on-surface-variant m-0 truncate">
          Durasi &lt; 5m: {totalDurationAnomalies} • Jarak &gt; 50m: {totalDistanceAnomalies}
        </p>
      </div>
    </div>
  );
};

