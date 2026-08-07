import React from 'react';
import { LuStore, LuCheck, LuActivity, LuLayers } from 'react-icons/lu';
import '../../../../styles/components/RjpAllocationStats.css';

/**
 * RjpAllocationStats Component
 * Single Responsibility: Display 4 key allocation metrics for 400 coverage outlets.
 * 1 File = 1 Component
 */
export const RjpAllocationStats = ({ stats }) => {
  return (
    <div className="rjp-stats-grid">
      {/* Metric 1: Total Outlets in Database */}
      <div className="rjp-stat-card">
        <div className="rjp-stat-top">
          <span className="rjp-stat-label">Total Outlet Terdata</span>
          <div className="rjp-stat-icon teal">
            <LuStore />
          </div>
        </div>
        <div className="rjp-stat-value">{stats.totalOutlets} Toko</div>
        <div className="rjp-stat-subtext">Coverage Bandung Barat & Cimahi</div>
      </div>

      {/* Metric 2: Allocated to Clusters */}
      <div className="rjp-stat-card">
        <div className="rjp-stat-top">
          <span className="rjp-stat-label">Teralokasi ke Cluster</span>
          <div className="rjp-stat-icon emerald">
            <LuCheck />
          </div>
        </div>
        <div className="rjp-stat-value">
          {stats.totalAllocated} <span className="text-sm font-semibold text-emerald-600">({stats.allocationPercentage}%)</span>
        </div>
        <div className="rjp-stat-subtext">Sudah masuk master rute RJP</div>
      </div>

      {/* Metric 3: Unallocated Outlets */}
      <div className="rjp-stat-card">
        <div className="rjp-stat-top">
          <span className="rjp-stat-label">Belum Tercover</span>
          <div className="rjp-stat-icon amber">
            <LuActivity />
          </div>
        </div>
        <div className="rjp-stat-value">{stats.unallocatedCount} Toko</div>
        <div className="rjp-stat-subtext">Perlu penambahan klaster baru</div>
      </div>

      {/* Metric 4: Active Master Clusters */}
      <div className="rjp-stat-card">
        <div className="rjp-stat-top">
          <span className="rjp-stat-label">Total Cluster Aktif</span>
          <div className="rjp-stat-icon purple">
            <LuLayers />
          </div>
        </div>
        <div className="rjp-stat-value">{stats.activeClustersCount} Klaster</div>
        <div className="rjp-stat-subtext">Dikelola oleh Supervisor Lapangan</div>
      </div>
    </div>
  );
};
