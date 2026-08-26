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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* 1. Plan vs Actual Calls */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-semibold">Total Kunjungan</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <LuPhoneCall className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-xl md:text-2xl font-black text-on-surface">
            {totalActualCalls} <span className="text-xs font-normal text-on-surface-variant">/ {totalPlanCalls} Plan</span>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-lg">
            {actualRate}%
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant m-0">Realisasi Call Plan Hari Ini</p>
      </div>

      {/* 2. Effective Calls (EC) */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-semibold">Effective Call (EC)</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <LuCircleCheck className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-xl md:text-2xl font-black text-emerald-600">
            {totalEffectiveCalls} <span className="text-xs font-normal text-on-surface-variant">Toko Order</span>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
            {effectiveCallRate}
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant m-0">Kunjungan yang menghasilkan transaksi</p>
      </div>

      {/* 3. Omzet Order of The Day */}
      <div className="bg-surface border border-border-glass rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-semibold">Order Of The Day</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <LuShoppingBag className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-lg md:text-xl font-black text-on-surface">
            Rp {(totalOrderAmount || 0).toLocaleString('id-ID')}
          </div>
          <span className="text-xs font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-lg">
            {totalSkuSold} SKU
          </span>
        </div>
        <p className="text-[11px] text-on-surface-variant m-0">Rata-rata durasi: {avgDurationMinutes} Menit</p>
      </div>

      {/* 4. Monitoring Anomali */}
      <div
        onClick={onSelectAnomalies}
        role="button"
        tabIndex={0}
        title="Klik untuk membuka Tabel Khusus Audit Absensi Janggal"
        className={`border rounded-2xl p-4 shadow-sm space-y-2 cursor-pointer transition-all hover:scale-[1.01] ${
          totalAnomalies > 0
            ? 'bg-rose-500/5 border-rose-500/30 hover:bg-rose-500/10'
            : 'bg-surface border-border-glass hover:bg-surface-container'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-semibold">Peringatan & Anomali</span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              totalAnomalies > 0 ? 'bg-rose-500/15 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
            }`}
          >
            <FiAlertTriangle className="text-base" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div
            className={`text-xl md:text-2xl font-black ${
              totalAnomalies > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {totalAnomalies} <span className="text-xs font-normal text-on-surface-variant">Kasus</span>
          </div>
          {totalAnomalies > 0 ? (
            <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-lg">
              Perlu Evaluasi &rarr;
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
              Normal
            </span>
          )}
        </div>
        <p className="text-[11px] text-on-surface-variant m-0">
          Durasi &lt; 5m: {totalDurationAnomalies} • Jarak &gt; 50m: {totalDistanceAnomalies}
        </p>
      </div>
    </div>
  );
};

