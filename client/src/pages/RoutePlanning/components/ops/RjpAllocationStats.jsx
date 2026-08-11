import React from 'react';
import { LuStore, LuCheck, LuActivity, LuLayers } from 'react-icons/lu';

/**
 * RjpAllocationStats Component
 * Single Responsibility: Display 4 key allocation metrics for 400 coverage outlets.
 */
export const RjpAllocationStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total Outlets in Database */}
      <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-teal-700/30 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Outlet Terdata</span>
          <div className="w-8 h-8 rounded-full bg-teal-700/10 text-teal-700 flex items-center justify-center shrink-0">
            <LuStore className="text-lg" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">{stats.totalOutlets} Toko</div>
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <span className="text-blue-600 font-bold">{stats.gtCount} GT</span>
            <span className="text-border-glass">|</span>
            <span className="text-purple-600 font-bold">{stats.mtCount} MT</span>
          </div>
        </div>
      </div>

      {/* Metric 2: Allocated to Clusters */}
      <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-emerald-600/30 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Teralokasi ke Cluster</span>
          <div className="w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0">
            <LuCheck className="text-lg" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">
            {stats.totalAllocated} <span className="text-sm font-semibold text-emerald-600">({stats.allocationPercentage}%)</span>
          </div>
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <span className="text-blue-600 font-bold">{stats.gtAllocated} GT</span>
            <span className="text-border-glass">|</span>
            <span className="text-purple-600 font-bold">{stats.mtAllocated} MT</span>
          </div>
        </div>
      </div>

      {/* Metric 3: Unallocated Outlets */}
      <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-amber-500/30 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Belum Tercover</span>
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <LuActivity className="text-lg" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">{stats.unallocatedCount} Toko</div>
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <span className="text-blue-600 font-bold">{stats.gtCount - stats.gtAllocated} GT</span>
            <span className="text-border-glass">|</span>
            <span className="text-purple-600 font-bold">{stats.mtCount - stats.mtAllocated} MT</span>
          </div>
        </div>
      </div>

      {/* Metric 4: Active Master Clusters */}
      <div className="bg-surface border border-border-glass rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-purple-600/30 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Cluster Aktif</span>
          <div className="w-8 h-8 rounded-full bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0">
            <LuLayers className="text-lg" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">{stats.activeClustersCount} Klaster</div>
          <div className="text-xs text-on-surface-variant">Dikelola oleh Supervisor Lapangan</div>
        </div>
      </div>
    </div>
  );
};
